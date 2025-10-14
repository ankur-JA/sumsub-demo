import { NextRequest, NextResponse } from 'next/server';
import { createApplicant } from '@/lib/sumsub';
import { db } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    // Check if applicant already exists
    const existing = db.getApplicantByEmail(email);
    if (existing) {
      return NextResponse.json({
        applicantId: existing.applicantId,
        message: 'Applicant already exists',
      });
    }

    // Generate external user ID
    const externalUserId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Create applicant in Sumsub
    console.log('Creating applicant with:', { externalUserId, email });
    const applicantResponse = await createApplicant({
      externalUserId,
      email,
    });
    console.log('Applicant created:', applicantResponse);

    // Store in database
    const applicant = db.createApplicant({
      applicantId: applicantResponse.id,
      externalUserId,
      email,
      status: 'created',
    });

    // Generate verification link
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const verificationLink = `${baseUrl}/verify?applicantId=${applicant.applicantId}`;

    // In production, send email here
    console.log(`Send verification link to ${email}: ${verificationLink}`);

    return NextResponse.json({
      applicantId: applicant.applicantId,
      verificationLink,
      message: 'Invite sent successfully',
    });
  } catch (error: any) {
    console.error('Error creating applicant:', error.response?.data || error.message);
    return NextResponse.json(
      { error: 'Failed to create applicant', details: error.response?.data || error.message },
      { status: 500 }
    );
  }
}

