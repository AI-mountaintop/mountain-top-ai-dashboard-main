import { google } from 'googleapis';
import axios from 'axios';
import { generateSlidesContent } from '../ai/slidesContentAgent.js';
import { getGoogleAuth } from './authHelper.js';

// Template presentation ID from n8n workflow
const TEMPLATE_PRESENTATION_ID = '1emAdBwmNjuXgtml08KrlBgpAxa2Uqqk6kfJT0uuEDb4';
// Use the trailmap folder ID from environment variable
const TARGET_FOLDER_ID = process.env.GOOGLE_DRIVE_TRAILMAP_FOLDER_ID || '132rz3Ra3K15IDMjQSbGh6N0m5wB9HZU7';

/**
 * Find template slide IDs by searching for keywords
 */
async function findTemplateSlides(presentationId, slidesClient) {
  try {
    const presentation = await slidesClient.presentations.get({
      presentationId
    });

    const slideMappings = {
      persona: null,
      journey: null,
      sitemap: null
    };

    // Search through slides for keywords
    for (const slide of presentation.data.slides || []) {
      const slideId = slide.objectId;
      const slideText = JSON.stringify(slide).toLowerCase();

      if (slideText.includes('customer persona') && !slideMappings.persona) {
        slideMappings.persona = slideId;
      } else if (slideText.includes('customer journey') && !slideMappings.journey) {
        slideMappings.journey = slideId;
      } else if ((slideText.includes('sitemap') || slideText.includes('site map')) && !slideMappings.sitemap) {
        // Only take the FIRST sitemap slide found to avoid duplicates
        slideMappings.sitemap = slideId;
      }
    }

    return slideMappings;
  } catch (error) {
    console.error('Error finding template slides:', error);
    throw error;
  }
}

/**
 * Apply replacements to a specific slide using pageObjectIds
 * This ensures replacements only affect the target slide, not the entire presentation
 */
async function applyReplacementsToSlide(slides, presentationId, slideObjectId, replacements) {
  const requests = [];
  
  replacements.forEach(({ placeholder, value }) => {
    if (value) {
      requests.push({
        replaceAllText: {
          containsText: { text: placeholder, matchCase: true },
          replaceText: value,
          pageObjectIds: [slideObjectId] // Target only this specific slide
        }
      });
    }
  });

  if (requests.length > 0) {
    await slides.presentations.batchUpdate({
      presentationId,
      requestBody: { requests }
    });
  }
}

/**
 * Generate and apply slide updates for personas, journeys, and sitemap
 * Processes each persona/journey separately to avoid overwriting data
 */
