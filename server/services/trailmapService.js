import { fetchTranscriptFromLink } from './meetgeekService.js';
import { generateBusinessOverview } from './ai/businessOverviewAgent.js';
import { generateProjectBrief } from './ai/projectBriefAgent.js';
import { generateMarketingPlan } from './ai/marketingPlanAgent.js';
import { generateProjectResources } from './ai/projectResourcesAgent.js';
import { generateHTMLDocument } from './ai/htmlGeneratorAgent.js';
import { createGoogleDoc } from './google/docsService.js';
import { createGoogleSlides } from './google/slidesService.js';
import { saveToSupabase } from './supabaseService.js';
import { updateProgress, setProgressStatus } from './progressService.js';

export async function generateTrailmap({ meetingLink, meetingTranscript, jobId }) {
  let transcript = meetingTranscript;
  let meetingName = 'Untitled Meeting';
  let finalMeetingLink = meetingLink;

  try {
    console.log(`\n[Job ${jobId}] Starting Digital Trailmap generation...`);
    console.log(`[Job ${jobId}] Input type: ${meetingLink ? 'MeetGeek URL' : 'Direct transcript'}`);
    
    setProgressStatus(jobId, 'processing');

    // Step 0: Fetch transcript if needed
    if (meetingLink && !meetingTranscript) {
      updateProgress(jobId, 0, false);
      console.log(`[Job ${jobId}] Step 1/9: Fetching transcript from MeetGeek...`);
      console.log(`[Job ${jobId}] URL: ${meetingLink}`);
      
      const meetingData = await fetchTranscriptFromLink(meetingLink);
      transcript = meetingData.transcript;
      meetingName = meetingData.meetingName || meetingName;
      finalMeetingLink = meetingLink;
      
      console.log(`[Job ${jobId}] Transcript fetched successfully`);
      console.log(`[Job ${jobId}] Meeting name: ${meetingName}`);
      console.log(`[Job ${jobId}] Transcript length: ${transcript.length} characters`);
      updateProgress(jobId, 0, true);
    } else if (meetingTranscript) {
      // Transcript provided directly, mark step 0 as complete
      console.log(`[Job ${jobId}] Step 1/9: Using provided transcript`);
      console.log(`[Job ${jobId}] Transcript length: ${transcript.length} characters`);
      updateProgress(jobId, 0, true);
    }

    if (!transcript) {
      throw new Error('Transcript is required to generate trailmap');
    }

    // Steps 1-5: Run all AI agents in parallel
    console.log(`[Job ${jobId}] Steps 2-6/9: Running 5 AI agents in parallel...`);
    console.log(`[Job ${jobId}] - Business Overview Agent`);
    console.log(`[Job ${jobId}] - Project Brief Agent`);
    console.log(`[Job ${jobId}] - Marketing Plan Agent`);
    console.log(`[Job ${jobId}] - Project Resources Agent`);
    console.log(`[Job ${jobId}] - HTML Document Generator`);
    
    updateProgress(jobId, 1, false);
    updateProgress(jobId, 2, false);
    updateProgress(jobId, 3, false);
    updateProgress(jobId, 4, false);
    updateProgress(jobId, 5, false);

    const [
      businessOverview,
      projectBrief,
      marketingPlan,
      projectResources,
      htmlDocument
    ] = await Promise.all([
      generateBusinessOverview(transcript).then(result => {
        console.log(`[Job ${jobId}] ✓ Business Overview completed`);
        updateProgress(jobId, 1, true);
        return result;
      }),
      generateProjectBrief(transcript).then(result => {
        console.log(`[Job ${jobId}] ✓ Project Brief completed`);
        updateProgress(jobId, 2, true);
        return result;
      }),
      generateMarketingPlan(transcript).then(result => {
        console.log(`[Job ${jobId}] ✓ Marketing Plan completed`);
        updateProgress(jobId, 3, true);
        return result;
      }),
      generateProjectResources(transcript).then(result => {
        console.log(`[Job ${jobId}] ✓ Project Resources completed`);
        updateProgress(jobId, 4, true);
        return result;
      }),
      generateHTMLDocument(transcript).then(result => {
        console.log(`[Job ${jobId}] ✓ HTML Document completed`);
        updateProgress(jobId, 5, true);
        return result;
      })
    ]);

    console.log(`[Job ${jobId}] All AI agents completed successfully`);

    // Steps 6-7: Create Google Docs and Slides
    console.log(`[Job ${jobId}] Step 7/9: Creating Google Doc...`);
    console.log(`[Job ${jobId}] Step 8/9: Creating Google Slides...`);
    
    updateProgress(jobId, 6, false);
    updateProgress(jobId, 7, false);
    
    let docResult = { documentId: null, documentUrl: null };
    let slidesResult = { presentationId: null, presentationUrl: null };
    
    try {
      const [doc, slides] = await Promise.all([
        createGoogleDoc({
          meetingName,
          htmlContent: htmlDocument,
          businessOverview,
          projectBrief,
          marketingPlan,
          folderId: process.env.GOOGLE_DRIVE_TRAILMAP_FOLDER_ID
        }).then(result => {
          console.log(`[Job ${jobId}] Google Doc created: ${result.documentUrl}`);
          updateProgress(jobId, 6, true);
          return result;
        }).catch(error => {
          console.error(`[Job ${jobId}] Google Doc creation failed: ${error.message}`);
          updateProgress(jobId, 6, true);
          return { documentId: null, documentUrl: null };
        }),
        createGoogleSlides({
          meetingName,
          businessOverview,
          projectBrief,
          marketingPlan,
          projectResources,
          folderId: process.env.GOOGLE_DRIVE_TRAILMAP_FOLDER_ID
        }).then(result => {
          console.log(`[Job ${jobId}] Google Slides created: ${result.presentationUrl}`);
          updateProgress(jobId, 7, true);
          return result;
        }).catch(error => {
          console.error(`[Job ${jobId}] Google Slides creation failed: ${error.message}`);
          updateProgress(jobId, 7, true);
          return { presentationId: null, presentationUrl: null };
        })
      ]);
      
      docResult = doc;
      slidesResult = slides;
    } catch (error) {
      console.error(`[Job ${jobId}] Google Docs/Slides creation failed: ${error.message}`);
      updateProgress(jobId, 6, true);
      updateProgress(jobId, 7, true);
    }

    // Step 8: Save to Supabase
    updateProgress(jobId, 8, false);
    console.log(`[Job ${jobId}] Step 9/9: Saving to database...`);
    
    const trailmapLink = slidesResult.presentationId 
      ? `https://docs.google.com/presentation/d/${slidesResult.presentationId}`
      : null;
    const reportLink = docResult.documentId
      ? `https://docs.google.com/document/d/${docResult.documentId}`
      : null;
    
    const supabaseResult = await saveToSupabase({
      meetingName,
      meetingLink: finalMeetingLink,
      trailmapLink,
      reportLink
    });
    
    if (supabaseResult?.id) {
      console.log(`[Job ${jobId}] Saved to database with ID: ${supabaseResult.id}`);
    } else {
      console.error(`[Job ${jobId}] Failed to save to database`);
    }
    
    updateProgress(jobId, 8, true);

    const result = {
      meetingName,
      trailmapLink: slidesResult.presentationId 
        ? `https://docs.google.com/presentation/d/${slidesResult.presentationId}`
        : null,
      reportLink: docResult.documentId
        ? `https://docs.google.com/document/d/${docResult.documentId}`
        : null,
      supabaseId: supabaseResult?.id
    };

    console.log(`[Job ${jobId}] Digital Trailmap generation completed successfully!`);
    console.log(`[Job ${jobId}] Results:`, {
      meetingName,
      hasTrailmap: !!result.trailmapLink,
      hasReport: !!result.reportLink,
      savedToDatabase: !!result.supabaseId
    });

    setProgressStatus(jobId, 'completed', null, result);
    return result;
  } catch (error) {
    console.error(`[Job ${jobId}] Digital Trailmap generation failed: ${error.message}`);
    setProgressStatus(jobId, 'failed', error.message);
    throw error;
  }
}

