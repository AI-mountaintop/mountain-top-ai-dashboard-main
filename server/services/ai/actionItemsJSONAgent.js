import { callOpenAI } from './openaiService.js';

const SYSTEM_MESSAGE = `You are a meeting analysis expert. Your task is to analyze meeting data and return a structured JSON response with DETAILED, COMPREHENSIVE action items.

IMPORTANT: Return ONLY valid JSON. No markdown, no code fences, no explanations.

JSON SCHEMA:
{
  "meeting": {
    "title": "string",
    "date": "string or null",
    "time": "string or null", 
    "duration": "string or null",
    "recording_link": "string or null"
  },
  "participants": [
    {
      "name": "string",
      "role": "string or null"
    }
  ],
  "executive_summary": ["string array of 8-12 detailed key points covering all major discussion areas"],
  "decisions_made": ["string array of all decisions"],
  "discussion_topics": [
    {
      "topic": "string",
      "summary": "string"
    }
  ],
  "action_items": [
    {
      "id": "number",
      "task": "string (clear, actionable task title)",
      "assignee": "string or null",
      "deadline": "string or null (ASAP, specific date, or timeframe)",
      "priority": "P1 | P2 | P3 | P4 (P1=highest)",
      "type": "Administrative | Content | Design | Strategic | Technical | Research | Operational",
      "category": "General Operations | Branding & Marketing QC | Digital Ad Management | SEO & Website Management | Sales & Pricing | Customer Reviews & Communication | Operational",
      "details": "string (comprehensive description with context, dependencies, and expected outcomes - 2-4 sentences)",
      "subtasks": [
        {
          "id": "string (e.g., 1.1, 1.2)",
          "task": "string",
          "assignee": "string or null",
          "deadline": "string or null"
        }
      ]
    }
  ],
  "sentiment": {
    "score": "number 1-5",
    "summary": "string (detailed 3-4 sentence analysis)",
    "highlights": ["string array of 3-5 positive points with evidence"]
  },
  "next_steps": ["string array of 5-8 concrete next steps"]
}

CRITICAL REQUIREMENTS FOR PARTICIPANTS:
1. Extract ALL participants who spoke in the meeting from the transcript
2. Look for speaker labels like "Speaker 1:", "John:", "[John Smith]", etc.
3. Look for names mentioned when people are addressed: "Thanks John", "As Sarah mentioned"
4. Look for introductions: "I'm John from marketing", "This is Sarah"
5. Include EVERYONE who participated, even if they spoke briefly
6. Infer roles from context: job titles, departments, responsibilities mentioned
7. If a speaker is labeled generically (Speaker 1, Speaker 2), try to identify their actual name from the conversation
8. Common patterns to detect:
   - "Speaker X:" or "[Speaker X]" at start of lines
   - Names followed by colons
   - Names in brackets
   - Names mentioned in conversation context

CRITICAL REQUIREMENTS FOR ACTION ITEMS:
1. Extract EVERY action item, task, or to-do mentioned in the meeting
2. GROUP RELATED TASKS: If multiple tasks are related to the same topic/project, make ONE main task with subtasks
   - Example: If there are 3 tasks about "website updates", create ONE main task "Website Updates" with 3 subtasks
   - Example: If someone needs to "send images" and "resize images", group under main task with subtasks
3. ALWAYS CREATE SUBTASKS when:
   - Multiple steps are needed to complete a task
   - Related tasks are assigned to the same person
   - Tasks are part of the same project or initiative
   - A task has dependencies or sequential steps
4. Categorize each action item into the appropriate category:
   - General Operations: Administrative tasks, scheduling, coordination
   - Branding & Marketing QC: Content creation, editorial, branding, design
   - Digital Ad Management: Advertising strategy, influencer outreach, campaigns
   - SEO & Website Management: Website features, analytics, technical implementation
   - Sales & Pricing: Budget, pricing, proposals, revenue
   - Customer Reviews & Communication: Customer engagement, feedback, reviews
   - Operational: Day-to-day operations, logistics, fulfillment
5. Assign priority P1-P4 based on:
   - P1: Urgent, blocking other work, ASAP deadline
   - P2: Important, needed soon, before next meeting
   - P3: Medium priority, within 1-2 weeks
   - P4: Lower priority, nice to have, flexible timeline
6. Write DETAILED descriptions (2-4 sentences) including:
   - What needs to be done
   - Why it's important
   - Any dependencies or context
   - Expected outcome
7. Include specific names, dates, and details from the transcript
8. For executive summary, provide 8-12 comprehensive bullet points covering ALL major topics discussed
9. AIM FOR 5-15 MAIN ACTION ITEMS with subtasks, NOT 20+ separate items

RULES:
1. Extract ALL participant names from the transcript - this is CRITICAL
2. Be thorough - capture every action item mentioned
3. Use specific deadlines when mentioned (dates, "ASAP", "before next meeting", etc.)
4. GROUP related tasks under parent tasks with subtasks - this is CRITICAL
5. Keep summaries detailed and informative
6. Include all context and nuance from the discussion
7. Each main task should have 2-5 subtasks when the work involves multiple steps`;