async function generateAndApplySlideRequests(slides, presentationId, projectResources, slideMappings) {
  const { customer_personas = [], customer_journeys = [], sitemap = {} } = projectResources;

  // Process each persona and its journey separately
  for (let i = 0; i < customer_personas.length; i++) {
    const persona = customer_personas[i];
    const journey = customer_journeys.find(j => j.persona_number === persona.persona_number);

    // Process persona slide
    if (slideMappings.persona && persona) {
      const personaSlideId = `persona_${persona.persona_number}`;
      
      // Step 1: Duplicate persona template and get the actual slide ID
      const duplicateResponse = await slides.presentations.batchUpdate({
        presentationId,
        requestBody: {
          requests: [{
            duplicateObject: {
              objectId: slideMappings.persona,
              objectIds: {
                [slideMappings.persona]: personaSlideId
              }
            }
          }]
        }
      });

      // Step 2: Get the ACTUAL slide object ID from the response
      // The response contains the actual object ID that was created
      const actualSlideId = duplicateResponse.data.replies[0].duplicateObject.objectId;
      
      // Small delay to ensure Google Slides has processed the duplication
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Step 2b: Get the page object ID from the slide (needed for pageObjectIds)
      // In Google Slides, pageObjectId is typically the same as objectId for slides
      // But we fetch to be sure and get the pageProperties
      const presentation = await slides.presentations.get({ presentationId });
      const duplicatedSlide = presentation.data.slides.find(s => s.objectId === actualSlideId);
      const pageObjectId = duplicatedSlide?.pageProperties?.pageObjectId || actualSlideId;
      
      console.log(`📌 Persona ${persona.persona_number}: Duplicated slide`);
      console.log(`   - Object ID: ${actualSlideId}`);
      console.log(`   - Page Object ID: ${pageObjectId}`);
      console.log(`   - Persona Data: Name="${persona.name || 'unnamed'}", Age=${persona.age || 'N/A'}, Location="${persona.location || 'N/A'}"`);

      // Step 3: Apply replacements to THIS SPECIFIC slide only using the page object ID
      const personaReplacements = [
        { placeholder: 'CUSTOMER_PERSONA', value: persona.name || '' },
        { placeholder: 'CUSTOMER_AGE', value: persona.age ? String(persona.age) : '' },
        { placeholder: 'CUSTOMER_LOCATION', value: persona.location || '' },
        { placeholder: 'CUSTOMER_DESCRIPTION', value: persona.description || '' },
        { placeholder: 'CUSTOMER_GOALS', value: Array.isArray(persona.goals) ? persona.goals.join('\n• ') : (persona.goals || '') },
        { placeholder: 'CUSTOMER_PAIN_POINTS', value: Array.isArray(persona.pain_points) ? persona.pain_points.join('\n• ') : (persona.pain_points || '') },
        { placeholder: 'CUSTOMER_PREFERENCES', value: persona.communication_preferences || '' },
        { placeholder: 'CUSTOMER_INFLUENCERS', value: Array.isArray(persona.influencers) ? persona.influencers.join('\n• ') : (persona.influencers || '') },
        { placeholder: 'CUSTOMER_HESITATIONS', value: Array.isArray(persona.hesitations) ? persona.hesitations.join('\n• ') : (persona.hesitations || '') },
        { placeholder: 'CUSTOMER_TRANSFORMATION', value: persona.transformation || '' }
      ];

      // CRITICAL: Use the page object ID (not just the slide object ID) for pageObjectIds
      await applyReplacementsToSlide(slides, presentationId, pageObjectId, personaReplacements);
      console.log(`✅ Applied persona ${persona.persona_number} (${persona.name || 'unnamed'}) replacements to slide ${actualSlideId} (page ${pageObjectId})`);
      
      // Delete template persona slide after last persona is processed (to avoid duplicates)
      if (i === customer_personas.length - 1) {
        await slides.presentations.batchUpdate({
          presentationId,
          requestBody: {
            requests: [{
              deleteObject: {
                objectId: slideMappings.persona
              }
            }]
          }
        });
        console.log('✅ Deleted template persona slide');
      }
    }

    // Process journey slide
    if (slideMappings.journey && journey && journey.stages) {
      const journeySlideId = `journey_${journey.persona_number}`;
      
      // Step 1: Duplicate journey template and get the actual slide ID
      const duplicateResponse = await slides.presentations.batchUpdate({
        presentationId,
        requestBody: {
          requests: [{
            duplicateObject: {
              objectId: slideMappings.journey,
              objectIds: {
                [slideMappings.journey]: journeySlideId
              }
            }
          }]
        }
      });

      // Step 2: Get the ACTUAL slide object ID from the response
      const actualSlideId = duplicateResponse.data.replies[0].duplicateObject.objectId;
      
      // Small delay to ensure Google Slides has processed the duplication
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Step 2b: Get the page object ID from the slide (needed for pageObjectIds)
      const presentation = await slides.presentations.get({ presentationId });
      const duplicatedSlide = presentation.data.slides.find(s => s.objectId === actualSlideId);
      const pageObjectId = duplicatedSlide?.pageProperties?.pageObjectId || actualSlideId;
      
      console.log(`📌 Journey ${journey.persona_number}: Duplicated slide`);
      console.log(`   - Object ID: ${actualSlideId}`);
      console.log(`   - Page Object ID: ${pageObjectId}`);

      // Step 3: Build replacements for journey stages
      const journeyReplacements = [];
      const stages = ['awareness', 'consideration', 'decision', 'loyalty'];
      
      console.log(`📋 Journey ${journey.persona_number}: Building replacements for ${stages.length} stages`);
      
      stages.forEach(stage => {
        const stageData = journey.stages[stage];
        const stageUpper = stage.toUpperCase();
        
        if (stageData) {
          // Touchpoints
          if (stageData.touchpoints && Array.isArray(stageData.touchpoints) && stageData.touchpoints.length > 0) {
            journeyReplacements.push({
              placeholder: `TOUCH_${stageUpper}`,
              value: stageData.touchpoints.join('\n• ')
            });
            console.log(`   ✓ TOUCH_${stageUpper}: ${stageData.touchpoints.length} items`);
          } else {
            // Replace placeholder with empty string if no data
            journeyReplacements.push({
              placeholder: `TOUCH_${stageUpper}`,
              value: ''
            });
            console.log(`   ⚠ TOUCH_${stageUpper}: No data, replacing with empty`);
          }
          
          // Actions
          if (stageData.actions && Array.isArray(stageData.actions) && stageData.actions.length > 0) {
            journeyReplacements.push({
              placeholder: `ACTION_${stageUpper}`,
              value: stageData.actions.join('\n• ')
            });
            console.log(`   ✓ ACTION_${stageUpper}: ${stageData.actions.length} items`);
          } else {
            journeyReplacements.push({
              placeholder: `ACTION_${stageUpper}`,
              value: ''
            });
            console.log(`   ⚠ ACTION_${stageUpper}: No data, replacing with empty`);
          }
          
          // Emotions
          if (stageData.emotions && String(stageData.emotions).trim()) {
            journeyReplacements.push({
              placeholder: `EMOTION_${stageUpper}`,
              value: String(stageData.emotions).trim()
            });
            console.log(`   ✓ EMOTION_${stageUpper}: "${stageData.emotions.substring(0, 50)}..."`);
          } else {
            journeyReplacements.push({
              placeholder: `EMOTION_${stageUpper}`,
              value: ''
            });
            console.log(`   ⚠ EMOTION_${stageUpper}: No data, replacing with empty`);
          }
          
          // Opportunities
          if (stageData.opportunities && Array.isArray(stageData.opportunities) && stageData.opportunities.length > 0) {
            journeyReplacements.push({
              placeholder: `OPPORTUNITY_${stageUpper}`,
              value: stageData.opportunities.join('\n• ')
            });
            console.log(`   ✓ OPPORTUNITY_${stageUpper}: ${stageData.opportunities.length} items`);
          } else {
            journeyReplacements.push({
              placeholder: `OPPORTUNITY_${stageUpper}`,
              value: ''
            });
            console.log(`   ⚠ OPPORTUNITY_${stageUpper}: No data, replacing with empty`);
          }
        } else {
          // No stage data at all - replace all placeholders with empty
          console.log(`   ⚠ Stage ${stage}: No data found, replacing all placeholders with empty`);
          journeyReplacements.push(
            { placeholder: `TOUCH_${stageUpper}`, value: '' },
            { placeholder: `ACTION_${stageUpper}`, value: '' },
            { placeholder: `EMOTION_${stageUpper}`, value: '' },
            { placeholder: `OPPORTUNITY_${stageUpper}`, value: '' }
          );
        }
      });

      // Replace customer persona name in journey slide
      if (persona.name) {
        journeyReplacements.push({
          placeholder: 'CUSTOMER_PERSONA',
          value: persona.name
        });
        console.log(`   ✓ CUSTOMER_PERSONA: "${persona.name}"`);
      }

      console.log(`📝 Journey ${journey.persona_number}: Total ${journeyReplacements.length} replacements to apply`);

      // CRITICAL: Use the page object ID (not just the slide object ID) for pageObjectIds
      await applyReplacementsToSlide(slides, presentationId, pageObjectId, journeyReplacements);
      console.log(`✅ Applied journey ${journey.persona_number} (${persona.name || 'unnamed'}) replacements to slide ${actualSlideId} (page ${pageObjectId})`);
      
      // Delete template journey slide after last journey is processed (to avoid duplicates)
      const lastJourney = customer_journeys[customer_journeys.length - 1];
      if (lastJourney && journey.persona_number === lastJourney.persona_number) {
        await slides.presentations.batchUpdate({
          presentationId,
          requestBody: {
            requests: [{
              deleteObject: {
                objectId: slideMappings.journey
              }
            }]
          }
        });
        console.log('✅ Deleted template journey slide');
      }
    }
  }

  // Process sitemap slide - UPDATE TEMPLATE DIRECTLY (no duplication needed)
  if (slideMappings.sitemap && sitemap) {
    // First, find and delete any other sitemap slides to avoid duplicates
    const presentation = await slides.presentations.get({ presentationId });
    const sitemapSlideIdsToDelete = [];
    
    for (const slide of presentation.data.slides || []) {
      const slideId = slide.objectId;
      const slideText = JSON.stringify(slide).toLowerCase();
      
      // If this is a sitemap slide but NOT the one we're keeping, mark it for deletion
      if ((slideText.includes('sitemap') || slideText.includes('site map')) && slideId !== slideMappings.sitemap) {
        sitemapSlideIdsToDelete.push(slideId);
      }
    }
    
    // Delete any duplicate sitemap slides
    if (sitemapSlideIdsToDelete.length > 0) {
      const deleteRequests = sitemapSlideIdsToDelete.map(slideId => ({
        deleteObject: { objectId: slideId }
      }));
      
      await slides.presentations.batchUpdate({
        presentationId,
        requestBody: { requests: deleteRequests }
      });
      console.log(`✅ Deleted ${sitemapSlideIdsToDelete.length} duplicate sitemap slide(s)`);
    }
    
    // Apply replacements directly to the template slide (no duplication)
    const sitemapReplacements = [];
    if (sitemap.primary_pages && Array.isArray(sitemap.primary_pages)) {
      sitemapReplacements.push({
        placeholder: 'PRIMARY_PAGES',
        value: sitemap.primary_pages.join('\n• ')
      });
    }

    if (sitemap.secondary_pages && Array.isArray(sitemap.secondary_pages)) {
      sitemapReplacements.push({
        placeholder: 'SECONDARY_PAGES',
        value: sitemap.secondary_pages.join('\n• ')
      });
    }

    await applyReplacementsToSlide(slides, presentationId, slideMappings.sitemap, sitemapReplacements);
    console.log('✅ Applied sitemap replacements directly to template slide');
  }
}

