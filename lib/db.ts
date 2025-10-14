// Simple in-memory database (replace with real database in production)
export interface Applicant {
  applicantId: string;
  externalUserId: string;
  email: string;
  status: string;
  reviewStatus?: string;
  createdAt: string;
  updatedAt: string;
}

const applicants = new Map<string, Applicant>();

export const db = {
  // Create a new applicant
  createApplicant(data: Omit<Applicant, 'createdAt' | 'updatedAt'>): Applicant {
    const now = new Date().toISOString();
    const applicant: Applicant = {
      ...data,
      createdAt: now,
      updatedAt: now,
    };
    applicants.set(data.applicantId, applicant);
    return applicant;
  },

  // Update applicant status
  updateApplicantStatus(applicantId: string, status: string, reviewStatus?: string): Applicant | null {
    const applicant = applicants.get(applicantId);
    if (!applicant) return null;

    applicant.status = status;
    if (reviewStatus) {
      applicant.reviewStatus = reviewStatus;
    }
    applicant.updatedAt = new Date().toISOString();
    
    applicants.set(applicantId, applicant);
    return applicant;
  },

  // Get applicant by ID
  getApplicant(applicantId: string): Applicant | null {
    return applicants.get(applicantId) || null;
  },

  // Get applicant by email
  getApplicantByEmail(email: string): Applicant | null {
    for (const applicant of applicants.values()) {
      if (applicant.email === email) {
        return applicant;
      }
    }
    return null;
  },

  // Get all applicants
  getAllApplicants(): Applicant[] {
    return Array.from(applicants.values());
  },
};

