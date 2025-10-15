import axios from 'axios';
import crypto from 'crypto';

const SUMSUB_APP_TOKEN = process.env.SUMSUB_APP_TOKEN || '';
const SUMSUB_SECRET_KEY = process.env.SUMSUB_SECRET_KEY || '';
const SUMSUB_BASE_URL = process.env.SUMSUB_BASE_URL || 'https://api.sumsub.com';



export interface CreateApplicantParams {
  externalUserId: string;
  email: string;
  phone?: string;
  levelName?: string;
}

export interface ApplicantResponse {
  id: string;
  createdAt: string;
  externalUserId: string;
}

// Generate HMAC signature for Sumsub API requests
function generateSignature(method: string, url: string, timestamp: number, body?: string): string {
  const data = timestamp + method.toUpperCase() + url + (body || '');
  return crypto.createHmac('sha256', SUMSUB_SECRET_KEY).update(data).digest('hex');
}

// Create a new applicant in Sumsub
export async function createApplicant(params: CreateApplicantParams): Promise<ApplicantResponse> {
  const levelName = params.levelName || process.env.SUMSUB_LEVEL_NAME || 'basic-kyc-level';
  const url = `/resources/applicants?levelName=${encodeURIComponent(levelName)}`;
  const timestamp = Math.floor(Date.now() / 1000);
  const method = 'POST';
  const body = JSON.stringify({
    externalUserId: params.externalUserId,
    email: params.email,
  });

  const signature = generateSignature(method, url, timestamp, body);

  try {
    const response = await axios.post(
      `${SUMSUB_BASE_URL}${url}`,
      body,
      {
        headers: {
          'Content-Type': 'application/json',
          'X-App-Token': SUMSUB_APP_TOKEN,
          'X-App-Access-Ts': timestamp.toString(),
          'X-App-Access-Sig': signature,
        },
      }
    );

    return response.data;
    
  } catch (error: any) {
    console.error('Sumsub API error:', {
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      message: error.message
    });
    throw error;
  }
}

// Generate access token for applicant
export async function generateAccessToken(applicantId: string, externalUserId: string): Promise<string> {
  const url = `/resources/accessTokens?userId=${externalUserId}&ttlInSecs=600`;
  const timestamp = Math.floor(Date.now() / 1000);
  const method = 'POST';
  const body = JSON.stringify({ externalUserId });

  const signature = generateSignature(method, url, timestamp, body);

  const response = await axios.post(
    `${SUMSUB_BASE_URL}${url}`,
    body,
    {
      headers: {
        'Content-Type': 'application/json',
        'X-App-Token': SUMSUB_APP_TOKEN,
        'X-App-Access-Ts': timestamp.toString(),
        'X-App-Access-Sig': signature,
      },
    }
  );

  return response.data.token;
}

// Verify webhook signature
export function verifyWebhookSignature(payload: string, signature: string): boolean {
  const expectedSignature = crypto
    .createHmac('sha256', SUMSUB_SECRET_KEY)
    .update(payload)
    .digest('hex');
  
  return signature === expectedSignature;
}

// Get available verification levels
export async function getVerificationLevels(): Promise<any> {
  const url = '/resources/levels';
  const timestamp = Math.floor(Date.now() / 1000);
  const method = 'GET';

  const signature = generateSignature(method, url, timestamp);

  try {
    const response = await axios.get(
      `${SUMSUB_BASE_URL}${url}`,
      {
        headers: {
          'X-App-Token': SUMSUB_APP_TOKEN,
          'X-App-Access-Ts': timestamp.toString(),
          'X-App-Access-Sig': signature,
        },
      }
    );

    return response.data;
  } catch (error: any) {
    console.error('Error fetching verification levels:', error.response?.data || error.message);
    throw error;
  }
}

// Get applicant status
export async function getApplicantStatus(applicantId: string): Promise<any> {
  const url = `/resources/applicants/${applicantId}/status`;
  const timestamp = Math.floor(Date.now() / 1000);
  const method = 'GET';

  const signature = generateSignature(method, url, timestamp);

  const response = await axios.get(
    `${SUMSUB_BASE_URL}${url}`,
    {
      headers: {
        'X-App-Token': SUMSUB_APP_TOKEN,
        'X-App-Access-Ts': timestamp.toString(),
        'X-App-Access-Sig': signature,
      },
    }
  );

  return response.data;
}

