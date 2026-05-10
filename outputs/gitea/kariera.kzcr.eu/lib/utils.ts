import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { Job } from "@/types/job"

const DANGEROUS_BLOCK_TAGS = [
  "script",
  "style",
  "iframe",
  "object",
  "embed",
  "svg",
  "math",
  "noscript"
]

const STRIP_ONLY_TAGS = [
  "link",
  "meta",
  "base",
  "form",
  "input",
  "button",
  "textarea",
  "select",
  "option"
]

const ALLOWED_HTML_TAGS = new Set([
  "p",
  "br",
  "ul",
  "ol",
  "li",
  "strong",
  "em"
])

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function stripHtml(html: string): string {
    return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

export function sanitizeRichHtml(html: string): string {
    if (!html) {
        return "";
    }

    let sanitized = html.replace(/<!--[\s\S]*?-->/g, "");

    for (const tag of DANGEROUS_BLOCK_TAGS) {
        const pattern = new RegExp(`<${tag}\\b[^>]*>[\\s\\S]*?<\\/${tag}>`, "gi");
        sanitized = sanitized.replace(pattern, "");
    }

    for (const tag of STRIP_ONLY_TAGS) {
        const pattern = new RegExp(`<\\/?${tag}\\b[^>]*>`, "gi");
        sanitized = sanitized.replace(pattern, "");
    }

    sanitized = sanitized.replace(/<\s*\/?\s*([a-z0-9-]+)(?:\s[^>]*)?>/gi, (match, rawTag) => {
        const isClosingTag = /^<\s*\//.test(match);
        const normalizedTag = String(rawTag).toLowerCase();
        const mappedTag = normalizedTag === "b"
            ? "strong"
            : normalizedTag === "i"
                ? "em"
                : normalizedTag;

        if (!ALLOWED_HTML_TAGS.has(mappedTag)) {
            return "";
        }

        if (mappedTag === "br") {
            return "<br>";
        }

        return isClosingTag ? `</${mappedTag}>` : `<${mappedTag}>`;
    });

    return sanitized.trim();
}

export function getContractLabels(job: Job): string[] {
    return job.contract_type_labels?.length
        ? job.contract_type_labels
        : job.contract_type_label ? [job.contract_type_label] : [];
}
