import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function optional(name: string, defaultValue: string): string {
  return process.env[name] ?? defaultValue;
}

export const env = {
  port: optional('PORT', '3000'),
  databaseUrl: required('DATABASE_URL'),
  anthropicApiKey: required('ANTHROPIC_API_KEY'),
  meta: {
    accessToken: optional('META_ACCESS_TOKEN', ''),
    adAccountId: optional('META_AD_ACCOUNT_ID', ''),
  },
  tiktok: {
    accessToken: optional('TIKTOK_ACCESS_TOKEN', ''),
    advertiserId: optional('TIKTOK_ADVERTISER_ID', ''),
  },
};
