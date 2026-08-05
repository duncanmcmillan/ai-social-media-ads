import { env } from '../../config/env';

const GRAPH_API_BASE = 'https://graph.facebook.com/v21.0';

export class MetaApiError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number,
    public readonly body: unknown
  ) {
    super(message);
    this.name = 'MetaApiError';
  }
}

export async function metaPost<T>(
  path: string,
  body: Record<string, unknown>
): Promise<T> {
  const url = `${GRAPH_API_BASE}${path}`;
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      ...body,
      access_token: env.meta.accessToken,
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new MetaApiError(
      `Meta API error: ${response.status} ${response.statusText}`,
      response.status,
      data
    );
  }

  return data as T;
}
