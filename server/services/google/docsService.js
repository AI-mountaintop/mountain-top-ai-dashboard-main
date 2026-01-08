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
          if (text) content.push({ type: 'paragraph', text });
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
          // Skip line breaks
        } else {
          // For any other element, process children
          Array.from(node.childNodes).forEach(child => processNode(child, level, inList));
        }
      }
    }
    
    const body = document.body || document.documentElement;
    Array.from(body.childNodes).forEach(node => processNode(node));
    
    console.log(`Parsed ${content.length} content blocks from HTML`);
    
    return content;
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

    // Step 1: Create empty document
    console.log('Creating Google Doc for meeting action items...');
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

    // Step 2: Build content from JSON
    const requests = [];
    let currentIndex = 1;

    const { meeting, participants, executive_summary, decisions_made, action_items, sentiment, next_steps } = jsonContent || {};

    // Title
    const title = meeting?.title || meetingName || 'Meeting Minutes';
    requests.push({
      insertText: { location: { index: currentIndex }, text: title + '\n' }
    });
    requests.push({
      updateParagraphStyle: {
        range: { startIndex: currentIndex, endIndex: currentIndex + title.length },
        paragraphStyle: { namedStyleType: 'HEADING_1' },
        fields: 'namedStyleType'
      }
    });
    currentIndex += title.length + 1;

    // Meeting info
    if (meeting?.date || meeting?.time || meeting?.duration) {
      const metaText = [meeting?.date, meeting?.time, meeting?.duration].filter(Boolean).join(' | ');
      requests.push({
        insertText: { location: { index: currentIndex }, text: metaText + '\n\n' }
      });
      currentIndex += metaText.length + 2;
    }

    // Participants
    if (participants?.length > 0) {
      requests.push({
        insertText: { location: { index: currentIndex }, text: 'Participants\n' }
      });
      requests.push({
        updateParagraphStyle: {
          range: { startIndex: currentIndex, endIndex: currentIndex + 12 },
          paragraphStyle: { namedStyleType: 'HEADING_2' },
          fields: 'namedStyleType'
        }
      });
      currentIndex += 13;

      const participantText = participants.map(p => `${p.name}${p.role ? ` (${p.role})` : ''}`).join(', ') + '\n\n';
      requests.push({
        insertText: { location: { index: currentIndex }, text: participantText }
      });
      currentIndex += participantText.length;
    }

    // Executive Summary
    if (executive_summary?.length > 0) {
      requests.push({
        insertText: { location: { index: currentIndex }, text: 'Executive Summary\n' }
      });
      requests.push({
        updateParagraphStyle: {
          range: { startIndex: currentIndex, endIndex: currentIndex + 17 },
          paragraphStyle: { namedStyleType: 'HEADING_2' },
          fields: 'namedStyleType'
        }
      });
      currentIndex += 18;

      for (const item of executive_summary) {
        requests.push({
          insertText: { location: { index: currentIndex }, text: item + '\n' }
        });
        requests.push({
          createParagraphBullets: {
            range: { startIndex: currentIndex, endIndex: currentIndex + item.length + 1 },
            bulletPreset: 'BULLET_DISC_CIRCLE_SQUARE'
          }
        });
        currentIndex += item.length + 1;
      }
      requests.push({
        insertText: { location: { index: currentIndex }, text: '\n' }
      });
      currentIndex += 1;
    }

    // Decisions Made
    if (decisions_made?.length > 0) {
      requests.push({
        insertText: { location: { index: currentIndex }, text: 'Decisions Made\n' }
      });
      requests.push({
        updateParagraphStyle: {
          range: { startIndex: currentIndex, endIndex: currentIndex + 14 },
          paragraphStyle: { namedStyleType: 'HEADING_2' },
          fields: 'namedStyleType'
        }
      });
      currentIndex += 15;

      for (const item of decisions_made) {
        requests.push({
          insertText: { location: { index: currentIndex }, text: item + '\n' }
        });
        requests.push({
          createParagraphBullets: {
            range: { startIndex: currentIndex, endIndex: currentIndex + item.length + 1 },
            bulletPreset: 'BULLET_DISC_CIRCLE_SQUARE'
          }
        });
        currentIndex += item.length + 1;
      }
      requests.push({
        insertText: { location: { index: currentIndex }, text: '\n' }
      });
      currentIndex += 1;
    }

    // Action Items Header
    if (action_items?.length > 0) {
      requests.push({
        insertText: { location: { index: currentIndex }, text: 'Action Items\n\n' }
      });
      requests.push({
        updateParagraphStyle: {
          range: { startIndex: currentIndex, endIndex: currentIndex + 12 },
          paragraphStyle: { namedStyleType: 'HEADING_2' },
          fields: 'namedStyleType'
        }
      });
      currentIndex += 14;
    }

    // Apply initial content before table
    if (requests.length > 0) {
      console.log(`Applying ${requests.length} initial content requests...`);
      const chunkSize = 100;
      for (let i = 0; i < requests.length; i += chunkSize) {
        const chunk = requests.slice(i, i + chunkSize);
        await docs.documents.batchUpdate({
          documentId,
          requestBody: { requests: chunk }
        });
      }
    }

    // Create Action Items Table
    if (action_items?.length > 0) {
      // Get current document to find end index
      const docState = await docs.documents.get({ documentId });
      const endIndex = docState.data.body.content[docState.data.body.content.length - 1].endIndex - 1;

      // Insert table
      const numRows = action_items.length + 1; // +1 for header
      const numCols = 4; // Task, Assignee, Deadline, Priority

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

      // Get updated document to find table
      const updatedDoc = await docs.documents.get({ documentId });
      const tableElement = updatedDoc.data.body.content.find(el => el.table);
      
      if (tableElement && tableElement.table) {
        const tableRequests = [];
        const table = tableElement.table;
        
        // Header row
        const headers = ['Task', 'Assignee', 'Deadline', 'Priority'];
        for (let col = 0; col < numCols; col++) {
          const cell = table.tableRows[0].tableCells[col];
          const cellStartIndex = cell.content[0].startIndex;
          
          tableRequests.push({
            insertText: {
              location: { index: cellStartIndex },
              text: headers[col]
            }
          });
        }

        // Apply headers first
        if (tableRequests.length > 0) {
          await docs.documents.batchUpdate({
            documentId,
            requestBody: { requests: tableRequests }
          });
        }

        // Get updated doc for data rows
        const docWithHeaders = await docs.documents.get({ documentId });
        const tableWithHeaders = docWithHeaders.data.body.content.find(el => el.table);
        
        if (tableWithHeaders && tableWithHeaders.table) {
          const dataRequests = [];
          
          // Data rows
          for (let row = 1; row <= action_items.length; row++) {
            const item = action_items[row - 1];
            const tableRow = tableWithHeaders.table.tableRows[row];
            
            if (tableRow) {
              // Task (with subtasks)
              let taskText = item.task || '';
              if (item.subtasks?.length > 0) {
                taskText += '\n' + item.subtasks.map(st => `  • ${st.task}`).join('\n');
              }
              const taskCell = tableRow.tableCells[0];
              if (taskCell?.content?.[0]?.startIndex) {
                dataRequests.push({
                  insertText: {
                    location: { index: taskCell.content[0].startIndex },
                    text: taskText
                  }
                });
              }

              // Assignee
              const assigneeCell = tableRow.tableCells[1];
              if (assigneeCell?.content?.[0]?.startIndex) {
                dataRequests.push({
                  insertText: {
                    location: { index: assigneeCell.content[0].startIndex },
                    text: item.assignee || '-'
                  }
                });
              }

              // Deadline
              const deadlineCell = tableRow.tableCells[2];
              if (deadlineCell?.content?.[0]?.startIndex) {
                dataRequests.push({
                  insertText: {
                    location: { index: deadlineCell.content[0].startIndex },
                    text: item.deadline || '-'
                  }
                });
              }

              // Priority
              const priorityCell = tableRow.tableCells[3];
              if (priorityCell?.content?.[0]?.startIndex) {
                dataRequests.push({
                  insertText: {
                    location: { index: priorityCell.content[0].startIndex },
                    text: item.priority || 'Medium'
                  }
                });
              }
            }
          }

          // Apply data rows
          if (dataRequests.length > 0) {
            await docs.documents.batchUpdate({
              documentId,
              requestBody: { requests: dataRequests }
            });
          }
        }
      }
    }

    // Add remaining sections after table
    const finalRequests = [];
    
    // Get current end index
    const finalDoc = await docs.documents.get({ documentId });
    let finalIndex = finalDoc.data.body.content[finalDoc.data.body.content.length - 1].endIndex - 1;

    // Sentiment
    if (sentiment?.score) {
      finalRequests.push({
        insertText: { location: { index: finalIndex }, text: '\n\nMeeting Sentiment\n' }
      });
      finalIndex += 19;
      
      const sentimentText = `Score: ${sentiment.score}/5\n${sentiment.summary || ''}\n`;
      finalRequests.push({
        insertText: { location: { index: finalIndex }, text: sentimentText }
      });
      finalIndex += sentimentText.length;
    }

    // Next Steps
    if (next_steps?.length > 0) {
      finalRequests.push({
        insertText: { location: { index: finalIndex }, text: '\nNext Steps\n' }
      });
      finalIndex += 12;

      for (let i = 0; i < next_steps.length; i++) {
        const stepText = `${i + 1}. ${next_steps[i]}\n`;
        finalRequests.push({
          insertText: { location: { index: finalIndex }, text: stepText }
        });
        finalIndex += stepText.length;
      }
    }

    // Apply final sections
    if (finalRequests.length > 0) {
      await docs.documents.batchUpdate({
        documentId,
        requestBody: { requests: finalRequests }
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

