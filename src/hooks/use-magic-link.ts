import { useState } from 'react';
import { api } from '@/lib/api';

type Status = 'idle' | 'sending' | 'sent' | 'error';

export function useMagicLink() {
  const [status, setStatus] = useState<Status>('idle');
  const [error, setError] = useState<string | null>(null);

  async function sendMagicLink(email: string) {
    setStatus('sending');
    setError(null);
    try {
      await api.post('/auth/magic-link', { email });
      setStatus('sent');
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to send magic link');
      setStatus('error');
    }
  }

  return { sendMagicLink, status, error };
}
