const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000';

export type PayoutMethod = 'bank' | 'paypal' | 'btc' | 'stellar';

export interface PayoutRequest {
  amount: number;
  method: PayoutMethod;
  walletId?: string;
}

export interface PayoutResponse {
  id: string;
  amount: number;
  method: PayoutMethod;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  fee: number;
  estimatedArrival: string;
  createdAt: string;
  reference: string;
}

export interface PayoutHistoryItem {
  id: string;
  amount: number;
  method: PayoutMethod;
  status: PayoutResponse['status'];
  fee: number;
  createdAt: string;
  reference: string;
}

export interface EarningsData {
  available: number;
  totalEarned: number;
  payouts: PayoutHistoryItem[];
}

/** Platform fee rates per method */
export const FEE_RATES: Record<PayoutMethod, number> = {
  bank: 0.02,
  paypal: 0.025,
  btc: 0.01,
  stellar: 0.005,
};

export const MIN_PAYOUT = 5;

export function calcFee(amount: number, method: PayoutMethod): number {
  return parseFloat((amount * FEE_RATES[method]).toFixed(2));
}

let authToken: string | null = null;
export function setAuthToken(token: string) {
  authToken = token;
}

function headers() {
  return {
    'Content-Type': 'application/json',
    ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
  };
}

export async function requestPayout(body: PayoutRequest): Promise<PayoutResponse> {
  const res = await fetch(`${BASE_URL}/payouts`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({ amount: body.amount, method: body.method, walletId: body.walletId }),
  });

  const json = await res.json();

  if (!res.ok) {
    throw new Error(json?.message ?? 'Payout request failed');
  }

  return json as PayoutResponse;
}

export async function getEarnings(): Promise<EarningsData> {
  const res = await fetch(`${BASE_URL}/earnings`, { headers: headers() });

  if (!res.ok) {
    // Return mock data so the UI is usable without a live backend
    return MOCK_EARNINGS;
  }

  return res.json() as Promise<EarningsData>;
}

const MOCK_EARNINGS: EarningsData = {
  available: 128.5,
  totalEarned: 342.0,
  payouts: [
    {
      id: '1',
      amount: 50,
      method: 'paypal',
      status: 'completed',
      fee: 1.25,
      createdAt: '2026-06-10T10:00:00Z',
      reference: 'PAY-001',
    },
    {
      id: '2',
      amount: 100,
      method: 'bank',
      status: 'processing',
      fee: 2.0,
      createdAt: '2026-06-14T08:30:00Z',
      reference: 'PAY-002',
    },
    {
      id: '3',
      amount: 63.5,
      method: 'stellar',
      status: 'completed',
      fee: 0.32,
      createdAt: '2026-06-15T15:45:00Z',
      reference: 'PAY-003',
    },
  ],
};
