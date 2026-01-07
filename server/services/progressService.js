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
        { name: 'Fetching transcript from MeetGeek', completed: false },
        { name: 'Generating meeting summary and extracting action items', completed: false },
        { name: 'Consolidating action items', completed: false },
        { name: 'Mapping tasks to transcript', completed: false },
        { name: 'Refining action items', completed: false },
        { name: 'Final consolidation with subtasks', completed: false },
        { name: 'Generating HTML content', completed: false },
        { name: 'Creating Google Doc', completed: false },
        { name: 'Saving to database', completed: false }
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
        { name: 'Fetching transcript', completed: false },
        { name: 'Generating business overview', completed: false },
        { name: 'Generating project brief', completed: false },
        { name: 'Generating marketing plan', completed: false },
        { name: 'Generating project resources', completed: false },
        { name: 'Generating HTML document', completed: false },
        { name: 'Creating Google Doc', completed: false },
        { name: 'Creating Google Slides', completed: false },
        { name: 'Saving to database', completed: false }
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
    if (completed) {
      progress.currentStep = Math.max(progress.currentStep, stepIndex + 1);
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
  return progressStore.get(jobId) || null;
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

