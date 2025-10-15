import { NextRequest, NextResponse } from 'next/server';
import { verifyWebhookSignature } from '@/lib/sumsub';
import { db } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    console.log('🔔 Webhook received at:', new Date().toISOString());
    console.log('📋 Request headers:', Object.fromEntries(request.headers.entries()));
    
    const signature = request.headers.get('x-payload-digest');
    const body = await request.text();
    
    console.log('📝 Webhook body:', body);
    console.log('🔐 Signature header:', signature);
    console.log('🔐 All headers:', Object.fromEntries(request.headers.entries()));

    // Verify webhook signature
    if (signature && !verifyWebhookSignature(body, signature)) {
      console.error('❌ Invalid webhook signature');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    const event = JSON.parse(body);
    console.log('✅ Received Sumsub webhook:', JSON.stringify(event, null, 2));

    const { applicantId, type, reviewStatus, reviewResult } = event;

    if (!applicantId) {
      return NextResponse.json({ error: 'Missing applicantId' }, { status: 400 });
    }

    // Map webhook type to status based on Sumsub documentation
    let status = 'pending';
    let review = reviewStatus;

    switch (type) {
      case 'applicantCreated':
        status = 'created';
        review = 'init';
        break;
      case 'applicantPending':
        status = 'pending';
        review = 'pending';
        break;
      case 'applicantOnHold':
        status = 'completed';
        review = 'onHold';
        break;
      case 'applicantReviewed':
        status = 'completed';
        review = reviewResult?.reviewAnswer?.toLowerCase() || 'completed';
        break;
      case 'applicantActionOnHold':
        status = 'pending';
        review = 'onHold';
        break;
      default:
        console.log(`⚠️ Unknown webhook type: ${type}`);
        status = 'pending';
        review = reviewStatus;
    }

    // Update applicant status in database
    const updatedApplicant = db.updateApplicantStatus(applicantId, status, review);

    if (!updatedApplicant) {
      console.warn(`Applicant ${applicantId} not found in database`);
    } else {
      console.log(`Updated applicant ${applicantId}: ${status} / ${review}`);
    }

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error('Error processing webhook:', error);
    return NextResponse.json(
      { error: 'Failed to process webhook' },
      { status: 500 }
    );
  }
}

