import { fetchTranscriptFromLink } from './meetgeekService.js';
import { generateMeetingSummary } from './ai/meetingSummaryAgent.js';
import { generateSentimentAnalysis } from './ai/sentimentAgent.js';
import { extractActionItems } from './ai/actionItemsExtractionAgent.js';
import { consolidateActionItems } from './ai/actionItemsConsolidationAgent.js';
import { mapTasksToTranscript } from './ai/taskMappingAgent.js';
import { refineActionItems } from './ai/actionItemsRefinementAgent.js';
import { finalConsolidation } from './ai/finalConsolidationAgent.js';
import { generateActionItemsHTML } from './ai/actionItemsHTMLAgent.js';
import { createGoogleDoc } from './google/docsService.js';
import { saveActionItemsToSupabase } from './supabaseService.js';
import { initProgress, updateProgress, setProgressStatus } from './progressService.js';

const ACTION_ITEMS_FOLDER_ID = process.env.GOOGLE_DRIVE_ACTION_ITEMS_FOLDER_ID || '1Hq0HghcY3W2XsaM8g4gFc3PZVOmJ3qAX';

export async function generateActionItems({ meetGeekUrl, meetingTranscript, email, jobId }) {
  let transcript = meetingTranscript || '';
  let meetingName = 'Untitled Meeting';
  let meetingLink = meetGeekUrl || '';

  try {
    // Step 0: Fetch transcript from MeetGeek if URL provided, otherwise use provided transcript
    updateProgress(jobId, 0, false);
    if (meetGeekUrl && !meetingTranscript) {
      // Fetch transcript from MeetGeek URL
      const meetingData = await fetchTranscriptFromLink(meetGeekUrl);
      transcript = meetingData.transcript;
      meetingName = meetingData.meetingName || meetingName;
      meetingLink = meetGeekUrl;
    } else if (meetingTranscript) {
      // Transcript provided directly, mark step 0 as complete
      transcript = meetingTranscript;
      // Try to extract meeting name from transcript if possible
      // For now, keep as "Untitled Meeting" or could extract from first few lines
    }
    updateProgress(jobId, 0, true);

    if (!transcript || !transcript.trim()) {
      throw new Error('Transcript is required to generate action items');
    }

    // Step 1: Generate meeting summary, sentiment, and extract initial action items in parallel
    updateProgress(jobId, 1, false);
    const [summary, sentiment, initialActionItems1, initialActionItems2] = await Promise.all([
      generateMeetingSummary(transcript),
      generateSentimentAnalysis(transcript),
      extractActionItems(transcript, meetingLink),
      extractActionItems(transcript, meetingLink) // AI Agent13 - same as AI Agent9
    ]);
    updateProgress(jobId, 1, true);

    // Step 2: Consolidate initial action items
    updateProgress(jobId, 2, false);
    const consolidatedActionItems = await consolidateActionItems(
      initialActionItems1,
      initialActionItems2
    );
    updateProgress(jobId, 2, true);

    // Step 3: Map tasks to transcript for traceability
    updateProgress(jobId, 3, false);
    const taskMapping = await mapTasksToTranscript(consolidatedActionItems, transcript, meetingLink);
    updateProgress(jobId, 3, true);

    // Step 4: Refine action items with traceability
    updateProgress(jobId, 4, false);
    const refinedActionItems = await refineActionItems(taskMapping);
    updateProgress(jobId, 4, true);

    // Step 5: Final consolidation with subtasks
    updateProgress(jobId, 5, false);
    const finalActionItems = await finalConsolidation(refinedActionItems);
    updateProgress(jobId, 5, true);

    // Step 6: Generate HTML email
    updateProgress(jobId, 6, false);
    const htmlContent = await generateActionItemsHTML({
      meetingTitle: meetingName,
      meetingSummary: summary,
      sentimentAnalysis: sentiment,
      actionItems: finalActionItems,
      meetingLink: meetingLink
    });
    updateProgress(jobId, 6, true);

    // Step 7: Create Google Doc
    updateProgress(jobId, 7, false);
    const docResult = await createGoogleDoc({
      meetingName: `Meeting action items for :- ${meetingName}`,
      htmlContent: htmlContent,
      folderId: ACTION_ITEMS_FOLDER_ID
    });
    updateProgress(jobId, 7, true);

    // Step 8: Save to Supabase
    updateProgress(jobId, 8, false);
    const supabaseResult = await saveActionItemsToSupabase({
      meetingName,
      meetgeekUrl: meetingLink,
      googleDriveLink: docResult.documentUrl,
      htmlContent: htmlContent
    });
    updateProgress(jobId, 8, true);

    const result = {
      meetingName,
      googleDriveLink: docResult.documentUrl,
      htmlContent,
      supabaseId: supabaseResult?.id
    };

    setProgressStatus(jobId, 'completed', null, result);
    return result;
  } catch (error) {
    console.error(`[Job ${jobId}] Error generating action items:`, error);
    setProgressStatus(jobId, 'failed', error.message, null);
    throw error;
  }
}

