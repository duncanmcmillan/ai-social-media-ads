import { env } from '../../config/env';

const TIKTOK_API_BASE = 'https://business-api.tiktok.com/open_api/v1.3';

export class TikTokApiError extends Error {
  constructor(
    message: string,
    public readonly code: number,
    public readonly body: unknown
  ) {
    super(message);
    this.name = 'TikTokApiError';
  }
}

interface TikTokResponse<T> {
  code: number;
  message: string;
  data: T;
}

export async function tiktokPost<T>(
  path: string,
  body: Record<string, unknown>
): Promise<T> {
  const url = `${TIKTOK_API_BASE}${path}`;
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Access-Token': env.tiktok.accessToken,
    },
    body: JSON.stringify(body),
  });

  const data = (await response.json()) as TikTokResponse<T>;

  if (data.code !== 0) {
    throw new TikTokApiError(
      `TikTok API error: ${data.message}`,
      data.code,
      data
    );
  }

  return data.data;
}
