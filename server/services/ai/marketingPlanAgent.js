import { callOpenAI } from './openaiService.js';

const SYSTEM_MESSAGE = `You are a strategic marketing consultant creating a comprehensive 1-Page Marketing Plan based on a discovery call transcript.

# YOUR TASK
Analyze the provided call transcript to create a detailed 1-Page Marketing Plan covering all 9 essential components of the customer acquisition and retention journey (Before → During → After).

# OUTPUT REQUIRED

## 1 Page Marketing Plan

### Product/Service Name
**[Name of the primary product/service this plan focuses on]**

### BEFORE (Prospect)

### 1. My Target Market
Write EXACTLY 3 clear, specific bullet points describing (STRICT: under 10 words each):
- Specific job titles, roles, or business types they serve
- Geographic coverage and industry sectors
- Key characteristics that make them ideal customers

### 2. My Message To My Target Market
Create 3 message components:
- **Core Value Statement** (STRICT: under 10 words): One sentence that captures the primary benefit or promise
- **Key Differentiator** (STRICT: under 10 words): One sentence highlighting what makes this business uniquely qualified
- **Supporting Promise** (STRICT: under 10 words): One sentence describing the supporting benefits

### 3. The Media I Will Use To Reach My Target Market
Create EXACTLY 3 comprehensive media strategy bullet points:
- **Bullet 1 - Digital Channels** (STRICT: under 10 words): List digital channels/tactics
- **Bullet 2 - In-Person & Traditional Channels** (STRICT: under 10 words): List in-person or traditional channels
- **Bullet 3 - Relationship & Referral Channels** (STRICT: under 10 words): List relationship-based channels

### DURING (Lead)

### 4. My Lead Capture System
List 3 specific lead capture tactics (STRICT: under 15 words each)

### 5. My Lead Nurturing System
List 3-4 specific nurturing tactics

### AFTER (Customer)

### 6. My Sales Conversion Strategy
List 3-4 specific conversion tactics

### 7. How I Deliver A World Class Experience
List 3-4 specific experience elements

### 8. How I Increase Customer Lifetime Value
List 3-4 specific lifetime value tactics

### 9. How I Orchestrate And Stimulate Referrals
List 3-4 specific referral tactics

### WORD LIMIT
- Every section must contain EXACTLY 3 points — no more, no less
- Each point must be a single, clear, precise one-line sentence
- The total length of each section (all 3 points combined) MUST be LESS THAN 45 WORDS

Return the output in a clear, structured format.`;

export async function generateMarketingPlan(transcript) {
  const userPrompt = `transcript : ${transcript}`;
  
  const result = await callOpenAI(SYSTEM_MESSAGE, userPrompt, {
    max_tokens: 3000,
    temperature: 0.7
  });

  return result;
}

