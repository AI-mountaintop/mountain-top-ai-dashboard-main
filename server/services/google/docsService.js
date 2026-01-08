import { google } from 'googleapis';
import { getGoogleAuth } from './authHelper.js';
import { JSDOM } from 'jsdom';

/**
 * Parse HTML and extract structured content with better detail preservation
 */
function parseHTMLContent(html) {
  try {
    const dom = new JSDOM(html);
    const document = dom.window.document;
    
    const content = [];
    
    function processNode(node, level = 0, inList = false) {
      if (node.nodeType === 3) { // Text node
        const text = node.textContent.trim();
        if (text && !inList) {
          // Only add standalone text if not inside a list (lists handle their own text)
          content.push({ type: 'paragraph', text });
        }
      } else if (node.nodeType === 1) { // Element node
        const tagName = node.tagName.toLowerCase();
        
        if (tagName === 'h1') {
          const text = node.textContent.trim();
          if (text) content.push({ type: 'heading1', text });
        } else if (tagName === 'h2') {
          const text = node.textContent.trim();
          if (text) content.push({ type: 'heading2', text });
        } else if (tagName === 'h3') {
          const text = node.textContent.trim();
          if (text) content.push({ type: 'heading3', text });
        } else if (tagName === 'h4') {
          const text = node.textContent.trim();
          if (text) content.push({ type: 'heading3', text }); // Map h4 to heading3
        } else if (tagName === 'p') {
          const text = node.textContent.trim();
          // Only add non-empty paragraphs
          if (text && text.length > 0) {
            content.push({ type: 'paragraph', text });
          }
        } else if (tagName === 'li') {
          const text = node.textContent.trim();
          if (text) content.push({ type: 'bullet', text, level });
        } else if (tagName === 'ul' || tagName === 'ol') {
          // Process list items
          Array.from(node.children).forEach(child => {
            if (child.tagName.toLowerCase() === 'li') {
              processNode(child, level, true);
            }
          });
        } else if (tagName === 'div' || tagName === 'section' || tagName === 'article') {
          // Process container elements recursively
          Array.from(node.childNodes).forEach(child => processNode(child, level, inList));
        } else if (tagName === 'strong' || tagName === 'b' || tagName === 'em' || tagName === 'i') {
          // For inline formatting, just get the text (formatting will be lost but content preserved)
          const text = node.textContent.trim();
          if (text && !inList) {
            content.push({ type: 'paragraph', text });
          }
        } else if (tagName === 'br') {
          // Skip line breaks - they create empty space
        } else {
          // For any other element, process children
          Array.from(node.childNodes).forEach(child => processNode(child, level, inList));
        }
      }
    }
    
    const body = document.body || document.documentElement;
    Array.from(body.childNodes).forEach(node => processNode(node));
    
    // Filter out any empty content blocks
    const filteredContent = content.filter(block => {
      if (!block.text) return false;
      const trimmed = block.text.trim();
      return trimmed.length > 0 && trimmed !== '\n' && trimmed !== '\r\n';
    });
    
    console.log(`Parsed ${filteredContent.length} content blocks from HTML (filtered from ${content.length})`);
    
    return filteredContent;
  } catch (error) {
    console.error('Error parsing HTML:', error);
    return [];
  }
}

/**
 * Create a Google Doc for meeting action items with proper table formatting
 */
