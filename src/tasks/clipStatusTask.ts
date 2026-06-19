/**
 * Background task that polls /clips/:jobId/status every ~30 seconds.
 *
 * Registration/unregistration is managed in _layout.tsx based on whether
 * any jobs are pending, satisfying the battery-efficiency requirement.
 *
 * Android note: expo-background-fetch maps to WorkManager on Android, so
 * the task runs even when the app is killed. iOS requires "Background App
 * Refresh" to be enabled by the user; the OS controls the exact interval.
 */
import * as BackgroundFetch from 'expo-background-fetch';
import * as TaskManager from 'expo-task-manager';

import { notifyJobDone, notifyJobFailed } from '@/services/notifications';
import { useJobStore } from '@/store/jobStore';

export const CLIP_STATUS_TASK = 'clip-status-poll';

// Must be defined in module scope (outside React components)
TaskManager.defineTask(CLIP_STATUS_TASK, async () => {
  try {
    const { jobs, updateJob, removeJob } = useJobStore.getState();
    const pending = Object.values(jobs).filter(
      (j) => j.status === 'pending' || j.status === 'processing'
    );

    if (pending.length === 0) return BackgroundFetch.BackgroundFetchResult.NoData;

    await Promise.all(
      pending.map(async (job) => {
        try {
          const res = await fetch(
            `${process.env.EXPO_PUBLIC_API_URL}/clips/${job.jobId}/status`
          );
          if (!res.ok) return;

          const data: { progress: number; status: string } = await res.json();
          const newStatus =
            data.status === 'done'
              ? 'done'
              : data.status === 'failed'
                ? 'failed'
                : 'processing';

          updateJob(job.jobId, { status: newStatus, progress: data.progress ?? 0 });

          if (newStatus === 'done') {
            await notifyJobDone(job.jobId);
            removeJob(job.jobId);
          } else if (newStatus === 'failed') {
            await notifyJobFailed(job.jobId);
            removeJob(job.jobId);
          }
        } catch {
          // individual job fetch failure — don't crash the task
        }
      })
    );

    return BackgroundFetch.BackgroundFetchResult.NewData;
  } catch {
    return BackgroundFetch.BackgroundFetchResult.Failed;
  }
});

export async function registerClipStatusTask() {
  const isRegistered = await TaskManager.isTaskRegisteredAsync(CLIP_STATUS_TASK);
  if (isRegistered) return;

  await BackgroundFetch.registerTaskAsync(CLIP_STATUS_TASK, {
    minimumInterval: 30, // seconds
    stopOnTerminate: false, // Android: keep running after app is killed
    startOnBoot: true,    // Android: restart after device reboot
  });
}

export async function unregisterClipStatusTask() {
  const isRegistered = await TaskManager.isTaskRegisteredAsync(CLIP_STATUS_TASK);
  if (isRegistered) {
    await BackgroundFetch.unregisterTaskAsync(CLIP_STATUS_TASK);
  }
}
