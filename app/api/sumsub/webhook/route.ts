import { NextRequest, NextResponse } from 'next/server';
import { verifyWebhookSignature } from '@/lib/sumsub';
import { db } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const signature = request.headers.get('x-payload-digest');
    const body = await request.text();

    // Verify webhook signature
    if (signature && !verifyWebhookSignature(body, signature)) {
      console.error('Invalid webhook signature');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    const event = JSON.parse(body);
    console.log('Received Sumsub webhook:', event);

    const { applicantId, reviewStatus, type } = event;

    if (!applicantId) {
      return NextResponse.json({ error: 'Missing applicantId' }, { status: 400 });
    }

    // Map webhook type to status
    let status = 'pending';
    let review = reviewStatus?.reviewAnswer;

    switch (type) {
      case 'applicantCreated':
        status = 'created';
        break;
      case 'applicantPending':
        status = 'pending';
        break;
      case 'applicantOnHold':
        status = 'completed';
        review = 'onHold';
        break;
      case 'applicantApproved':
        status = 'completed';
        review = 'green';
        break;
      case 'applicantRejected':
        status = 'completed';
        review = 'red';
        break;
      default:
        status = type.replace('applicant', '').toLowerCase();
    }

    // Update applicant status in database
    const updatedApplicant = db.updateApplicantStatus(applicantId, status, review);

    if (!updatedApplicant) {
      console.warn(`Applicant ${applicantId} not found in database`);
    } else {
      console.log(`Updated applicant ${applicantId}: ${status} / ${review}`);
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error processing webhook:', error);
    return NextResponse.json(
      { error: 'Failed to process webhook' },
      { status: 500 }
    );
  }
}

