package ai

import (
	"encoding/json"
	"fmt"
	"log"
	"strings"

	"cv-processor/internal/models"
)

const extractSystemPrompt = `You are an experienced HR recruiter at Krajská zdravotní, a.s., a major healthcare provider in the Czech Republic.

Your task is to extract structured data from the provided CV text and create a concise HR-oriented candidate profile.

Return ONLY valid JSON.
Do not include markdown, code blocks, comments, explanations, or any text outside the JSON object.

Use exactly the schema requested by the user.
If a field is not present in the CV, use:
- an empty string "" for scalar fields,
- an empty array [] for list fields.

Extraction rules:
- Extract only information explicitly stated in the CV.
- Do not invent missing employers, dates, schools, degrees, skills, certifications, licenses, or languages.
- Preserve original names of companies, schools, and institutions where possible.
- Normalize common skills, tools, technologies, and professional terms to concise names.
- Keep all extracted descriptions factual and concise.
- If dates are incomplete, preserve them as written.
- Estimate total experience only when it can be clearly derived from explicit dates.
- Do not infer protected or sensitive characteristics.

HR writing rules:
- The fields "summary", "verbal_evaluation", "suitable_roles", and "missing_information" must ALWAYS be written in Czech.
- The summary must be professional, neutral, and based only on the CV.
- The verbal evaluation must be written from an HR recruiter perspective.
- Assess strengths, potential fit for healthcare, administrative, technical, operational, or support roles where relevant.
- Mention gaps or uncertainties only when supported by missing or unclear CV information.
- Do not make psychological, medical, or personality claims.
- Do not overstate suitability if the CV does not provide enough evidence.

The output must be syntactically valid JSON and must match the requested schema exactly.`

const extractUserPrompt = `Extract structured data from the following CV text.

Return ONLY valid JSON matching this exact schema:

{
  "name": "string",
  "email": "string",
  "phone": "string",
  "location": "string",
  "current_position": "string",
  "total_experience": "string",
  "skills": ["string"],
  "education": [
    {
      "institution": "string",
      "degree": "string",
      "field": "string",
      "year": "string"
    }
  ],
  "experience": [
    {
      "company": "string",
      "position": "string",
      "duration": "string",
      "description": "string"
    }
  ],
  "languages": ["string"],
  "certifications": ["string"],
  "suitable_roles": ["string"],
  "missing_information": ["string"],
  "summary": "string",
  "verbal_evaluation": "string"
}

Field rules:
- "location": Candidate location if explicitly stated.
- "current_position": Most recent or current role if identifiable.
- "total_experience": Total professional experience, e.g. "5 years", only if clearly derivable from the CV.
- "suitable_roles": Job roles the candidate may be suitable for based on CV evidence, written in Czech.
- "missing_information": Important missing or unclear information that HR should verify, written in Czech.
- "summary": Czech professional summary, approximately 80-120 words.
- "verbal_evaluation": Czech HR evaluation, approximately 80-140 words.

Extraction rules:
- Extract only information explicitly present in the CV.
- Do not invent employers, schools, dates, degrees, skills, languages, or certifications.
- If total experience cannot be derived, use an empty string.
- If a field is missing, use "" or [].
- Keep descriptions concise and factual.
- Output valid JSON only.
- No markdown, no explanations.

CV Text:
%s`

// ExtractData uses Ollama to extract structured data from CV text
func ExtractData(client *OllamaClient, model string, text string) (*models.ExtractedData, error) {
	// Truncate very long texts
	if len(text) > 12000 {
		text = text[:12000]
	}

	prompt := fmt.Sprintf(extractUserPrompt, text)

	var result models.ExtractedData

	// Retry up to 3 times for valid JSON
	for attempt := 1; attempt <= 3; attempt++ {
		response, err := client.Generate(model, extractSystemPrompt, prompt)
		if err != nil {
			return nil, fmt.Errorf("ollama generate (attempt %d): %w", attempt, err)
		}

		// Clean response: strip markdown code blocks if present
		cleaned := cleanJSONResponse(response)

		if err := json.Unmarshal([]byte(cleaned), &result); err != nil {
			log.Printf("JSON parse error (attempt %d/%d): %v", attempt, 3, err)
			if attempt == 3 {
				return nil, fmt.Errorf("failed to parse extracted data after 3 attempts: %w", err)
			}
			continue
		}

		return &result, nil
	}

	return nil, fmt.Errorf("extraction failed after all attempts")
}

// cleanJSONResponse strips markdown code blocks and finds JSON content
func cleanJSONResponse(s string) string {
	s = strings.TrimSpace(s)

	// Remove ```json ... ``` wrapping
	if strings.HasPrefix(s, "```") {
		lines := strings.Split(s, "\n")
		if len(lines) > 2 {
			// Remove first and last lines (```json and ```)
			lines = lines[1 : len(lines)-1]
			s = strings.Join(lines, "\n")
		}
	}

	// Find the JSON object boundaries
	start := strings.Index(s, "{")
	end := strings.LastIndex(s, "}")
	if start >= 0 && end > start {
		s = s[start : end+1]
	}

	return strings.TrimSpace(s)
}
