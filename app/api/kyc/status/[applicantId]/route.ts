import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { mapStatusToProgress } from '@/lib/status-mapper';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ applicantId: string }> }
) {
  try {
    const { applicantId } = await params;

    const applicant = db.getApplicant(applicantId);
    if (!applicant) {
      return NextResponse.json({ error: 'Applicant not found' }, { status: 404 });
    }

    const progressStatus = mapStatusToProgress(applicant.status, applicant.reviewStatus);

    return NextResponse.json({
      applicantId: applicant.applicantId,
      email: applicant.email,
      status: applicant.status,
      reviewStatus: applicant.reviewStatus,
      ...progressStatus,
      updatedAt: applicant.updatedAt,
    });
  } catch (error: unknown) {
    console.error('Error fetching status:', error);
    return NextResponse.json(
      { error: 'Failed to fetch status' },
      { status: 500 }
    );
  }
}

