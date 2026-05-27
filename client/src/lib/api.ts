export const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://deaddrop-qon2.onrender.com';

// ── Types ──

export interface CreateDropRequest {
  ciphertext: string;
  iv: string;
  salt: string;
  hasPassword: boolean;
  password: string;
  expiryHours?: number;
}

export interface CreateDropResponse {
  token: string;
  expiresAt: string;
  url?: string;
}

export interface GetDropResponse {
  hasPassword: boolean;
  createdAt: string;
  expiresAt: string;
}

// ── Error handling ──

class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const body = await response.text();
    let message = `API Error ${response.status}`;
    try {
      const json = JSON.parse(body);
      message = json.error || json.message || message;
    } catch {
      if (response.status === 404) message = 'Drop not found.';
      else if (response.status === 410) message = 'This drop has already been burned.';
    }
    throw new ApiError(message, response.status);
  }
  return response.json();
}

// ── Generic API fetch utility ──

export async function apiFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE}${path}`;

  const response = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  return handleResponse<T>(response);
}

// ── Dead Drop API ──

export async function createDrop(data: CreateDropRequest): Promise<CreateDropResponse> {
  const response = await fetch(`${API_BASE}/api/drops`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return handleResponse<CreateDropResponse>(response);
}

export async function getDrop(token: string): Promise<GetDropResponse> {
  const response = await fetch(`${API_BASE}/api/drops/${token}`, {
    method: 'GET',
  });
  return handleResponse<GetDropResponse>(response);
}

export async function readAndBurnDrop(token: string, password: string): Promise<{ ciphertext: string; iv: string; salt: string }> {
  const response = await fetch(`${API_BASE}/api/drops/${token}/read`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password }),
  });
  return handleResponse<{ ciphertext: string; iv: string; salt: string }>(response);
}