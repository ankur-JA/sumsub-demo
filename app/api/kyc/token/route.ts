import { NextRequest, NextResponse } from 'next/server';
import { generateAccessToken } from '@/lib/sumsub';
import { db } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const { applicantId } = await request.json();
    

    if (!applicantId) {
      return NextResponse.json({ error: 'Applicant ID is required' }, { status: 400 });
    }

    // Get applicant from database
    
    const applicant = db.getApplicant(applicantId);
    
    if (!applicant) {
      return NextResponse.json({ error: 'Applicant not found' }, { status: 404 });
    }

    // Generate short-lived access token
    const accessToken = await generateAccessToken(applicantId);
    

    // Update status to started if it's still created
    if (applicant.status === 'created') {
      db.updateApplicantStatus(applicantId, 'started');
    }

    return NextResponse.json({ accessToken });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorDetails = (error as { response?: { data?: unknown } })?.response?.data || errorMessage;
    return NextResponse.json(
      { error: 'Failed to generate access token', details: errorDetails },
      { status: 500 }
    );
  }
}

