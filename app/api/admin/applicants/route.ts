import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { mapStatusToProgress } from '@/lib/status-mapper';

export async function GET() {
  try {
    const applicants = db.getAllApplicants();
    
    // Add progress information to each applicant
    const applicantsWithProgress = applicants.map(applicant => {
      const progressStatus = mapStatusToProgress(applicant.status, applicant.reviewStatus);
      return {
        ...applicant,
        ...progressStatus,
      };
    });

    // Sort by most recent first
    applicantsWithProgress.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    return NextResponse.json(applicantsWithProgress);
  } catch (error: unknown) {
    console.error('Error fetching applicants:', error);
    return NextResponse.json(
      { error: 'Failed to fetch applicants' },
      { status: 500 }
    );
  }
}
