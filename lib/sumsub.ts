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

    console.log('✅ Sumsub API Success:', response.data);
    return response.data;
    
  } catch (error: unknown) {
    const errorDetails = error as { response?: { status?: number; statusText?: string; data?: unknown }; message?: string };
    console.error('Sumsub API error:', {
      status: errorDetails.response?.status,
      statusText: errorDetails.response?.statusText,
      data: errorDetails.response?.data,
      message: errorDetails.message
    });
    throw error;
  }
}

// Generate access token for applicant
export async function generateAccessToken(applicantId: string): Promise<string> {
  const levelName = process.env.SUMSUB_LEVEL_NAME || 'id-and-liveness';
  const url = `/resources/accessTokens/sdk`;
  const timestamp = Math.floor(Date.now() / 1000);
  const method = 'POST';
  const body = JSON.stringify({
    ttlInSecs: 600,
    userId: applicantId,
    levelName: levelName
  });

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
  if (!signature) {
    console.log('⚠️ No signature provided');
    return false;
  }

  const expectedSignature = crypto
    .createHmac('sha256', SUMSUB_SECRET_KEY)
    .update(payload)
    .digest('hex');
  
  // Sumsub sends signature in format: sha256=<hash>
  // Remove the 'sha256=' prefix if present
  const cleanSignature = signature.replace(/^sha256=/, '');
  
  console.log('🔐 Signature verification:', {
    received: cleanSignature,
    expected: expectedSignature,
    match: cleanSignature === expectedSignature
  });
  
  return cleanSignature === expectedSignature;
}

// Get available verification levels
export async function getVerificationLevels(): Promise<unknown> {
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
  } catch (error: unknown) {
    const errorDetails = error as { response?: { data?: unknown }; message?: string };
    console.error('Error fetching verification levels:', errorDetails.response?.data || errorDetails.message);
    throw error;
  }
}

// Get applicant status
export async function getApplicantStatus(applicantId: string): Promise<unknown> {
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