export async function generateActionItemsJSON({ meetingTitle, meetingSummary, sentimentAnalysis, actionItems, meetingLink, transcript }) {
  const userPrompt = `Analyze this meeting data and return structured JSON with COMPREHENSIVE, DETAILED action items.

Meeting Title: ${meetingTitle || 'Untitled Meeting'}

Meeting Transcript (USE THIS TO EXTRACT ALL PARTICIPANTS):
${transcript || 'No transcript available'}

Meeting Summary:
${meetingSummary || 'No summary available'}

Action Items (Raw):
${actionItems || 'No action items'}

Meeting Link: ${meetingLink || 'Not provided'}

Sentiment Analysis:
${sentimentAnalysis || 'Not analyzed'}

CRITICAL INSTRUCTIONS:
1. PARTICIPANTS - MOST IMPORTANT:
   - Scan the ENTIRE transcript to find ALL people who spoke
   - Look for patterns like "Speaker 1:", "John:", "[Name]:", etc.
   - Extract every unique speaker/participant name
   - If speakers are labeled generically (Speaker 1, Speaker 2), try to identify their real names from the conversation
   - Infer roles from context (job titles, departments, what they discuss)
   - Include EVERYONE who participated, even briefly

2. ACTION ITEMS WITH SUBTASKS - CRITICAL:
   - GROUP related tasks together under ONE main task with subtasks
   - If 3 tasks are about "images", make ONE main task "Image Updates" with 3 subtasks
   - If someone has multiple related tasks, group them under one main task
   - EVERY main task should have 2-5 subtasks when possible
   - Aim for 5-15 main action items total, NOT 20+ separate items
   
3. For EACH main action item:
   - Write a clear, concise task title
   - Add 2-5 subtasks breaking down the work
   - Write a DETAILED description (3-5 sentences)
   - Assign specific people mentioned in the meeting
   - Use exact deadlines mentioned (dates, "ASAP", "before next meeting", "end of week", etc.)
   - Categorize each task appropriately
   - Set priority P1-P4 based on urgency and importance

4. Include 10-15 comprehensive executive summary points covering ALL discussion areas

Return ONLY valid JSON matching the schema. No markdown formatting.`;

  const result = await callOpenAI(SYSTEM_MESSAGE, userPrompt, {
    max_tokens: 12000, // Increased for more detailed output
    temperature: 0.2 // Slightly higher for more creative detail
  });

  // Clean and parse JSON
  let cleanedResult = result.trim();
  
  // Remove markdown code fences if present
  cleanedResult = cleanedResult.replace(/^```json\s*/gi, '');
  cleanedResult = cleanedResult.replace(/^```\s*/g, '');
  cleanedResult = cleanedResult.replace(/\s*```\s*$/g, '');
  cleanedResult = cleanedResult.trim();

  try {
    const jsonData = JSON.parse(cleanedResult);
    return validateAndNormalizeJSON(jsonData);
  } catch (error) {
    console.error('Failed to parse AI JSON response:', error);
    console.error('Raw response:', cleanedResult.substring(0, 500));
    
    // Return a default structure if parsing fails
    return getDefaultStructure(meetingTitle, meetingLink);
  }
}

function validateAndNormalizeJSON(data) {
  // Ensure all required fields exist with defaults
  return {
    meeting: {
      title: data.meeting?.title || 'Untitled Meeting',
      date: data.meeting?.date || null,
      time: data.meeting?.time || null,
      duration: data.meeting?.duration || null,
      recording_link: data.meeting?.recording_link || null
    },
    participants: Array.isArray(data.participants) ? data.participants.map(p => ({
      name: p.name || 'Unknown',
      role: p.role || null
    })) : [],
    executive_summary: Array.isArray(data.executive_summary) ? data.executive_summary : [],
    decisions_made: Array.isArray(data.decisions_made) ? data.decisions_made : [],
    discussion_topics: Array.isArray(data.discussion_topics) ? data.discussion_topics.map(t => ({
      topic: t.topic || 'Topic',
      summary: t.summary || ''
    })) : [],
    action_items: Array.isArray(data.action_items) ? data.action_items.map((item, index) => ({
      id: item.id || index + 1,
      task: item.task || 'Untitled Task',
      assignee: item.assignee || null,
      deadline: item.deadline || null,
      priority: ['P1', 'P2', 'P3', 'P4', 'High', 'Medium', 'Low'].includes(item.priority) ? item.priority : 'P2',
      type: item.type || 'General',
      category: item.category || 'General Operations',
      details: item.details || null,
      subtasks: Array.isArray(item.subtasks) ? item.subtasks.map((st, stIndex) => ({
        id: st.id || `${index + 1}.${stIndex + 1}`,
        task: st.task || 'Subtask',
        assignee: st.assignee || null,
        deadline: st.deadline || null
      })) : []
    })) : [],
    sentiment: {
      score: typeof data.sentiment?.score === 'number' ? Math.min(5, Math.max(1, data.sentiment.score)) : 3,
      summary: data.sentiment?.summary || 'No sentiment analysis available',
      highlights: Array.isArray(data.sentiment?.highlights) ? data.sentiment.highlights : []
    },
    next_steps: Array.isArray(data.next_steps) ? data.next_steps : []
  };
}

function getDefaultStructure(meetingTitle, meetingLink) {
  return {
    meeting: {
      title: meetingTitle || 'Untitled Meeting',
      date: null,
      time: null,
      duration: null,
      recording_link: meetingLink || null
    },
    participants: [],
    executive_summary: ['Meeting data could not be fully processed'],
    decisions_made: [],
    discussion_topics: [],
    action_items: [],
    sentiment: {
      score: 3,
      summary: 'Unable to analyze sentiment',
      highlights: []
    },
    next_steps: []
  };
}