export async function createMeetingActionItemsDoc({ meetingName, jsonContent, folderId }) {
  try {
    const auth = await getGoogleAuth();
    const docs = google.docs({ version: 'v1', auth });
    const drive = google.drive({ version: 'v3', auth });

    console.log('Creating Google Doc for meeting action items...');
    
    // Step 1: Create empty document
    const createResponse = await drive.files.create({
      requestBody: {
        name: meetingName,
        mimeType: 'application/vnd.google-apps.document',
        parents: folderId ? [folderId] : undefined
      },
      fields: 'id'
    });

    const documentId = createResponse.data.id;
    console.log(`Document created with ID: ${documentId}`);

    const { meeting, participants, executive_summary, decisions_made, action_items, sentiment, next_steps } = jsonContent || {};

    // Build all text content first (before table)
    let textContent = '';
    
    // Title
    const title = meeting?.title || meetingName || 'Meeting Minutes';
    textContent += title + '\n\n';
    
    // Meeting info
    if (meeting?.date || meeting?.time || meeting?.duration) {
      const metaText = [meeting?.date, meeting?.time, meeting?.duration].filter(Boolean).join(' | ');
      textContent += metaText + '\n\n';
    }

    // Participants
    if (participants?.length > 0) {
      textContent += 'Participants\n';
      participants.forEach(p => {
        textContent += `${p.name}${p.role ? ` - ${p.role}` : ''}\n`;
      });
      textContent += '\n';
    }

    // Executive Summary
    if (executive_summary?.length > 0) {
      textContent += 'Executive Summary\n\n';
      executive_summary.forEach(item => {
        textContent += `• ${item}\n`;
      });
      textContent += '\n';
    }

    // Decisions Made
    if (decisions_made?.length > 0) {
      textContent += 'Decisions Made\n\n';
      decisions_made.forEach(item => {
        textContent += `• ${item}\n`;
      });
      textContent += '\n';
    }

    // Action Items Header
    if (action_items?.length > 0) {
      textContent += 'Action Items\n\n';
    }

    // Insert all text content first
    await docs.documents.batchUpdate({
      documentId,
      requestBody: {
        requests: [{
          insertText: {
            location: { index: 1 },
            text: textContent
          }
        }]
      }
    });

    // Apply formatting to headers
    const formatRequests = [];
    let searchIndex = 1;
    
    // Title formatting
    formatRequests.push({
      updateParagraphStyle: {
        range: { startIndex: 1, endIndex: 1 + title.length },
        paragraphStyle: { namedStyleType: 'HEADING_1' },
        fields: 'namedStyleType'
      }
    });

    // Find and format section headers
    const headers = ['Participants', 'Executive Summary', 'Decisions Made', 'Action Items'];
    let currentPos = 1;
    
    for (const header of headers) {
      const headerIndex = textContent.indexOf(header);
      if (headerIndex !== -1) {
        formatRequests.push({
          updateParagraphStyle: {
            range: { startIndex: 1 + headerIndex, endIndex: 1 + headerIndex + header.length },
            paragraphStyle: { namedStyleType: 'HEADING_2' },
            fields: 'namedStyleType'
          }
        });
      }
    }

    // Apply formatting
    if (formatRequests.length > 0) {
      await docs.documents.batchUpdate({
        documentId,
        requestBody: { requests: formatRequests }
      });
    }

    // Now create the action items table
    if (action_items?.length > 0) {
      // Get current document state
      const docState = await docs.documents.get({ documentId });
      const endIndex = docState.data.body.content[docState.data.body.content.length - 1].endIndex - 1;

      // Create table with 5 columns: Priority, Type, Task, Assignee, Deadline
      const numRows = action_items.length + 1; // +1 for header
      const numCols = 5;

      await docs.documents.batchUpdate({
        documentId,
        requestBody: {
          requests: [{
            insertTable: {
              rows: numRows,
              columns: numCols,
              location: { index: endIndex }
            }
          }]
        }
      });

      // Get the table structure
      const docWithTable = await docs.documents.get({ documentId });
      const tableElement = docWithTable.data.body.content.find(el => el.table);

      if (tableElement?.table) {
        const table = tableElement.table;
        
        // Prepare all cell content - we need to insert from END to START to avoid index shifting
        const cellInserts = [];
        
        // Collect all cell data first
        const allCellData = [];
        
        // Header row
        const headers = ['Priority', 'Type', 'Task', 'Assignee', 'Deadline'];
        const headerRow = table.tableRows[0];
        for (let col = 0; col < numCols; col++) {
          const cell = headerRow.tableCells[col];
          if (cell?.content?.[0]?.startIndex) {
            allCellData.push({
              index: cell.content[0].startIndex,
              text: headers[col],
              isBold: true
            });
          }
        }

        // Data rows
        for (let row = 1; row <= action_items.length; row++) {
          const item = action_items[row - 1];
          const tableRow = table.tableRows[row];
          
          if (!tableRow) continue;

          // Priority (convert P1/P2/P3/P4 to High/Medium/Low)
          let priorityText = item.priority || 'Medium';
          if (priorityText === 'P1') priorityText = 'High';
          else if (priorityText === 'P2') priorityText = 'Medium';
          else if (priorityText === 'P3') priorityText = 'Medium';
          else if (priorityText === 'P4') priorityText = 'Low';
          
          const priorityCell = tableRow.tableCells[0];
          if (priorityCell?.content?.[0]?.startIndex) {
            allCellData.push({
              index: priorityCell.content[0].startIndex,
              text: priorityText,
              isBold: false
            });
          }

          // Type
          const typeCell = tableRow.tableCells[1];
          if (typeCell?.content?.[0]?.startIndex) {
            allCellData.push({
              index: typeCell.content[0].startIndex,
              text: item.type || item.category || '-',
              isBold: false
            });
          }

          // Task (with details and subtasks)
          let taskText = item.task || '';
          if (item.details) {
            taskText += '\n\n' + item.details;
          }
          if (item.subtasks?.length > 0) {
            taskText += '\n\nSubtasks:';
            item.subtasks.forEach(st => {
              taskText += `\n• ${st.task}`;
              if (st.assignee) taskText += ` (${st.assignee})`;
              if (st.deadline) taskText += ` - ${st.deadline}`;
            });
          }
          const taskCell = tableRow.tableCells[2];
          if (taskCell?.content?.[0]?.startIndex) {
            allCellData.push({
              index: taskCell.content[0].startIndex,
              text: taskText,
              isBold: false,
              boldFirstLine: true
            });
          }

          // Assignee
          const assigneeCell = tableRow.tableCells[3];
          if (assigneeCell?.content?.[0]?.startIndex) {
            allCellData.push({
              index: assigneeCell.content[0].startIndex,
              text: item.assignee || '-',
              isBold: false
            });
          }

          // Deadline
          const deadlineCell = tableRow.tableCells[4];
          if (deadlineCell?.content?.[0]?.startIndex) {
            allCellData.push({
              index: deadlineCell.content[0].startIndex,
              text: item.deadline || '-',
              isBold: false
            });
          }
        }

        // Sort by index descending (insert from end to start)
        allCellData.sort((a, b) => b.index - a.index);

        // Create insert requests
        const insertRequests = allCellData.map(cell => ({
          insertText: {
            location: { index: cell.index },
            text: cell.text
          }
        }));

        // Apply all inserts
        if (insertRequests.length > 0) {
          console.log(`Inserting ${insertRequests.length} table cells...`);
          await docs.documents.batchUpdate({
            documentId,
            requestBody: { requests: insertRequests }
          });
        }

        // Now apply bold formatting to headers and task titles
        const updatedDoc = await docs.documents.get({ documentId });
        const updatedTable = updatedDoc.data.body.content.find(el => el.table);
        
        if (updatedTable?.table) {
          const boldRequests = [];
          
          // Bold header row
          const headerRowCells = updatedTable.table.tableRows[0].tableCells;
          for (const cell of headerRowCells) {
            if (cell.content?.[0]?.paragraph?.elements?.[0]) {
              const elem = cell.content[0].paragraph.elements[0];
              if (elem.startIndex && elem.endIndex && elem.endIndex > elem.startIndex) {
                boldRequests.push({
                  updateTextStyle: {
                    range: { startIndex: elem.startIndex, endIndex: elem.endIndex - 1 },
                    textStyle: { bold: true },
                    fields: 'bold'
                  }
                });
              }
            }
          }

          // Apply bold formatting
          if (boldRequests.length > 0) {
            await docs.documents.batchUpdate({
              documentId,
              requestBody: { requests: boldRequests }
            });
          }
        }
      }
    }

    // Add remaining sections after table
    const finalDoc = await docs.documents.get({ documentId });
    let finalIndex = finalDoc.data.body.content[finalDoc.data.body.content.length - 1].endIndex - 1;

    let finalText = '';

    // Sentiment
    if (sentiment?.score) {
      finalText += '\n\nMeeting Sentiment\n';
      finalText += `Score: ${sentiment.score}/5\n`;
      if (sentiment.summary) finalText += `${sentiment.summary}\n`;
    }

    // Next Steps
    if (next_steps?.length > 0) {
      finalText += '\nNext Steps\n';
      next_steps.forEach((step, i) => {
        finalText += `${i + 1}. ${step}\n`;
      });
    }

    if (finalText) {
      await docs.documents.batchUpdate({
        documentId,
        requestBody: {
          requests: [{
            insertText: {
              location: { index: finalIndex },
              text: finalText
            }
          }]
        }
      });
    }

    const documentUrl = `https://docs.google.com/document/d/${documentId}/edit`;
    console.log(`Meeting action items doc created: ${documentUrl}`);

    return { documentId, documentUrl };
  } catch (error) {
    console.error('Error creating meeting action items doc:', error);
    throw new Error(`Failed to create meeting action items doc: ${error.message}`);
  }
}

