/**
 * Generates email HTML that matches the MeetingMinutesDetail UI
 * @param {Object} jsonContent - The meeting JSON content
 * @param {string} meetingName - The meeting name
 * @param {string} createdAt - The creation date
 * @param {number[]} completedItemIds - Array of completed action item IDs to exclude from email
 */

export function generateEmailHTML(jsonContent, meetingName, createdAt, completedItemIds = []) {
  if (!jsonContent) {
    return getEmptyEmailHTML(meetingName);
  }

  const { meeting, participants, executive_summary, decisions_made, action_items, sentiment, next_steps } = jsonContent;
  
  // Filter out completed action items
  const pendingActionItems = action_items?.filter(item => !completedItemIds.includes(item.id)) || [];

  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${escapeHTML(meeting?.title || meetingName || 'Meeting Minutes')}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
            background-color: #fafafa;
            color: #1a1a1a;
            line-height: 1.6;
            padding: 40px 20px;
        }
        .container {
            max-width: 900px;
            margin: 0 auto;
            background-color: #ffffff;
            border-radius: 12px;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
            overflow: hidden;
        }
        .header {
            background: linear-gradient(135deg, #f97316 0%, #ea580c 100%);
            color: white;
            padding: 40px;
        }
        .header h1 {
            font-size: 28px;
            font-weight: 600;
            margin-bottom: 12px;
            letter-spacing: -0.025em;
        }
        .header-meta {
            display: flex;
            flex-wrap: wrap;
            gap: 16px;
            font-size: 14px;
            opacity: 0.95;
        }
        .header-meta-item {
            display: flex;
            align-items: center;
            gap: 6px;
        }
        .icon {
            width: 16px;
            height: 16px;
            display: inline-block;
            font-weight: 600;
            font-size: 14px;
        }
        .badge {
            display: inline-block;
            padding: 4px 12px;
            background-color: rgba(255, 255, 255, 0.2);
            border-radius: 12px;
            font-size: 12px;
            font-weight: 500;
        }
        .content {
            padding: 40px;
        }
        .section {
            margin-bottom: 32px;
        }
        .section-header {
            display: flex;
            align-items: center;
            gap: 8px;
            margin-bottom: 16px;
            padding-bottom: 12px;
            border-bottom: 2px solid #f5f5f5;
        }
        .section-title {
            font-size: 18px;
            font-weight: 600;
            color: #1a1a1a;
        }
        .card {
            background-color: #fafafa;
            border: 1px solid #e5e5e5;
            border-radius: 8px;
            padding: 20px;
            margin-bottom: 16px;
        }
        .participants-grid {
            display: flex;
            flex-wrap: wrap;
            gap: 12px;
        }
        .participant {
            display: flex;
            align-items: center;
            gap: 12px;
            background-color: #ffffff;
            border: 1px solid #e5e5e5;
            border-radius: 24px;
            padding: 8px 16px;
        }
        .participant-avatar {
            width: 32px;
            height: 32px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: 600;
            font-size: 14px;
            color: white;
        }
        .participant-info {
            display: flex;
            flex-direction: column;
        }
        .participant-name {
            font-weight: 500;
            font-size: 14px;
            color: #1a1a1a;
        }
        .participant-role {
            font-size: 12px;
            color: #737373;
        }
        .bullet-list {
            list-style: none;
            padding: 0;
        }
        .bullet-list li {
            padding-left: 24px;
            margin-bottom: 12px;
            position: relative;
            color: #404040;
            font-size: 14px;
            line-height: 1.6;
        }
        .bullet-list li:before {
            content: '';
            position: absolute;
            left: 0;
            top: 10px;
            width: 6px;
            height: 6px;
            background-color: #f97316;
            border-radius: 50%;
        }
        .action-items-table {
            width: 100%;
            border-collapse: separate;
            border-spacing: 0 8px;
        }
        .action-item-row {
            background-color: #ffffff;
            border: 1px solid #e5e5e5;
            border-radius: 8px;
        }
        .action-item-row td {
            padding: 16px;
            vertical-align: top;
        }
        .action-item-row td:first-child {
            border-top-left-radius: 8px;
            border-bottom-left-radius: 8px;
        }
        .action-item-row td:last-child {
            border-top-right-radius: 8px;
            border-bottom-right-radius: 8px;
        }
        .priority-badge {
            display: inline-block;
            padding: 4px 12px;
            border-radius: 4px;
            font-size: 12px;
            font-weight: 600;
            text-transform: uppercase;
        }
        .priority-high {
            background-color: #fee2e2;
            color: #dc2626;
        }
        .priority-medium {
            background-color: #fef3c7;
            color: #d97706;
        }
        .priority-low {
            background-color: #d1fae5;
            color: #059669;
        }
        .task-title {
            font-weight: 600;
            color: #1a1a1a;
            margin-bottom: 4px;
            font-size: 14px;
        }
        .task-details {
            color: #737373;
            font-size: 13px;
            margin-top: 4px;
        }
        .subtasks {
            margin-top: 12px;
            padding-left: 16px;
            border-left: 2px solid #e5e5e5;
        }
        .subtask {
            color: #737373;
            font-size: 13px;
            margin-bottom: 6px;
            padding-left: 8px;
        }
        .assignee-badge {
            display: inline-block;
            background-color: #f5f5f5;
            padding: 4px 10px;
            border-radius: 4px;
            font-size: 12px;
            color: #404040;
        }
        .deadline-text {
            font-size: 12px;
            color: #737373;
        }
        .sentiment-score {
            display: flex;
            align-items: center;
            gap: 16px;
            margin-bottom: 12px;
        }
        .sentiment-number {
            font-size: 36px;
            font-weight: 700;
            color: #059669;
        }
        .sentiment-bars {
            display: flex;
            gap: 4px;
        }
        .sentiment-bar {
            width: 8px;
            height: 32px;
            border-radius: 2px;
        }
        .sentiment-bar.filled {
            background-color: #059669;
        }
        .sentiment-bar.empty {
            background-color: #e5e5e5;
        }
        .sentiment-summary {
            color: #737373;
            font-size: 14px;
        }
        .next-steps-list {
            list-style: none;
            padding: 0;
        }
        .next-steps-list li {
            display: flex;
            align-items: flex-start;
            gap: 12px;
            margin-bottom: 12px;
            padding: 12px;
            background-color: #ffffff;
            border: 1px solid #e5e5e5;
            border-radius: 6px;
        }
        .step-number {
            width: 24px;
            height: 24px;
            background-color: #f3e8ff;
            color: #7c3aed;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 12px;
            font-weight: 600;
            flex-shrink: 0;
        }
        .step-text {
            color: #404040;
            font-size: 14px;
            line-height: 1.6;
        }
        .decision-item {
            display: flex;
            align-items: flex-start;
            gap: 12px;
            padding: 12px;
            background-color: #ffffff;
            border: 1px solid #e5e5e5;
            border-radius: 6px;
            margin-bottom: 8px;
        }
        .decision-icon {
            color: #059669;
            flex-shrink: 0;
            margin-top: 2px;
        }
        .decision-text {
            color: #404040;
            font-size: 14px;
            line-height: 1.6;
        }
        .footer {
            background-color: #fafafa;
            padding: 24px 40px;
            text-align: center;
            border-top: 1px solid #e5e5e5;
            color: #737373;
            font-size: 12px;
        }
        .avatar-orange { background-color: #fb923c; }
        .avatar-blue { background-color: #60a5fa; }
        .avatar-green { background-color: #4ade80; }
        .avatar-purple { background-color: #a78bfa; }
        .avatar-pink { background-color: #f472b6; }
    </style>
</head>
<body>
    <div class="container">
        <!-- Header -->
        <div class="header">
            <h1>${escapeHTML(meeting?.title || meetingName || 'Meeting Minutes')}</h1>
            <div class="header-meta">
                ${meeting?.date ? `<div class="header-meta-item">${escapeHTML(meeting.date)}</div>` : ''}
                ${meeting?.time ? `<div class="header-meta-item">${escapeHTML(meeting.time)}</div>` : ''}
                ${meeting?.duration ? `<span class="badge">${escapeHTML(meeting.duration)}</span>` : ''}
            </div>
        </div>

        <!-- Content -->
        <div class="content">
            ${renderParticipantsSection(participants)}
            ${renderExecutiveSummarySection(executive_summary)}
            ${renderDecisionsSection(decisions_made)}
            ${renderActionItemsSection(pendingActionItems)}
            ${renderSentimentSection(sentiment)}
            ${renderNextStepsSection(next_steps)}
        </div>

        <!-- Footer -->
        <div class="footer">
            Generated on ${new Date(createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
        </div>
    </div>
</body>
</html>`;
}

function renderParticipantsSection(participants) {
  if (!participants || participants.length === 0) return '';
  
  const avatarColors = ['avatar-orange', 'avatar-blue', 'avatar-green', 'avatar-purple', 'avatar-pink'];
  
  return `
    <div class="section">
        <div class="section-header">
            <h2 class="section-title">Participants</h2>
        </div>
        <div class="card">
            <div class="participants-grid">
                ${participants.map((p, index) => `
                    <div class="participant">
                        <div class="participant-avatar ${avatarColors[index % avatarColors.length]}">
                            ${escapeHTML(p.name?.charAt(0)?.toUpperCase() || '?')}
                        </div>
                        <div class="participant-info">
                            <div class="participant-name">${escapeHTML(p.name)}</div>
                            ${p.role ? `<div class="participant-role">${escapeHTML(p.role)}</div>` : ''}
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
    </div>`;
}

function renderExecutiveSummarySection(summary) {
  if (!summary || summary.length === 0) return '';
  
  return `
    <div class="section">
        <div class="section-header">
            <h2 class="section-title">Executive Summary</h2>
        </div>
        <div class="card">
            <ul class="bullet-list">
                ${summary.map(item => `<li>${escapeHTML(item)}</li>`).join('')}
            </ul>
        </div>
    </div>`;
}

function renderDecisionsSection(decisions) {
  if (!decisions || decisions.length === 0) return '';
  
  return `
    <div class="section">
        <div class="section-header">
            <h2 class="section-title">Decisions Made</h2>
        </div>
        <div class="card">
            ${decisions.map(item => `
                <div class="decision-item">
                    <span class="decision-icon">✓</span>
                    <div class="decision-text">${escapeHTML(item)}</div>
                </div>
            `).join('')}
        </div>
    </div>`;
}

function renderActionItemsSection(items) {
  if (!items || items.length === 0) return '';
  
  const completedCount = 0;
  const totalCount = items.length;
  const progressPercent = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;
  
  return `
    <div class="section">
        <div class="section-header">
            <h2 class="section-title">Action Items</h2>
            <span style="margin-left: auto; font-size: 14px; color: #737373;">${completedCount} of ${totalCount} completed</span>
        </div>
        <table class="action-items-table">
            ${items.map(item => `
                <tr class="action-item-row">
                    <td style="width: 80px;">
                        <span class="priority-badge priority-${item.priority?.toLowerCase() || 'medium'}">
                            ${escapeHTML(item.priority || 'Medium')}
                        </span>
                    </td>
                    <td>
                        <div class="task-title">${escapeHTML(item.task)}</div>
                        ${item.details ? `<div class="task-details">${escapeHTML(item.details)}</div>` : ''}
                        ${renderSubtasks(item.subtasks)}
                    </td>
                    <td style="width: 120px; text-align: center;">
                        ${item.assignee ? `<span class="assignee-badge">${escapeHTML(item.assignee)}</span>` : '<span style="color: #a3a3a3;">-</span>'}
                    </td>
                    <td style="width: 100px; text-align: center;">
                        ${item.deadline ? `<span class="deadline-text">${escapeHTML(item.deadline)}</span>` : '<span style="color: #a3a3a3;">-</span>'}
                    </td>
                </tr>
            `).join('')}
        </table>
    </div>`;
}

function renderSubtasks(subtasks) {
  if (!subtasks || subtasks.length === 0) return '';
  
  return `
    <div class="subtasks">
        ${subtasks.map(st => `
            <div class="subtask">
                • ${escapeHTML(st.task)}
                ${st.assignee ? ` (${escapeHTML(st.assignee)})` : ''}
                ${st.deadline ? ` - ${escapeHTML(st.deadline)}` : ''}
            </div>
        `).join('')}
    </div>`;
}

function renderSentimentSection(sentiment) {
  if (!sentiment || !sentiment.score) return '';
  
  const score = Math.min(5, Math.max(1, sentiment.score));
  
  return `
    <div class="section">
        <div class="section-header">
            <h2 class="section-title">Meeting Sentiment</h2>
        </div>
        <div class="card">
            <div class="sentiment-score">
                <div class="sentiment-number">${score}/5</div>
                <div class="sentiment-bars">
                    ${[1, 2, 3, 4, 5].map(i => `
                        <div class="sentiment-bar ${i <= score ? 'filled' : 'empty'}"></div>
                    `).join('')}
                </div>
            </div>
            ${sentiment.summary ? `<div class="sentiment-summary">${escapeHTML(sentiment.summary)}</div>` : ''}
        </div>
    </div>`;
}

function renderNextStepsSection(steps) {
  if (!steps || steps.length === 0) return '';
  
  return `
    <div class="section">
        <div class="section-header">
            <h2 class="section-title">Next Steps</h2>
        </div>
        <div class="card">
            <ul class="next-steps-list">
                ${steps.map((item, index) => `
                    <li>
                        <div class="step-number">${index + 1}</div>
                        <div class="step-text">${escapeHTML(item)}</div>
                    </li>
                `).join('')}
            </ul>
        </div>
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

function getEmptyEmailHTML(meetingName) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${escapeHTML(meetingName || 'Meeting Minutes')}</title>
</head>
<body style="font-family: Arial, sans-serif; padding: 40px; background-color: #fafafa;">
    <div style="max-width: 600px; margin: 0 auto; background-color: white; padding: 40px; border-radius: 8px;">
        <h1>${escapeHTML(meetingName || 'Meeting Minutes')}</h1>
        <p>No meeting data available.</p>
    </div>
</body>
</html>`;
}
