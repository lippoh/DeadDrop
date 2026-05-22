export const API_BASE = 'https://deaddrop-qon2.onrender.com';

export interface CreateDropRequest {
  ciphertext: string;
  iv: string;
  salt: string;
  password: string;
  expiresIn?: number;
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