/**
 * Create Google Slides presentation
 */
export async function createGoogleSlides({ meetingName, businessOverview, projectBrief, marketingPlan, projectResources, folderId }) {
  try {
    // Get auth client (OAuth2 only)
    const auth = await getGoogleAuth();
    const drive = google.drive({ version: 'v3', auth });
    const slides = google.slides({ version: 'v1', auth });

    // Determine target folder: use provided folderId, or fall back to env var, or use default
    const targetFolderIdToUse = folderId || process.env.GOOGLE_DRIVE_TRAILMAP_FOLDER_ID || TARGET_FOLDER_ID;

    // Verify target folder exists and is accessible (if specified)
    let targetFolderId = null;
    if (targetFolderIdToUse) {
      try {
        await drive.files.get({
          fileId: targetFolderIdToUse,
          fields: 'id, name, mimeType'
        });
        targetFolderId = targetFolderIdToUse;
        console.log(`✅ Target folder verified: ${targetFolderIdToUse}`);
      } catch (folderError) {
        console.warn(`⚠️  Target folder ${targetFolderIdToUse} not accessible: ${folderError.message}`);
        console.warn('   Presentation will be created in the same location as the template.');
      }
    }

    // Copy template presentation directly into target folder
    const copyRequestBody = {
      name: `${meetingName} - Digital Trailmap Workbook`
    };
    
    // Add target folder as parent if it's accessible
    if (targetFolderId) {
      copyRequestBody.parents = [targetFolderId];
    }
    
    const copyResponse = await drive.files.copy({
      fileId: TEMPLATE_PRESENTATION_ID,
      requestBody: copyRequestBody
    });

    const presentationId = copyResponse.data.id;

    // Find template slides from the copied presentation
    const slideMappings = await findTemplateSlides(presentationId, slides);

    console.log('📊 Found template slides:', slideMappings);
    console.log('📊 Project resources:', {
      personas: projectResources?.customer_personas?.length || 0,
      journeys: projectResources?.customer_journeys?.length || 0,
      hasSitemap: !!projectResources?.sitemap
    });

    // Apply persona, journey, and sitemap updates (each processed separately to avoid overwrites)
    await generateAndApplySlideRequests(slides, presentationId, projectResources, slideMappings);

    // Generate content replacement requests for business overview, project brief, and marketing plan
    const contentRequests = await generateSlidesContent(
      businessOverview,
      projectBrief,
      marketingPlan
    );
    console.log(`📝 Generated ${contentRequests?.requests?.length || 0} content update requests`);

    // Apply content updates (these use replaceAllText but target specific placeholders that shouldn't conflict)
    if (contentRequests?.requests && contentRequests.requests.length > 0) {
      const BATCH_SIZE = 50; // Google Slides API limit
      for (let i = 0; i < contentRequests.requests.length; i += BATCH_SIZE) {
        const batch = contentRequests.requests.slice(i, i + BATCH_SIZE);
        await slides.presentations.batchUpdate({
          presentationId,
          requestBody: {
            requests: batch
          }
        });
        console.log(`✅ Applied content batch ${Math.floor(i / BATCH_SIZE) + 1} (${batch.length} requests)`);
      }
      console.log('✅ All content updates applied successfully');
    }

    // Note: File is already in target folder from copy operation above if targetFolderId was set
    // If we couldn't verify the folder earlier, the presentation will be in the template's location

    return {
      presentationId,
      presentationUrl: `https://docs.google.com/presentation/d/${presentationId}`
    };
  } catch (error) {
    console.error('Error creating Google Slides:', error);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      response: error.response?.data
    });
    
    // Provide helpful error messages for common issues
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
    
    if (error.message.includes('template') || error.code === 404) {
      throw new Error(
        `Template error: ${error.message}. ` +
        'Please check that the template presentation ID is correct and you have access to it.'
      );
    }
    
    throw new Error(`Failed to create Google Slides: ${error.message}`);
  }
}

