#!/usr/bin/env node

const baseUrl = (process.env.UMAMI_INIT_BASE_URL || "http://umami:3000").replace(/\/$/, "");
const username = (process.env.UMAMI_INIT_ADMIN_USERNAME || "admin").trim();
const password = process.env.UMAMI_INIT_ADMIN_PASSWORD || "umami";
const websiteId = process.env.UMAMI_INIT_WEBSITE_ID?.trim();
const websiteName = process.env.UMAMI_INIT_WEBSITE_NAME?.trim();
const websiteDomain = process.env.UMAMI_INIT_WEBSITE_DOMAIN?.trim();

const reportDefinitions = [
  {
    type: "goal",
    name: "Goal: Job application success",
    description: "Tracks successful job application submissions.",
    parameters: {
      type: "event",
      value: "job_application_submit_success",
    },
  },
  {
    type: "funnel",
    name: "Funnel: Job application flow",
    description: "Tracks progression from job detail view to successful application submission.",
    parameters: {
      steps: [
        { type: "event", value: "job_detail_view" },
        { type: "event", value: "job_apply_click" },
        { type: "event", value: "job_application_form_open" },
        { type: "event", value: "job_application_submit_start" },
        { type: "event", value: "job_application_submit_success" },
      ],
      window: 30,
    },
  },
];

function log(message) {
  console.log(`[umami-bootstrap] ${message}`);
}

function fail(message) {
  throw new Error(message);
}

async function parseResponse(response) {
  const contentType = response.headers.get("content-type") || "";

  if (contentType.includes("application/json")) {
    return response.json();
  }

  return response.text();
}

async function request(path, options = {}) {
  const response = await fetch(`${baseUrl}${path}`, options);
  const body = await parseResponse(response);

  if (!response.ok) {
    const detail = typeof body === "string" ? body : JSON.stringify(body);
    const error = new Error(`HTTP ${response.status} for ${path}: ${detail}`);
    error.status = response.status;
    throw error;
  }

  return body;
}

async function login() {
  try {
    const result = await request("/api/auth/login", {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({
        username,
        password,
      }),
    });

    return result.token;
  } catch (error) {
    if (error.status === 401 || error.status === 403) {
      log(
        `Skipping website bootstrap because Umami login failed for ${username}. ` +
        "If the admin password has already been changed, update UMAMI_INIT_ADMIN_PASSWORD."
      );
      return null;
    }

    throw error;
  }
}

function getWebsiteConflict(websites) {
  return websites.find((website) => {
    if (website.id === websiteId) {
      return false;
    }

    return website.domain === websiteDomain;
  });
}

function normalizeReport(report) {
  return JSON.stringify({
    websiteId: report.websiteId,
    type: report.type,
    name: report.name,
    description: report.description || "",
    parameters: report.parameters,
  });
}

async function ensureWebsite(headers) {
  const websitesResult = await request("/api/websites?page=1&pageSize=100", {
    headers,
  });
  const websites = Array.isArray(websitesResult?.data) ? websitesResult.data : [];

  const existing = websites.find((website) => website.id === websiteId);
  const conflict = getWebsiteConflict(websites);

  if (conflict) {
    fail(
      `Website domain ${websiteDomain} already exists under ID ${conflict.id}, ` +
      `but configuration expects ${websiteId}. Resolve the mismatch before continuing.`
    );
  }

  if (existing) {
    const needsUpdate = existing.name !== websiteName || existing.domain !== websiteDomain;

    if (!needsUpdate) {
      log(`Website ${websiteDomain} already exists with the expected ID ${websiteId}.`);
      return existing;
    }

    const updated = await request(`/api/websites/${websiteId}`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        name: websiteName,
        domain: websiteDomain,
      }),
    });

    log(`Updated website ${websiteDomain} (${websiteId}).`);
    return updated;
  }

  const created = await request("/api/websites", {
    method: "POST",
    headers,
    body: JSON.stringify({
      id: websiteId,
      name: websiteName,
      domain: websiteDomain,
    }),
  });

  log(`Created website ${created.domain} (${created.id}).`);
  return created;
}

async function ensureReport(headers, websiteIdValue, definition, existingReports) {
  const desiredReport = {
    websiteId: websiteIdValue,
    type: definition.type,
    name: definition.name,
    description: definition.description,
    parameters: definition.parameters,
  };

  const existing = existingReports.find((report) => report.type === definition.type && report.name === definition.name);

  if (!existing) {
    const created = await request("/api/reports", {
      method: "POST",
      headers,
      body: JSON.stringify(desiredReport),
    });

    log(`Created ${definition.type} report "${definition.name}".`);
    return created;
  }

  if (normalizeReport(existing) === normalizeReport(desiredReport)) {
    log(`${definition.type} report "${definition.name}" already matches the expected configuration.`);
    return existing;
  }

  const updated = await request(`/api/reports/${existing.id}`, {
    method: "POST",
    headers,
    body: JSON.stringify(desiredReport),
  });

  log(`Updated ${definition.type} report "${definition.name}".`);
  return updated;
}

async function ensureReports(headers, websiteIdValue) {
  const reportsResult = await request(`/api/reports?websiteId=${websiteIdValue}&page=1&pageSize=100`, {
    headers,
  });
  const existingReports = Array.isArray(reportsResult?.data) ? reportsResult.data : [];

  for (const definition of reportDefinitions) {
    await ensureReport(headers, websiteIdValue, definition, existingReports);
  }
}

async function main() {
  if (!websiteId || !websiteName || !websiteDomain) {
    fail("Missing UMAMI_INIT_WEBSITE_ID, UMAMI_INIT_WEBSITE_NAME, or UMAMI_INIT_WEBSITE_DOMAIN.");
  }

  const token = await login();

  if (!token) {
    return;
  }

  const headers = {
    authorization: `Bearer ${token}`,
    "content-type": "application/json",
  };

  const website = await ensureWebsite(headers);
  await ensureReports(headers, website.id || websiteId);
}

main().catch((error) => {
  console.error(`[umami-bootstrap] ${error.message}`);
  process.exit(1);
});
