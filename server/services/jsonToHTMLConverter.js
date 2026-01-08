/**
 * Converts meeting JSON data to HTML for Google Docs
 */

export function convertJSONToHTML(data) {
  if (!data) {
    return getEmptyHTML();
  }

  const { meeting, participants, executive_summary, decisions_made, discussion_topics, action_items, sentiment, next_steps } = data;

  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${escapeHTML(meeting?.title || 'Meeting Summary')}</title>
    <style>
        body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; color: #333; }
        h1 { color: #1a1a1a; border-bottom: 2px solid #e5e5e5; padding-bottom: 10px; }
        h2 { color: #333; margin-top: 30px; font-size: 18px; }
        .meta { color: #666; font-size: 14px; margin-bottom: 20px; }
        .section { background: #f9f9f9; border-radius: 8px; padding: 16px; margin: 16px 0; }
        .participants { display: flex; flex-wrap: wrap; gap: 12px; }
        .participant { background: #fff; border: 1px solid #e5e5e5; border-radius: 20px; padding: 8px 16px; font-size: 14px; }
        .participant-role { color: #666; font-size: 12px; }
        ul { margin: 0; padding-left: 20px; }
        li { margin: 8px 0; line-height: 1.5; }
        table { width: 100%; border-collapse: collapse; margin: 16px 0; }
        th { background: #f5f5f5; text-align: left; padding: 12px; font-weight: 600; border-bottom: 2px solid #e5e5e5; }
        td { padding: 12px; border-bottom: 1px solid #e5e5e5; vertical-align: top; }
        .priority-high { background: #fee2e2; color: #dc2626; padding: 4px 8px; border-radius: 4px; font-weight: 600; font-size: 12px; }
        .priority-medium { background: #fef3c7; color: #d97706; padding: 4px 8px; border-radius: 4px; font-weight: 600; font-size: 12px; }
        .priority-low { background: #d1fae5; color: #059669; padding: 4px 8px; border-radius: 4px; font-weight: 600; font-size: 12px; }
        .subtask { color: #666; font-size: 13px; margin-left: 20px; }
        .sentiment-score { font-size: 24px; font-weight: bold; color: #059669; }
        .recording-link { color: #2563eb; text-decoration: none; }
        .recording-link:hover { text-decoration: underline; }
    </style>
</head>
<body>
    <h1>${escapeHTML(meeting?.title || 'Meeting Summary')}</h1>
    
    <div class="meta">
        ${meeting?.date ? `<span>${escapeHTML(meeting.date)}</span>` : ''}
        ${meeting?.time ? `<span> | ${escapeHTML(meeting.time)}</span>` : ''}
        ${meeting?.duration ? `<span> | ${escapeHTML(meeting.duration)}</span>` : ''}
        ${meeting?.recording_link ? `<br><a href="${escapeHTML(meeting.recording_link)}" class="recording-link">View Recording</a>` : ''}
    </div>

    ${renderParticipants(participants)}
    ${renderExecutiveSummary(executive_summary)}
    ${renderDecisions(decisions_made)}
    ${renderDiscussionTopics(discussion_topics)}
    ${renderActionItems(action_items)}
    ${renderSentiment(sentiment)}
    ${renderNextSteps(next_steps)}

</body>
</html>`;
}

function renderParticipants(participants) {
  if (!participants || participants.length === 0) return '';
  
  return `
    <h2>Participants</h2>
    <div class="section">
        <div class="participants">
            ${participants.map(p => `
                <div class="participant">
                    <strong>${escapeHTML(p.name)}</strong>
                    ${p.role ? `<span class="participant-role"> - ${escapeHTML(p.role)}</span>` : ''}
                </div>
            `).join('')}
        </div>
    </div>`;
}

function renderExecutiveSummary(summary) {
  if (!summary || summary.length === 0) return '';
  
  return `
    <h2>Executive Summary</h2>
    <div class="section">
        <ul>
            ${summary.map(item => `<li>${escapeHTML(item)}</li>`).join('')}
        </ul>
    </div>`;
}

function renderDecisions(decisions) {
  if (!decisions || decisions.length === 0) return '';
  
  return `
    <h2>Decisions Made</h2>
    <div class="section">
        <ul>
            ${decisions.map(item => `<li>${escapeHTML(item)}</li>`).join('')}
        </ul>
    </div>`;
}

function renderDiscussionTopics(topics) {
  if (!topics || topics.length === 0) return '';
  
  return `
    <h2>Discussion Topics</h2>
    <div class="section">
        ${topics.map(t => `
            <p><strong>${escapeHTML(t.topic)}</strong></p>
            <p>${escapeHTML(t.summary)}</p>
        `).join('')}
    </div>`;
}

function renderActionItems(items) {
  if (!items || items.length === 0) return '';
  
  return `
    <h2>Action Items</h2>
    <table>
        <thead>
            <tr>
                <th style="width: 80px;">Priority</th>
                <th style="width: 100px;">Type</th>
                <th>Task</th>
                <th style="width: 100px;">Assignee</th>
                <th style="width: 100px;">Deadline</th>
            </tr>
        </thead>
        <tbody>
            ${items.map(item => `
                <tr>
                    <td><span class="priority-${item.priority?.toLowerCase() || 'medium'}">${escapeHTML(item.priority || 'Medium')}</span></td>
                    <td>${escapeHTML(item.type || 'General')}</td>
                    <td>
                        <strong>${escapeHTML(item.task)}</strong>
                        ${item.details ? `<br><span style="color: #666; font-size: 13px;">${escapeHTML(item.details)}</span>` : ''}
                        ${renderSubtasks(item.subtasks)}
                    </td>
                    <td>${escapeHTML(item.assignee || '-')}</td>
                    <td>${escapeHTML(item.deadline || '-')}</td>
                </tr>
            `).join('')}
        </tbody>
    </table>`;
}

function renderSubtasks(subtasks) {
  if (!subtasks || subtasks.length === 0) return '';
  
  return `
    <div style="margin-top: 8px;">
        ${subtasks.map(st => `
            <div class="subtask">
                - ${escapeHTML(st.task)}
                ${st.assignee ? ` (${escapeHTML(st.assignee)})` : ''}
                ${st.deadline ? ` - ${escapeHTML(st.deadline)}` : ''}
            </div>
        `).join('')}
    </div>`;
}

function renderSentiment(sentiment) {
  if (!sentiment) return '';
  
  return `
    <h2>Meeting Sentiment</h2>
    <div class="section">
        <p><span class="sentiment-score">${sentiment.score}/5</span></p>
        <p>${escapeHTML(sentiment.summary)}</p>
        ${sentiment.highlights && sentiment.highlights.length > 0 ? `
            <ul>
                ${sentiment.highlights.map(h => `<li>${escapeHTML(h)}</li>`).join('')}
            </ul>
        ` : ''}
    </div>`;
}

function renderNextSteps(steps) {
  if (!steps || steps.length === 0) return '';
  
  return `
    <h2>Next Steps</h2>
    <div class="section">
        <ul>
            ${steps.map(item => `<li>${escapeHTML(item)}</li>`).join('')}
        </ul>
    </div>`;
}

function escapeHTML(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function getEmptyHTML() {
  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Meeting Summary</title>
</head>
<body>
    <h1>Meeting Summary</h1>
    <p>No meeting data available.</p>
</body>
</html>`;
}
