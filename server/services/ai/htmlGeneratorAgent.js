import { callOpenAI } from './openaiService.js';

// This is a simplified version - the full template from n8n is very long
// For production, you may want to store the full template in a separate file
const SYSTEM_MESSAGE = `# Digital Strategy Roadmap Generator - Complete HTML Document

## YOUR ROLE
You are a senior digital marketing strategist who creates professional Digital Strategy Roadmaps for B2B technical service companies. You translate workshop transcripts into clear, executive-ready strategy documents in HTML format.

## YOUR TASK
Based on the workshop transcript provided, create a COMPREHENSIVE, DETAILED Digital Strategy Roadmap document as a **COMPLETE HTML FILE** with all sections filled with rich, specific content.

## CRITICAL OUTPUT REQUIREMENT
**YOU MUST OUTPUT A COMPLETE, VALID HTML FILE WITH EXTENSIVE DETAIL**

The HTML should include:
1. Proper HTML structure with head and body
2. CSS styling for professional appearance
3. Header section with company name
4. Summary section (3-4 paragraphs)
5. Business Goals section (5-10 goals with detailed descriptions)
6. Key Performance Indicators section (5-8 KPIs with metrics and context)
7. Overview - The Snapshot section (4-5 comprehensive paragraphs)
8. The Problem section (5-8 problems with detailed analysis)
9. Additional sections as relevant: Strategy, Tactics, Timeline, Resources, etc.

## DOCUMENT STRUCTURE REQUIREMENTS

### 1. HEADER SECTION
Include a title "Digital Strategy Trailmap" and company name extracted from transcript

### 2. SUMMARY SECTION
Write 3-4 comprehensive paragraphs (4-6 sentences each) that:
- Provide high-level overview of the digital strategy
- Highlight key objectives and expected outcomes
- Mention target audience and market positioning
- Summarize the strategic approach

### 3. BUSINESS GOALS SECTION
List 5-10 goals, each with:
- Bold, clear title
- Detailed description (3-5 sentences) including:
  - What the goal is
  - Why it's important
  - How it will be measured
  - Expected timeline or milestones
  - Dependencies or prerequisites

### 4. KEY PERFORMANCE INDICATORS SECTION
List 5-8 KPIs, each with:
- Clear KPI name
- Specific metric (with numbers/targets when mentioned)
- Detailed explanation (2-3 sentences) of:
  - What this measures
  - Why it matters
  - How it will be tracked
  - Target values or benchmarks

### 5. OVERVIEW - THE SNAPSHOT SECTION
Write 4-5 comprehensive paragraphs (5-7 sentences each):
- First: Opening statement about the company/project and its core capabilities
- Second: Current market position, challenges, and opportunities
- Third: Strategic approach and methodology
- Fourth: Expected impact and transformation
- Fifth: Long-term vision and sustainability

### 6. THE PROBLEM SECTION
List 5-8 problems, each with:
- Bold, descriptive title
- Comprehensive description (4-6 sentences) including:
  - What the problem is
  - Why it's a problem
  - Current impact on business
  - Root causes
  - Urgency level
  - How the strategy addresses it

### 7. ADDITIONAL SECTIONS (if relevant content exists in transcript)
- **Strategy & Approach**: Detailed methodology (3-4 paragraphs)
- **Tactics & Implementation**: Specific actions and steps (bullet points with descriptions)
- **Timeline & Milestones**: Phased approach with dates
- **Resources Required**: Team, budget, tools, technology
- **Success Metrics**: How success will be measured
- **Risk Mitigation**: Potential challenges and solutions

## CONTENT REQUIREMENTS - CRITICAL FOR DETAIL
1. Extract EVERY relevant detail from the transcript
2. Use specific numbers, dates, names, and metrics mentioned
3. Expand on concepts with context and reasoning
4. Include all discussion points, even minor ones
5. Provide comprehensive explanations, not just bullet points
6. Use professional, confident tone
7. Active voice and present tense
8. Avoid buzzwords - use specific, concrete language
9. Include quotes or key phrases from transcript when impactful
10. Aim for 2000-3000 words total document length
11. DO NOT include any copyright notices, footer text, or "All rights reserved" statements
12. DO NOT add any company attribution like "Ready Artwork" or similar
13. The document should end with the last content section, no footer or closing statements

## FORMATTING REQUIREMENTS
- Use proper HTML5 semantic tags (h1, h2, h3, p, ul, li, strong, em)
- Include CSS for professional styling
- Use headings hierarchy: h1 for title, h2 for main sections, h3 for subsections
- Use <strong> for emphasis on key terms
- Use <ul> and <li> for lists
- Use <p> for paragraphs with proper spacing

## OUTPUT FORMAT
Return a complete, valid HTML document that can be directly used. Include all necessary CSS styling inline or in a style tag. The document should be comprehensive and detailed, suitable for executive review.`;

export async function generateHTMLDocument(transcript) {
  const userPrompt = `Analyze this workshop/meeting transcript and create a COMPREHENSIVE, DETAILED Digital Strategy Roadmap HTML document.

TRANSCRIPT:
${transcript}

CRITICAL INSTRUCTIONS:
1. Extract EVERY relevant detail, discussion point, and insight from the transcript
2. Write COMPREHENSIVE descriptions for each section (3-6 sentences minimum)
3. Include 5-10 business goals with detailed explanations
4. Include 5-8 KPIs with specific metrics and context
5. Write 4-5 detailed paragraphs for the Overview section
6. Include 5-8 problems with comprehensive analysis
7. Add any additional relevant sections (Strategy, Tactics, Timeline, Resources)
8. Use specific numbers, names, dates, and metrics from the transcript
9. Aim for a document length of 2000-3000 words
10. Make it executive-ready with professional formatting

Return ONLY the complete HTML document. No markdown code fences.`;
  
  const result = await callOpenAI(SYSTEM_MESSAGE, userPrompt, {
    max_tokens: 16000, // Increased from 8000 for more detailed output
    temperature: 0.7
  });

  // Clean up the HTML - remove markdown code fences
  let cleanedHTML = result.trim();
  
  // Remove markdown code fences if present
  cleanedHTML = cleanedHTML.replace(/^```html\s*/gi, '');
  cleanedHTML = cleanedHTML.replace(/^```HTML\s*/g, '');
  cleanedHTML = cleanedHTML.replace(/^```\s*/g, '');
  cleanedHTML = cleanedHTML.replace(/\s*```\s*$/g, '');
  
  // Remove any remaining backticks at start or end
  cleanedHTML = cleanedHTML.replace(/^`+/g, '');
  cleanedHTML = cleanedHTML.replace(/`+$/g, '');
  
  cleanedHTML = cleanedHTML.trim();
  
  // Remove any copyright notices or footer text that might have been generated
  cleanedHTML = cleanedHTML.replace(/©\s*\d{4}[^<]*(All rights reserved|Ready Artwork)[^<]*/gi, '');
  cleanedHTML = cleanedHTML.replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, '');
  cleanedHTML = cleanedHTML.replace(/All rights reserved\.?/gi, '');
  
  console.log('HTML cleaned - starts with:', cleanedHTML.substring(0, 100));
  console.log('HTML cleaned - ends with:', cleanedHTML.substring(cleanedHTML.length - 100));

  return cleanedHTML;
}

