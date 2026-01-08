import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';

interface ProgressStep {
    name: string;
    completed: boolean;
}

interface JobProgress {
    status: 'pending' | 'completed' | 'failed';
    currentStep: number;
    totalSteps: number;
    steps: ProgressStep[];
    percentage: number;
    error?: string;
    result?: any;
}

interface ActiveJob {
    jobId: string;
    type: 'actionItems' | 'trailmap';
    startedAt: number;
}

interface JobProgressContextType {
    activeJobs: Map<string, ActiveJob>;
    jobProgress: Map<string, JobProgress>;
    startJob: (jobId: string, type: 'actionItems' | 'trailmap') => void;
    clearJob: (jobId: string) => void;
    getActiveJobByType: (type: 'actionItems' | 'trailmap') => ActiveJob | null;
    getProgressByType: (type: 'actionItems' | 'trailmap') => JobProgress | null;
}

const JobProgressContext = createContext<JobProgressContextType | null>(null);

export const useJobProgress = () => {
    const context = useContext(JobProgressContext);
    if (!context) {
        throw new Error('useJobProgress must be used within JobProgressProvider');
    }
    return context;
};

interface JobProgressProviderProps {
    children: ReactNode;
}

export const JobProgressProvider = ({ children }: JobProgressProviderProps) => {
    const [activeJobs, setActiveJobs] = useState<Map<string, ActiveJob>>(new Map());
    const [jobProgress, setJobProgress] = useState<Map<string, JobProgress>>(new Map());

    // Poll for progress updates for all active jobs
    useEffect(() => {
        if (activeJobs.size === 0) return;

        const pollProgress = async () => {
            const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
            
            for (const [jobId, job] of activeJobs.entries()) {
                try {
                    const endpoint = job.type === 'actionItems' 
                        ? `/api/action-items/progress/${jobId}`
                        : `/api/trailmap/progress/${jobId}`;
                    
                    const response = await fetch(`${apiUrl}${endpoint}`);
                    
                    if (!response.ok) continue;
                    
                    const progressData = await response.json();
                    
                    setJobProgress(prev => {
                        const newMap = new Map(prev);
                        newMap.set(jobId, progressData);
                        return newMap;
                    });

                    // If completed or failed, remove from active jobs after a delay
                    if (progressData.status === 'completed' || progressData.status === 'failed') {
                        setTimeout(() => {
                            setActiveJobs(prev => {
                                const newMap = new Map(prev);
                                newMap.delete(jobId);
                                return newMap;
                            });
                        }, 2000);
                    }
                } catch (error) {
                    console.error(`Error polling progress for job ${jobId}:`, error);
                }
            }
        };

        pollProgress();
        const interval = setInterval(pollProgress, 2000);

        return () => clearInterval(interval);
    }, [activeJobs]);

    const startJob = useCallback((jobId: string, type: 'actionItems' | 'trailmap') => {
        setActiveJobs(prev => {
            const newMap = new Map(prev);
            newMap.set(jobId, { jobId, type, startedAt: Date.now() });
            return newMap;
        });
    }, []);

    const clearJob = useCallback((jobId: string) => {
        setActiveJobs(prev => {
            const newMap = new Map(prev);
            newMap.delete(jobId);
            return newMap;
        });
        setJobProgress(prev => {
            const newMap = new Map(prev);
            newMap.delete(jobId);
            return newMap;
        });
    }, []);

    const getActiveJobByType = useCallback((type: 'actionItems' | 'trailmap'): ActiveJob | null => {
        for (const job of activeJobs.values()) {
            if (job.type === type) return job;
        }
        return null;
    }, [activeJobs]);

    const getProgressByType = useCallback((type: 'actionItems' | 'trailmap'): JobProgress | null => {
        for (const [jobId, job] of activeJobs.entries()) {
            if (job.type === type) {
                return jobProgress.get(jobId) || null;
            }
        }
        return null;
    }, [activeJobs, jobProgress]);

    return (
        <JobProgressContext.Provider value={{
            activeJobs,
            jobProgress,
            startJob,
            clearJob,
            getActiveJobByType,
            getProgressByType
        }}>
            {children}
        </JobProgressContext.Provider>
    );
};
