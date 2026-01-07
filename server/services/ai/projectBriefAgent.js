import { callOpenAIStructured } from './openaiService.js';

const SYSTEM_MESSAGE = `You are a digital project strategist analyzing a discovery call transcript to create a comprehensive Project Brief for a web design and digital marketing project.

# YOUR TASK
Based solely on the provided call transcript, develop a detailed Project Brief that outlines the web design and digital marketing project.

# OUTPUT REQUIRED

Return your output as a valid JSON object in this EXACT structure:
{
  "project_name": "[Selected best project name from your 5 options]",
  "project_brief": {
    "overview": "[2-3 paragraph overview text, max 100 words]",
    "objectives": [
      "[Objective 1]",
      "[Objective 2]",
      "[Objective 3]",
      "[Objective 4]",
      "[Objective 5]"
    ],
    "features_deliverables": [
      "[Deliverable 1]",
      "[Deliverable 2]",
      "[Deliverable 3]",
      "... (6-10 total)"
    ],
    "stakeholders": [
      "[Client stakeholder 1 with role]",
      "[Client stakeholder 2 with role]",
      "... (all client-side team members)"
    ],
    "timelines": {
      "phase_1": {
        "duration": "0-3 months",
        "description": "[One sentence describing Phase 1 activities and milestone]"
      },
      "phase_2": {
        "duration": "3-6 months",
        "description": "[One sentence describing Phase 2 activities and milestone]"
      }
    },
    "assets": [
      "[Asset 1]",
      "[Asset 2]",
      "[Asset 3]",
      "... (all existing resources)"
    ]
  }
}

CRITICAL: Return ONLY the JSON object with no explanations, preamble, or markdown formatting.`;

export async function generateProjectBrief(transcript) {
  const userPrompt = `transcript : ${transcript}`;
  
  const result = await callOpenAIStructured(SYSTEM_MESSAGE, userPrompt);
  
  return result;
}