/**
 * Create a Google Doc with formatted content using Google Docs API
 */
export async function createGoogleDoc({ meetingName, htmlContent, businessOverview, projectBrief, marketingPlan, folderId }) {
  try {
    const auth = await getGoogleAuth();
    const docs = google.docs({ version: 'v1', auth });
    const drive = google.drive({ version: 'v3', auth });

    // Parse HTML to structured content
    console.log('Parsing HTML content...');
    const parsedContent = parseHTMLContent(htmlContent);
    console.log(`Parsed ${parsedContent.length} content blocks`);

    // Step 1: Create empty document
    console.log('Creating empty Google Doc...');
    const createResponse = await drive.files.create({
      requestBody: {
        name: `${meetingName} - report`,
        mimeType: 'application/vnd.google-apps.document',
        parents: folderId ? [folderId] : undefined
      },
      fields: 'id'
    });

    const documentId = createResponse.data.id;
    console.log(`Document created with ID: ${documentId}`);

    // Step 2: Build batch update requests for formatting
    const requests = [];
    let currentIndex = 1; // Start at index 1 (after title)

    for (const block of parsedContent) {
      if (block.type === 'heading1') {
        // Insert text
        requests.push({
          insertText: {
            location: { index: currentIndex },
            text: block.text + '\n'
          }
        });
        
        // Apply heading 1 style
        requests.push({
          updateParagraphStyle: {
            range: {
              startIndex: currentIndex,
              endIndex: currentIndex + block.text.length
            },
            paragraphStyle: {
              namedStyleType: 'HEADING_1'
            },
            fields: 'namedStyleType'
          }
        });
        
        currentIndex += block.text.length + 1;
      } else if (block.type === 'heading2') {
        requests.push({
          insertText: {
            location: { index: currentIndex },
            text: block.text + '\n'
          }
        });
        
        requests.push({
          updateParagraphStyle: {
            range: {
              startIndex: currentIndex,
              endIndex: currentIndex + block.text.length
            },
            paragraphStyle: {
              namedStyleType: 'HEADING_2'
            },
            fields: 'namedStyleType'
          }
        });
        
        currentIndex += block.text.length + 1;
      } else if (block.type === 'heading3') {
        requests.push({
          insertText: {
            location: { index: currentIndex },
            text: block.text + '\n'
          }
        });
        
        requests.push({
          updateParagraphStyle: {
            range: {
              startIndex: currentIndex,
              endIndex: currentIndex + block.text.length
            },
            paragraphStyle: {
              namedStyleType: 'HEADING_3'
            },
            fields: 'namedStyleType'
          }
        });
        
        currentIndex += block.text.length + 1;
      } else if (block.type === 'bullet') {
        requests.push({
          insertText: {
            location: { index: currentIndex },
            text: block.text + '\n'
          }
        });
        
        // Apply bullet point
        requests.push({
          createParagraphBullets: {
            range: {
              startIndex: currentIndex,
              endIndex: currentIndex + block.text.length + 1
            },
            bulletPreset: 'BULLET_DISC_CIRCLE_SQUARE'
          }
        });
        
        currentIndex += block.text.length + 1;
      } else if (block.type === 'paragraph') {
        requests.push({
          insertText: {
            location: { index: currentIndex },
            text: block.text + '\n'
          }
        });
        
        currentIndex += block.text.length + 1;
      }
    }

    // Step 3: Apply all formatting in batch
    if (requests.length > 0) {
      console.log(`Applying ${requests.length} formatting requests...`);
      
      // Split into chunks of 100 requests (API limit)
      const chunkSize = 100;
      for (let i = 0; i < requests.length; i += chunkSize) {
        const chunk = requests.slice(i, i + chunkSize);
        await docs.documents.batchUpdate({
          documentId,
          requestBody: {
            requests: chunk
          }
        });
        console.log(`Applied chunk ${Math.floor(i / chunkSize) + 1}/${Math.ceil(requests.length / chunkSize)}`);
      }
    }

    const documentUrl = `https://docs.google.com/document/d/${documentId}/edit`;
    console.log(`Google Doc created successfully: ${documentId}`);
    console.log(`Document URL: ${documentUrl}`);

    return {
      documentId,
      documentUrl
    };
  } catch (error) {
    console.error('Error creating Google Doc:', error);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      response: error.response?.data
    });
    
    // Provide helpful error messages
    if (error.message.includes('OAuth') || error.message.includes('token') || error.message.includes('authenticate')) {
      throw new Error(
        `Authentication error: ${error.message}. ` +
        'Please run: node server/setup-oauth.js to re-authenticate.'
      );
    }
    
    if (error.message.includes('permission') || error.message.includes('access denied')) {
      throw new Error(
        `Permission error: ${error.message}. ` +
        'Please ensure you granted all required permissions during OAuth setup.'
      );
    }
    
    if (error.message.includes('folder') || error.code === 404) {
      throw new Error(
        `Folder error: ${error.message}. ` +
        'Please check that the folder ID is correct and you have access to it.'
      );
    }
    
    throw new Error(`Failed to create Google Doc: ${error.message}`);
  }
}

