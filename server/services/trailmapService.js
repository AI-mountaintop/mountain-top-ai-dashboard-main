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
    setProgressStatus(jobId, 'processing');

    // Step 0: Fetch transcript if needed
    if (meetingLink && !meetingTranscript) {
      updateProgress(jobId, 0, false);
      const meetingData = await fetchTranscriptFromLink(meetingLink);
      transcript = meetingData.transcript;
      meetingName = meetingData.meetingName || meetingName;
      finalMeetingLink = meetingLink;
      updateProgress(jobId, 0, true);
    } else if (meetingTranscript) {
      // Transcript provided directly, mark step 0 as complete
      updateProgress(jobId, 0, true);
    }

    if (!transcript) {
      throw new Error('Transcript is required to generate trailmap');
    }

    // Steps 1-5: Run all AI agents in parallel
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
        updateProgress(jobId, 1, true);
        return result;
      }),
      generateProjectBrief(transcript).then(result => {
        updateProgress(jobId, 2, true);
        return result;
      }),
      generateMarketingPlan(transcript).then(result => {
        updateProgress(jobId, 3, true);
        return result;
      }),
      generateProjectResources(transcript).then(result => {
        updateProgress(jobId, 4, true);
        return result;
      }),
      generateHTMLDocument(transcript).then(result => {
        updateProgress(jobId, 5, true);
        return result;
      })
    ]);

    // Steps 6-7: Create Google Docs and Slides
    // TEMPORARY: Skip Google Docs/Slides creation due to OpenSSL key format issues
    // TODO: Regenerate service account key or implement alternative authentication
    updateProgress(jobId, 6, false);
    updateProgress(jobId, 7, false);
    
    let docResult = { documentId: null, documentUrl: null };
    let slidesResult = { presentationId: null, presentationUrl: null };
    
    try {
      console.log(`[Job ${jobId}] Creating Google Doc and Slides...`);
      const [doc, slides] = await Promise.all([
        createGoogleDoc({
          meetingName,
          htmlContent: htmlDocument,
          businessOverview,
          projectBrief,
          marketingPlan,
          folderId: process.env.GOOGLE_DRIVE_TRAILMAP_FOLDER_ID
        }).then(result => {
          console.log(`[Job ${jobId}] ✅ Google Doc created: ${result.documentUrl}`);
          updateProgress(jobId, 6, true);
          return result;
        }).catch(error => {
          console.error(`[Job ${jobId}] ❌ Google Doc creation failed:`, error.message);
          console.error(`[Job ${jobId}] Error details:`, error);
          updateProgress(jobId, 6, true); // Mark as complete even if failed
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
          console.log(`[Job ${jobId}] ✅ Google Slides created: ${result.presentationUrl}`);
          updateProgress(jobId, 7, true);
          return result;
        }).catch(error => {
          console.error(`[Job ${jobId}] ❌ Google Slides creation failed:`, error.message);
          console.error(`[Job ${jobId}] Error details:`, error);
          updateProgress(jobId, 7, true); // Mark as complete even if failed
          return { presentationId: null, presentationUrl: null };
        })
      ]);
      
      docResult = doc;
      slidesResult = slides;
      console.log(`[Job ${jobId}] Document creation summary:`, {
        doc: docResult.documentId ? '✅ Created' : '❌ Failed',
        slides: slidesResult.presentationId ? '✅ Created' : '❌ Failed'
      });
    } catch (error) {
      console.error(`[Job ${jobId}] ❌ Google Docs/Slides creation failed:`, error.message);
      console.error(`[Job ${jobId}] Error details:`, error);
      updateProgress(jobId, 6, true);
      updateProgress(jobId, 7, true);
    }

    // Step 8: Save to Supabase
    updateProgress(jobId, 8, false);
    const trailmapLink = slidesResult.presentationId 
      ? `https://docs.google.com/presentation/d/${slidesResult.presentationId}`
      : null;
    const reportLink = docResult.documentId
      ? `https://docs.google.com/document/d/${docResult.documentId}`
      : null;
    
    console.log(`[Job ${jobId}] Saving to Supabase:`, {
      meetingName,
      trailmapLink: trailmapLink ? '✅' : '❌',
      reportLink: reportLink ? '✅' : '❌'
    });
    
    const supabaseResult = await saveToSupabase({
      meetingName,
      meetingLink: finalMeetingLink,
      trailmapLink,
      reportLink
    });
    
    if (supabaseResult?.id) {
      console.log(`[Job ${jobId}] ✅ Saved to Supabase with ID: ${supabaseResult.id}`);
    } else {
      console.error(`[Job ${jobId}] ❌ Failed to save to Supabase - record will not appear in history!`);
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

    setProgressStatus(jobId, 'completed', null, result);
    return result;
  } catch (error) {
    setProgressStatus(jobId, 'failed', error.message);
    throw error;
  }
}

