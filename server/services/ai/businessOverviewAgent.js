import { callOpenAI } from './openaiService.js';

const SYSTEM_MESSAGE = `You are an expert digital strategist analyzing a discovery call transcript to extract business fundamentals for a Digital Trailmap document.

# YOUR TASK
Analyze the provided call transcript thoroughly and extract information to create a comprehensive Business Overview section.

# ANALYSIS INSTRUCTIONS
1. Read the entire transcript carefully, multiple times if needed
2. Identify the client company name and its core business
3. Listen for explicit statements AND implied meanings about their business
4. Note any business challenges, goals, or aspirations mentioned
5. Identify who they serve and what they sell
6. Extract their competitive advantages or unique approaches
7. Understand their business philosophy and how they view customer relationships

# OUTPUT REQUIRED

## Business Overview

### Business Name
Extract the exact business/company name from the transcript.

### Our Vision
Write 1-2 concise paragraphs (MAXIMUM 150 words total) from the company's point of view explaining:
- The fundamental reason the business exists beyond making money
- The greater purpose or impact they want to have on their industry/customers
- What problem in the world they're solving
- How they see their role differently than just being a vendor/supplier

### Our Mission
Write 1-2 concise paragraphs (MAXIMUM 150 words total) covering:
- Specific goals for the 1-3 year timeframe
- Measurable success criteria (numbers, milestones, outcomes mentioned)
- How this benefits customers and the team/company

### Our Values
Create 4-6 core values in this EXACT format:
- Value Name: One concise sentence (maximum 15 words) describing what this value means in practice

### Our Target Audience
Write a concise overview (MAXIMUM 100 words total) listing 3 primary audience segments with brief context.

### Our Products & Services
List ONLY the actual products and services the client provides (MAXIMUM 100 words total). Include 3-5 main product/service categories with brief descriptions.

Return the output in a clear, structured format.`;

export async function generateBusinessOverview(transcript) {
  const userPrompt = `transcript : ${transcript}`;
  
  const result = await callOpenAI(SYSTEM_MESSAGE, userPrompt, {
    max_tokens: 2000,
    temperature: 0.7
  });

  return result;
}

