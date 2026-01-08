// In-memory progress tracking (for production, use Redis or database)
const progressStore = new Map();

/**
 * Initialize progress for a generation job
 * @param {string} jobId - Unique job identifier
 * @param {string} type - Type of job: 'trailmap' or 'actionItems'
 */
export function initProgress(jobId, type = 'trailmap') {
  if (type === 'actionItems') {
    progressStore.set(jobId, {
      status: 'pending',
      currentStep: 0,
      totalSteps: 9,
      steps: [
        { name: 'Fetching meeting transcript...', completed: false },
        { name: 'Analyzing meeting content...', completed: false },
        { name: 'Consolidating action items...', completed: false },
        { name: 'Mapping tasks to transcript...', completed: false },
        { name: 'Refining action items...', completed: false },
        { name: 'Creating final structure with subtasks...', completed: false },
        { name: 'Generating structured data...', completed: false },
        { name: 'Creating Google Doc...', completed: false },
        { name: 'Saving to database...', completed: false }
      ],
      error: null,
      result: null,
      startTime: Date.now()
    });
  } else {
    // Default: trailmap
    progressStore.set(jobId, {
      status: 'pending',
      currentStep: 0,
      totalSteps: 9,
      steps: [
        { name: 'Fetching meeting transcript...', completed: false },
        { name: 'AI generating business overview...', completed: false },
        { name: 'AI creating project brief...', completed: false },
        { name: 'AI developing marketing plan...', completed: false },
        { name: 'AI compiling project resources...', completed: false },
        { name: 'Generating HTML document...', completed: false },
        { name: 'Creating Google Doc...', completed: false },
        { name: 'Creating Google Slides presentation...', completed: false },
        { name: 'Saving to database...', completed: false }
      ],
      error: null,
      result: null,
      startTime: Date.now()
    });
  }
}

/**
 * Update progress for a specific step
 */
export function updateProgress(jobId, stepIndex, completed = true) {
  const progress = progressStore.get(jobId);
  if (!progress) return;

  if (stepIndex >= 0 && stepIndex < progress.steps.length) {
    progress.steps[stepIndex].completed = completed;
    
    // Find the first incomplete step to set as current
    if (completed) {
      let firstIncomplete = progress.steps.length;
      for (let i = 0; i < progress.steps.length; i++) {
        if (!progress.steps[i].completed) {
          firstIncomplete = i;
          break;
        }
      }
      progress.currentStep = firstIncomplete;
    }
  }

  progressStore.set(jobId, progress);
}

/**
 * Set progress status
 */
export function setProgressStatus(jobId, status, error = null, result = null) {
  const progress = progressStore.get(jobId);
  if (!progress) return;

  progress.status = status;
  if (error) progress.error = error;
  if (result) progress.result = result;

  progressStore.set(jobId, progress);
}

/**
 * Get progress for a job
 */
export function getProgress(jobId) {
  const progress = progressStore.get(jobId);
  if (!progress) return null;
  
  // Calculate percentage based on completed steps
  const completedSteps = progress.steps.filter(step => step.completed).length;
  const percentage = Math.round((completedSteps / progress.totalSteps) * 100);
  
  return {
    ...progress,
    percentage
  };
}

/**
 * Clean up old progress (older than 1 hour)
 */
export function cleanupOldProgress() {
  const oneHourAgo = Date.now() - 60 * 60 * 1000;
  for (const [jobId, progress] of progressStore.entries()) {
    if (progress.startTime < oneHourAgo) {
      progressStore.delete(jobId);
    }
  }
}

// Clean up old progress every 30 minutes
setInterval(cleanupOldProgress, 30 * 60 * 1000);

