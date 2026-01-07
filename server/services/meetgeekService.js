import axios from 'axios';

const MEETGEEK_API_BASE = 'https://api.meetgeek.ai/v1';
const MEETGEEK_API_KEY = process.env.MEETGEEK_API_KEY || 'eu-sqbdtRH9dJ4JD80UIu8YpjFTOREooSIFri98xYVlbJKgIieTg457UtKcsDU8ntSO0p6ueh0W5nR6OlVk3tYiAaufZqVKhHmgnhmE81AICwSWu0P4IpLn0u5btPBtf';

/**
 * Extract meeting ID from MeetGeek URL
 */
function extractMeetingId(link) {
  if (!link || typeof link !== 'string') {
    throw new Error('Meeting link is missing or invalid');
  }

  // Extract last part after '/'
  const parts = link.split('/').filter(Boolean);
  const lastPart = parts[parts.length - 1];
  
  return lastPart;
}

/**
 * Sleep helper for retry delays
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Fetch meeting details with retry logic
 */
async function fetchMeetingDetails(meetingId, retries = 3) {
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const response = await axios.get(`${MEETGEEK_API_BASE}/meetings/${meetingId}`, {
        headers: {
          'Authorization': `Bearer ${MEETGEEK_API_KEY}`
        },
        params: {
          cursor: ''
        }
      });

      return response.data;
    } catch (error) {
      // If rate limited (429), wait and retry
      if (error.response?.status === 429 && attempt < retries - 1) {
        const waitTime = Math.pow(2, attempt) * 1000; // Exponential backoff: 1s, 2s, 4s
        console.log(`⏳ Rate limited. Waiting ${waitTime/1000}s before retry ${attempt + 1}/${retries - 1}...`);
        await sleep(waitTime);
        continue;
      }
      
      console.error('Error fetching meeting details:', error);
      throw new Error(`Failed to fetch meeting details: ${error.response?.data?.message || error.message}`);
    }
  }
}

/**
 * Fetch transcript with pagination and retry logic
 */
async function fetchTranscript(meetingId, retries = 3) {
  let allTranscripts = [];
  let cursor = '';

  do {
    for (let attempt = 0; attempt < retries; attempt++) {
      try {
        const response = await axios.get(
          `${MEETGEEK_API_BASE}/meetings/${meetingId}/transcript`,
          {
            headers: {
              'Authorization': `Bearer ${MEETGEEK_API_KEY}`
            },
            params: cursor ? { cursor } : {}
          }
        );

        const data = response.data;
        
        if (data.sentences && Array.isArray(data.sentences)) {
          allTranscripts.push(...data.sentences);
        } else if (data.transcript) {
          allTranscripts.push(data);
        }

        cursor = data.pagination?.next_cursor || '';
        break; // Success, exit retry loop
      } catch (error) {
        // If rate limited (429), wait and retry
        if (error.response?.status === 429 && attempt < retries - 1) {
          const waitTime = Math.pow(2, attempt) * 1000; // Exponential backoff: 1s, 2s, 4s
          console.log(`⏳ Rate limited. Waiting ${waitTime/1000}s before retry ${attempt + 1}/${retries - 1}...`);
          await sleep(waitTime);
          continue;
        }
        
        console.error('Error fetching transcript:', error);
        throw new Error(`Failed to fetch transcript: ${error.response?.data?.message || error.message}`);
      }
    }
  } while (cursor);

  return allTranscripts;
}

/**
 * Process and format transcript
 */
function processTranscript(transcriptItems) {
  let transcript = '';
  let lastSpeaker = null;

  for (const item of transcriptItems) {
    const { transcript: text, speaker } = item;
    if (!text) continue;

    if (speaker !== lastSpeaker) {
      if (transcript) transcript += '\n\n';
      transcript += `${speaker}:\n`;
      lastSpeaker = speaker;
    }

    transcript += text + ' ';
  }

  return transcript.trim();
}

/**
 * Main function to fetch transcript from meeting link
 */
export async function fetchTranscriptFromLink(meetingLink) {
  try {
    // Extract meeting ID
    const meetingId = extractMeetingId(meetingLink);

    // Fetch meeting details and transcript in parallel
    const [meetingDetails, transcriptItems] = await Promise.all([
      fetchMeetingDetails(meetingId),
      fetchTranscript(meetingId)
    ]);

    // Process transcript
    const processedTranscript = processTranscript(transcriptItems);

    return {
      transcript: processedTranscript,
      meetingName: meetingDetails.title || 'Untitled Meeting',
      meetingId
    };
  } catch (error) {
    console.error('Error in fetchTranscriptFromLink:', error);
    throw error;
  }
}

