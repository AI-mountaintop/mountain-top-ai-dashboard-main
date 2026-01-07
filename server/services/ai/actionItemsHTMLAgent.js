import { callOpenAI } from './openaiService.js';

const SYSTEM_MESSAGE = `# ROLE & EXPERTISE
You are a **Senior HTML Email Designer and Data Processing Specialist** with 15+ years of experience in creating visually stunning, data-driven HTML emails for corporate communications.

# PRIMARY TASK
Transform the provided meeting data into a **complete, production-ready HTML email** that accurately processes ALL data columns, intelligently categorizes action items based on content analysis, and creates a visually appealing summary ready for executive distribution.

# INPUT DATA STRUCTURE
You will receive:
- Meeting Title
- Meeting Summary (bullet points)
- Action Items Table (with multiple columns)
- Meeting Link
- Meeting Sentiments (Rating and qualitative analysis)

# INTELLIGENT CATEGORIZATION METHODOLOGY
Analyze "Issue / Task Description" and "Task Details" to categorize into:
- 🎨 **Branding & Marketing QC**
- 📈 **Digital Ad Management**
- 🌐 **SEO & Website Management**
- ⭐ **Customer Reviews & Communication**
- 💷 **Sales & Pricing**
- ⚙️ **General Operations**

# HTML STRUCTURE REQUIREMENTS
1. **Header Section**: Meeting title with 🚀 emoji, date, clickable meeting recording link
2. **Summary Section (📘)**: Styled container with bullet points
3. **Sentiment Analysis Section (📊)**: Rating with color coding (1-5 scale)
4. **Action Items Tables by Category**: Organized by category with proper styling
5. **NO FOOTER**: Do not include any footer section with copyright or company information

# PRIORITY DISPLAY SPECIFICATIONS
- **P1**: Red background #FF4444 with white text
- **P2**: Orange background #FF8C00 with white text
- **P3**: Yellow background #FFC107 with dark text
- **P4+**: Gray background #6C757D with white text

# CRITICAL TABLE STRUCTURE
**MUST DISPLAY 6 COLUMNS:**
1. **Priority** (80px width, bold, colored)
2. **Type** (80px width, badge format)
3. **Issue / Task Description** (main content)
4. **Who** (assigned person)
5. **Deadline** (formatted date)
6. **Task Details** (comprehensive description)

# OUTPUT REQUIREMENT
Return ONLY the complete HTML email starting with \`<!DOCTYPE html>\` - no explanations, notes, or additional text outside the HTML structure.

# CRITICAL RULES
- Do NOT wrap the HTML in markdown code fences (\`\`\`html or \`\`\`)
- Do NOT include generic placeholder text like "© 2023 Company Name. All rights reserved."
- Do NOT include any disclaimer text like "This summary was generated automatically" or "via the Meeting Actions AI Agent"
- Either omit the footer section entirely or use actual company information if provided
- Return pure HTML only, no markdown formatting
- Do NOT add any meta-commentary about how the document was generated`;

export async function generateActionItemsHTML({ meetingTitle, meetingSummary, sentimentAnalysis, actionItems, meetingLink }) {
  const userPrompt = `Meeting Title : ${meetingTitle}

Meeting Summary : ${meetingSummary}

Action Items Table:
${actionItems}

Meeting Link : ${meetingLink}

Meeting Sentiments : ${sentimentAnalysis}

IMPORTANT: Return ONLY valid HTML starting with <!DOCTYPE html>. Do NOT include markdown code fences like \`\`\`html or \`\`\`. Do NOT include generic footer text like "© 2023 Company Name" - either omit the footer or use actual company information. Do NOT include any disclaimer or meta-commentary like "This summary was generated automatically" or "via the Meeting Actions AI Agent".`;
  
  const result = await callOpenAI(SYSTEM_MESSAGE, userPrompt, {
    max_tokens: 8000,
    temperature: 0.1
  });

  // Aggressive cleanup of markdown code fences and unwanted content
  let cleanedHTML = result.trim();
  
  console.log('=== HTML CLEANING DEBUG ===');
  console.log('Original starts with:', cleanedHTML.substring(0, 50));
  console.log('Original ends with:', cleanedHTML.substring(cleanedHTML.length - 50));
  
  // Remove all variations of opening code fences
  cleanedHTML = cleanedHTML.replace(/^```html\s*/gi, '');
  cleanedHTML = cleanedHTML.replace(/^```HTML\s*/g, '');
  cleanedHTML = cleanedHTML.replace(/^```\s*/g, '');
  
  // Remove closing code fence
  cleanedHTML = cleanedHTML.replace(/\s*```\s*$/g, '');
  
  // Remove any remaining backticks at start or end
  cleanedHTML = cleanedHTML.replace(/^`+/g, '');
  cleanedHTML = cleanedHTML.replace(/`+$/g, '');
  
  // Remove generic copyright footer if present
  cleanedHTML = cleanedHTML.replace(/©\s*\d{4}\s*Company Name\.\s*All rights reserved\./gi, '');
  
  // Remove auto-generation disclaimer text
  cleanedHTML = cleanedHTML.replace(/This summary was generated automatically.*?AI Agent\.?/gi, '');
  cleanedHTML = cleanedHTML.replace(/This (?:document|summary|report) was (?:automatically )?generated.*?(?:AI|agent|system)\.?/gi, '');
  
  // Clean up any extra whitespace
  cleanedHTML = cleanedHTML.trim();
  
  console.log('Cleaned starts with:', cleanedHTML.substring(0, 50));
  console.log('Cleaned ends with:', cleanedHTML.substring(cleanedHTML.length - 50));
  console.log('=== END DEBUG ===');
  
  return cleanedHTML;
}

