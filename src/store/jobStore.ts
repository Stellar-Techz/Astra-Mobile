import { create } from 'zustand';

export type JobStatus = 'pending' | 'processing' | 'done' | 'failed';

export interface Job {
  jobId: string;
  status: JobStatus;
  progress: number; // 0–100
}

interface JobStore {
  jobs: Record<string, Job>;
  addJob: (jobId: string) => void;
  updateJob: (jobId: string, patch: Partial<Omit<Job, 'jobId'>>) => void;
  removeJob: (jobId: string) => void;
  pendingJobs: () => Job[];
}

export const useJobStore = create<JobStore>((set, get) => ({
  jobs: {},

  addJob: (jobId) =>
    set((s) => ({
      jobs: { ...s.jobs, [jobId]: { jobId, status: 'pending', progress: 0 } },
    })),

  updateJob: (jobId, patch) =>
    set((s) => ({
      jobs: {
        ...s.jobs,
        [jobId]: { ...s.jobs[jobId], ...patch },
      },
    })),

  removeJob: (jobId) =>
    set((s) => {
      const { [jobId]: _, ...rest } = s.jobs;
      return { jobs: rest };
    }),

  pendingJobs: () =>
    Object.values(get().jobs).filter(
      (j) => j.status === 'pending' || j.status === 'processing'
    ),
}));
