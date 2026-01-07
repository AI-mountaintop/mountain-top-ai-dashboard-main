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
    console.log(`\n🚀 [Job ${jobId}] Starting action items generation...`);
    
    // Step 0: Fetch transcript from MeetGeek if URL provided, otherwise use provided transcript
    updateProgress(jobId, 0, false);
    console.log(`📥 [Job ${jobId}] Step 1/9: Fetching transcript...`);
    
    if (meetGeekUrl && !meetingTranscript) {
      // Fetch transcript from MeetGeek URL
      const meetingData = await fetchTranscriptFromLink(meetGeekUrl);
      transcript = meetingData.transcript;
      meetingName = meetingData.meetingName || meetingName;
      meetingLink = meetGeekUrl;
      console.log(`✅ [Job ${jobId}] Transcript fetched: ${transcript.length} characters`);
    } else if (meetingTranscript) {
      // Transcript provided directly, mark step 0 as complete
      transcript = meetingTranscript;
      console.log(`✅ [Job ${jobId}] Using provided transcript: ${transcript.length} characters`);
    }
    updateProgress(jobId, 0, true);

    if (!transcript || !transcript.trim()) {
      throw new Error('Transcript is required to generate action items');
    }

    // Step 1: Generate meeting summary, sentiment, and extract initial action items in parallel
    updateProgress(jobId, 1, false);
    console.log(`🤖 [Job ${jobId}] Step 2/9: AI analyzing meeting (running 4 AI agents in parallel)...`);
    
    const [summary, sentiment, initialActionItems1, initialActionItems2] = await Promise.all([
      generateMeetingSummary(transcript),
      generateSentimentAnalysis(transcript),
      extractActionItems(transcript, meetingLink),
      extractActionItems(transcript, meetingLink) // AI Agent13 - same as AI Agent9
    ]);
    console.log(`✅ [Job ${jobId}] Meeting analysis complete`);
    updateProgress(jobId, 1, true);

    // Step 2: Consolidate initial action items
    updateProgress(jobId, 2, false);
    console.log(`🔄 [Job ${jobId}] Step 3/9: Consolidating action items...`);
    
    const consolidatedActionItems = await consolidateActionItems(
      initialActionItems1,
      initialActionItems2
    );
    console.log(`✅ [Job ${jobId}] Action items consolidated`);
    updateProgress(jobId, 2, true);

    // Step 3: Map tasks to transcript for traceability
    updateProgress(jobId, 3, false);
    console.log(`🔗 [Job ${jobId}] Step 4/9: Mapping tasks to transcript...`);
    
    const taskMapping = await mapTasksToTranscript(consolidatedActionItems, transcript, meetingLink);
    console.log(`✅ [Job ${jobId}] Tasks mapped to conversations`);
    updateProgress(jobId, 3, true);

    // Step 4: Refine action items with traceability
    updateProgress(jobId, 4, false);
    console.log(`✨ [Job ${jobId}] Step 5/9: Refining action items...`);
    
    const refinedActionItems = await refineActionItems(taskMapping);
    console.log(`✅ [Job ${jobId}] Action items refined`);
    updateProgress(jobId, 4, true);

    // Step 5: Final consolidation with subtasks
    updateProgress(jobId, 5, false);
    console.log(`📋 [Job ${jobId}] Step 6/9: Creating final action items with subtasks...`);
    
    const finalActionItems = await finalConsolidation(refinedActionItems);
    console.log(`✅ [Job ${jobId}] Final action items created`);
    updateProgress(jobId, 5, true);

    // Step 6: Generate HTML email
    updateProgress(jobId, 6, false);
    console.log(`🎨 [Job ${jobId}] Step 7/9: Generating HTML document...`);
    
    const htmlContent = await generateActionItemsHTML({
      meetingTitle: meetingName,
      meetingSummary: summary,
      sentimentAnalysis: sentiment,
      actionItems: finalActionItems,
      meetingLink: meetingLink
    });
    console.log(`✅ [Job ${jobId}] HTML document generated`);
    updateProgress(jobId, 6, true);

    // Step 7: Create Google Doc
    updateProgress(jobId, 7, false);
    console.log(`📄 [Job ${jobId}] Step 8/9: Creating Google Doc...`);
    
    const docResult = await createGoogleDoc({
      meetingName: `Meeting action items for :- ${meetingName}`,
      htmlContent: htmlContent,
      folderId: ACTION_ITEMS_FOLDER_ID
    });
    console.log(`✅ [Job ${jobId}] Google Doc created: ${docResult.documentUrl}`);
    updateProgress(jobId, 7, true);

    // Step 8: Save to Supabase
    updateProgress(jobId, 8, false);
    console.log(`💾 [Job ${jobId}] Step 9/9: Saving to database...`);
    
    const supabaseResult = await saveActionItemsToSupabase({
      meetingName,
      meetgeekUrl: meetingLink,
      googleDriveLink: docResult.documentUrl,
      htmlContent: htmlContent
    });
    console.log(`✅ [Job ${jobId}] Saved to database`);
    updateProgress(jobId, 8, true);

    const result = {
      meetingName,
      googleDriveLink: docResult.documentUrl,
      htmlContent,
      supabaseId: supabaseResult?.id
    };

    console.log(`🎉 [Job ${jobId}] Action items generation completed successfully!`);
    setProgressStatus(jobId, 'completed', null, result);
    return result;
  } catch (error) {
    console.error(`❌ [Job ${jobId}] Error generating action items:`, error);
    setProgressStatus(jobId, 'failed', error.message, null);
    throw error;
  }
}

