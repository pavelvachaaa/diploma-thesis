package ai

import (
	"encoding/json"
	"fmt"
	"log"
	"strings"

	"cv-processor/internal/models"
)

const evaluateSystemPrompt = `You are an experienced HR recruiter at Krajská zdravotní, a.s., a major healthcare provider in the Czech Republic.

Your task is to objectively evaluate how well a candidate's CV matches a specific job posting.

Return ONLY valid JSON.
Do not include markdown, code blocks, comments, explanations, or any text outside the JSON object.

Evaluation rules:
- Evaluate only based on information explicitly present in the CV and job posting.
- Do not invent missing experience, skills, education, certifications, or language knowledge.
- Do not assume skills from job titles unless they are clearly supported by the CV.
- If the CV does not mention a required skill, treat it as missing.
- Be fair to transferable experience, but clearly distinguish direct evidence from partial relevance.
- Do not penalize or reward protected or sensitive characteristics such as age, gender, ethnicity, religion, nationality, family status, health status, disability, or appearance.
- Ignore irrelevant personal information unless it directly affects job-related qualifications.
- Use Czech language for "reasoning", "strengths", and "weaknesses", regardless of the input language.

Scoring guidelines:
- 90-100: Excellent match. Most or all key requirements are clearly met, including must-have skills and relevant experience.
- 75-89: Strong match. Candidate meets most key requirements, with only minor gaps.
- 60-74: Moderate match. Candidate meets several important requirements but has notable gaps.
- 40-59: Partial match. Candidate has some relevant background, but several core requirements are missing.
- 20-39: Weak match. Candidate has limited relevant experience or skills for the role.
- 0-19: Very poor match. CV shows little or no evidence relevant to the job.

When evaluating, consider:
1. Relevant job experience.
2. Required hard skills and tools.
3. Education, certifications, and professional qualifications.
4. Healthcare, hospital, administrative, technical, or operational domain relevance.
5. Seniority and responsibility level.
6. Language requirements.
7. Transferable skills.

The output must be syntactically valid JSON and must match the requested schema exactly.`

const evaluateUserPrompt = `Evaluate this CV against the job posting.

Return ONLY valid JSON matching this exact schema:

{
  "score": 0,
  "score_breakdown": {
    "experience": 0,
    "hard_skills": 0,
    "education_certifications": 0,
    "domain_fit": 0,
    "seniority_fit": 0,
    "language_fit": 0
  },
  "matched_requirements": ["string"],
  "missing_requirements": ["string"],
  "reasoning": "string",
  "strengths": ["string"],
  "weaknesses": ["string"],
  "interview_questions": ["string"]
}

Scoring:
- "score": Overall integer score from 0 to 100.
- "score_breakdown.experience": 0-25 points.
- "score_breakdown.hard_skills": 0-25 points.
- "score_breakdown.education_certifications": 0-15 points.
- "score_breakdown.domain_fit": 0-15 points.
- "score_breakdown.seniority_fit": 0-10 points.
- "score_breakdown.language_fit": 0-10 points.
- The sum of score_breakdown should equal "score".

Field rules:
- "matched_requirements": Czech list of job requirements clearly supported by the CV.
- "missing_requirements": Czech list of job requirements missing or unclear in the CV.
- "reasoning": Czech explanation of the score.
- "strengths": Czech list of candidate strengths relevant to this job.
- "weaknesses": Czech list of candidate gaps or uncertainties relevant to this job.
- "interview_questions": Czech screening questions HR should ask to verify fit.

Important:
- Return valid JSON only.
- Use Czech for all text fields except technical terms where English is standard.
- Do not invent missing information.
- Evaluate only job-relevant evidence.
- Do not evaluate protected or sensitive personal characteristics.

Job Title:
%s

Job Description:
%s

CV Text:
%s`

// Evaluate uses Ollama to evaluate a candidate against a job description
func Evaluate(client *OllamaClient, model string, cvText, jobTitle, jobDescription string) (*models.Evaluation, error) {
	// Truncate if needed
	if len(cvText) > 10000 {
		cvText = cvText[:10000]
	}
	if len(jobDescription) > 4000 {
		jobDescription = jobDescription[:4000]
	}

	// If no job description, return a basic evaluation
	if strings.TrimSpace(jobTitle) == "" && strings.TrimSpace(jobDescription) == "" {
		return &models.Evaluation{
			Score:      0,
			Reasoning:  "No job description available for evaluation",
			Strengths:  []string{},
			Weaknesses: []string{},
		}, nil
	}

	prompt := fmt.Sprintf(evaluateUserPrompt, jobTitle, jobDescription, cvText)

	var result models.Evaluation

	for attempt := 1; attempt <= 3; attempt++ {
		response, err := client.Generate(model, evaluateSystemPrompt, prompt)
		if err != nil {
			return nil, fmt.Errorf("ollama evaluate (attempt %d): %w", attempt, err)
		}

		cleaned := cleanJSONResponse(response)

		if err := json.Unmarshal([]byte(cleaned), &result); err != nil {
			log.Printf("Evaluation JSON parse error (attempt %d/%d): %v", attempt, 3, err)
			if attempt == 3 {
				return nil, fmt.Errorf("failed to parse evaluation after 3 attempts: %w", err)
			}
			continue
		}

		// Clamp score
		if result.Score < 0 {
			result.Score = 0
		}
		if result.Score > 100 {
			result.Score = 100
		}

		return &result, nil
	}

	return nil, fmt.Errorf("evaluation failed after all attempts")
}
