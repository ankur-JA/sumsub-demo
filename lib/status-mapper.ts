export interface ProgressStatus {
  progress: number;
  text: string;
  state: 'pending' | 'in-progress' | 'completed' | 'failed';
}

export function mapStatusToProgress(status: string, reviewStatus?: string): ProgressStatus {
  const statusLower = status.toLowerCase();
  const reviewLower = reviewStatus?.toLowerCase();

  // Map Sumsub statuses to progress
  switch (statusLower) {
    case 'created':
      return { progress: 5, text: 'Verification initiated', state: 'pending' };
    
    case 'started':
      return { progress: 15, text: 'Verification started', state: 'in-progress' };
    
    case 'pending':
      if (reviewLower === 'init') {
        return { progress: 40, text: 'Documents uploaded', state: 'in-progress' };
      }
      return { progress: 85, text: 'Under review', state: 'in-progress' };
    
    case 'queued':
      return { progress: 85, text: 'Queued for review', state: 'in-progress' };
    
    case 'completed':
      if (reviewLower === 'green' || reviewLower === 'completed') {
        return { progress: 100, text: 'Verification approved ✅', state: 'completed' };
      }
      if (reviewLower === 'red' || reviewLower === 'rejected') {
        return { progress: 100, text: 'Verification rejected', state: 'failed' };
      }
      if (reviewLower === 'onhold' || reviewLower === 'retry') {
        return { progress: 100, text: 'Additional information required', state: 'failed' };
      }
      return { progress: 95, text: 'Verification complete', state: 'in-progress' };
    
    default:
      return { progress: 10, text: `Status: ${status}`, state: 'in-progress' };
  }
}

// Determine detailed steps based on status
export function getDetailedSteps(status: string): string[] {
  const statusLower = status.toLowerCase();
  
  const allSteps = [
    'Verification initiated',
    'Documents uploaded',
    'Liveness check completed',
    'Verification submitted',
    'Under review',
    'Completed',
  ];

  switch (statusLower) {
    case 'created':
      return allSteps.slice(0, 1);
    case 'started':
      return allSteps.slice(0, 2);
    case 'pending':
      return allSteps.slice(0, 5);
    case 'completed':
      return allSteps;
    default:
      return allSteps.slice(0, 1);
  }
}

