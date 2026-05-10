#!/usr/bin/env node

require('module-alias/register');

const fs = require('node:fs');
const path = require('node:path');
const registry = require('@/container.registry');

const ROOT = process.cwd();
const OUTPUT_DIR = path.join(ROOT, 'reports', 'container-graph');

const INFRA_TOKENS = new Set(Object.keys(registry.infrastructure || {}));
const PORT_TOKENS = new Set(
    Object.entries(registry.infrastructure || {})
        .filter(([token, definition]) =>
            token.endsWith('Port')
            || String(definition?.modulePath || '').includes('/ports/')
        )
        .map(([token]) => token)
);

const toAbsoluteModulePath = (modulePath) => {
    const resolved = require.resolve(modulePath, { paths: [ROOT] });
    return path.isAbsolute(resolved) ? resolved : path.resolve(ROOT, resolved);
};

const getDomainServiceAndRepositoryEntries = () => {
    const serviceEntries = [];
    const repositoryEntries = [];

    for (const modulePath of registry.domainModules || []) {
        const moduleDefinition = require(modulePath);
        const registrations = moduleDefinition?.registrations || {};

        for (const [token, registrationEntry] of Object.entries(registrations)) {
            if (typeof registrationEntry !== 'string') {
                continue;
            }

            const absolutePath = require.resolve(path.join(moduleDefinition.basePath, registrationEntry));

            if (token.endsWith('Service')) {
                serviceEntries.push({ token, filePath: absolutePath });
                continue;
            }

            if (token.endsWith('Repository')) {
                repositoryEntries.push({ token, filePath: absolutePath });
            }
        }
    }

    return {
        serviceEntries,
        repositoryEntries
    };
};

const getLegacyEntries = (entries = {}) => {
    return Object.entries(entries).map(([token, modulePath]) => ({
        token,
        filePath: toAbsoluteModulePath(modulePath)
    }));
};

const extractFactoryDeps = (filePath) => {
    const source = fs.readFileSync(filePath, 'utf8');
    const match = source.match(/module\.exports\s*=\s*\(\s*\{([\s\S]*?)\}\s*\)\s*=>/m);
    if (!match) {
        return [];
    }

    const depsSection = match[1]
        .replace(/\/\*[\s\S]*?\*\//g, '')
        .replace(/\/\/.*$/gm, '');

    return depsSection
        .split(',')
        .map((entry) => entry.trim())
        .filter(Boolean)
        .map((entry) => entry.replace(/=.*$/, '').trim())
        .map((entry) => entry.replace(/^\.\.\./, '').trim())
        .filter(Boolean);
};

const { serviceEntries: domainServiceEntries, repositoryEntries: domainRepositoryEntries } =
    getDomainServiceAndRepositoryEntries();

const serviceEntries = [
    ...getLegacyEntries(registry.services),
    ...domainServiceEntries
];

const repositoryEntries = [
    ...getLegacyEntries(registry.repositories),
    ...domainRepositoryEntries
];

const serviceTokens = new Set(serviceEntries.map((entry) => entry.token));
const repositoryTokens = new Set(repositoryEntries.map((entry) => entry.token));

const nodes = [];
const edges = [];
const services = [];

for (const entry of serviceEntries) {
    const deps = extractFactoryDeps(entry.filePath);

    const serviceDeps = [];
    const repositoryDeps = [];
    const infraDeps = [];
    const portDeps = [];
    const otherDeps = [];

    for (const dep of deps) {
        if (PORT_TOKENS.has(dep)) {
            portDeps.push(dep);
            edges.push({
                from: entry.token,
                to: dep,
                type: 'port'
            });
            continue;
        }

        if (serviceTokens.has(dep)) {
            serviceDeps.push(dep);
            edges.push({
                from: entry.token,
                to: dep,
                type: 'service'
            });
            continue;
        }

        if (repositoryTokens.has(dep)) {
            repositoryDeps.push(dep);
            edges.push({
                from: entry.token,
                to: dep,
                type: 'repository'
            });
            continue;
        }

        if (INFRA_TOKENS.has(dep)) {
            infraDeps.push(dep);
            edges.push({
                from: entry.token,
                to: dep,
                type: 'infra'
            });
            continue;
        }

        otherDeps.push(dep);
    }

    nodes.push({
        id: entry.token,
        type: 'service',
        file: path.relative(ROOT, entry.filePath)
    });

    services.push({
        token: entry.token,
        file: path.relative(ROOT, entry.filePath),
        dependencies: {
            services: serviceDeps.sort(),
            repositories: repositoryDeps.sort(),
            infra: infraDeps.sort(),
            ports: portDeps.sort(),
            other: otherDeps.sort()
        }
    });
}

for (const entry of repositoryEntries) {
    nodes.push({
        id: entry.token,
        type: 'repository',
        file: path.relative(ROOT, entry.filePath)
    });
}

for (const token of INFRA_TOKENS) {
    nodes.push({
        id: token,
        type: PORT_TOKENS.has(token) ? 'port' : 'infra',
        file: null
    });
}

const uniqueNodes = Array.from(new Map(nodes.map((node) => [node.id, node])).values())
    .sort((a, b) => a.id.localeCompare(b.id));

const uniqueEdges = Array.from(new Map(
    edges.map((edge) => [`${edge.from}|${edge.to}|${edge.type}`, edge])
).values()).sort((a, b) => {
    const left = `${a.from}|${a.to}|${a.type}`;
    const right = `${b.from}|${b.to}|${b.type}`;
    return left.localeCompare(right);
});

const payload = {
    generatedAt: new Date().toISOString(),
    nodeCount: uniqueNodes.length,
    edgeCount: uniqueEdges.length,
    serviceCount: serviceEntries.length,
    repositoryCount: repositoryEntries.length,
    nodes: uniqueNodes,
    edges: uniqueEdges,
    services: services.sort((a, b) => a.token.localeCompare(b.token))
};

const nodeId = (token) => `n_${token.replace(/[^a-zA-Z0-9_]/g, '_')}`;

const mermaidLines = [
    'flowchart LR',
    'classDef service fill:#E0F2FE,stroke:#0284C7,color:#0C4A6E',
    'classDef repository fill:#ECFDF5,stroke:#059669,color:#064E3B',
    'classDef port fill:#F3E8FF,stroke:#7C3AED,color:#4C1D95',
    'classDef infra fill:#FFF7ED,stroke:#EA580C,color:#7C2D12'
];

for (const node of uniqueNodes) {
    mermaidLines.push(`${nodeId(node.id)}["${node.id}"]`);
    mermaidLines.push(`class ${nodeId(node.id)} ${node.type}`);
}

for (const edge of uniqueEdges) {
    const arrow = edge.type === 'service' ? '-->' : '-.->';
    mermaidLines.push(`${nodeId(edge.from)} ${arrow} ${nodeId(edge.to)}`);
}

fs.mkdirSync(OUTPUT_DIR, { recursive: true });
fs.writeFileSync(
    path.join(OUTPUT_DIR, 'services.json'),
    JSON.stringify(payload, null, 2),
    'utf8'
);
fs.writeFileSync(
    path.join(OUTPUT_DIR, 'services.mmd'),
    `${mermaidLines.join('\n')}\n`,
    'utf8'
);

process.stdout.write(
    `Container graph exported to ${path.relative(ROOT, OUTPUT_DIR)} (nodes=${uniqueNodes.length}, edges=${uniqueEdges.length})\n`
);
