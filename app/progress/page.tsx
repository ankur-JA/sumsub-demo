"use client";

import { useState, useEffect, Suspense, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

interface StatusData {
  applicantId: string;
  email: string;
  status: string;
  reviewStatus?: string;
  progress: number;
  text: string;
  state: 'pending' | 'in-progress' | 'completed' | 'failed';
  updatedAt: string;
}

function ProgressContent() {
  const searchParams = useSearchParams();
  const applicantId = searchParams.get('applicantId');
  
  const [statusData, setStatusData] = useState<StatusData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStatus = useCallback(async () => {
    try {
      const response = await fetch(`/api/kyc/status/${applicantId}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch status');
      }

      const data = await response.json();
      setStatusData(data);
      setLoading(false);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      setLoading(false);
    }
  }, [applicantId]);

  useEffect(() => {
    if (!applicantId) {
      setError('No applicant ID provided');
      setLoading(false);
      return;
    }

    fetchStatus();
    
    // Poll for status updates every 3 seconds
    const interval = setInterval(fetchStatus, 3000);
    return () => clearInterval(interval);
  }, [applicantId, fetchStatus]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading status...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Error</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <Link 
            href="/"
            className="inline-block bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-6 rounded-lg transition-colors"
          >
            Go Back
          </Link>
        </div>
      </div>
    );
  }

  if (!statusData) {
    return null;
  }

  const isCompleted = statusData.state === 'completed';
  const isFailed = statusData.state === 'failed';
  const isApproved = statusData.reviewStatus === 'green' || statusData.reviewStatus === 'completed';

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-2xl w-full">
        <div className="text-center mb-8">
          <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 ${
            isApproved ? 'bg-green-500' : isFailed ? 'bg-red-500' : 'bg-indigo-600'
          }`}>
            {isApproved ? (
              <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            ) : isFailed ? (
              <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-10 h-10 text-white animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )}
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {isApproved ? 'Verification Approved!' : isFailed ? 'Action Required' : 'Verification in Progress'}
          </h1>
          <p className="text-gray-600">
            {statusData.email}
          </p>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-700">{statusData.text}</span>
            <span className="text-sm font-bold text-indigo-600">{statusData.progress}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
            <div 
              className={`h-full rounded-full transition-all duration-500 ${
                isApproved ? 'bg-green-500' : isFailed ? 'bg-red-500' : 'bg-gradient-to-r from-indigo-500 to-purple-500'
              }`}
              style={{ width: `${statusData.progress}%` }}
            />
          </div>
        </div>

        {/* Status Details */}
        <div className="bg-gray-50 rounded-lg p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Status Details</h2>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Current Status:</span>
              <span className="font-semibold text-gray-900 capitalize">{statusData.status}</span>
            </div>
            {statusData.reviewStatus && (
              <div className="flex justify-between">
                <span className="text-gray-600">Review Status:</span>
                <span className={`font-semibold capitalize ${
                  statusData.reviewStatus === 'green' || statusData.reviewStatus === 'completed' ? 'text-green-600' :
                  statusData.reviewStatus === 'red' || statusData.reviewStatus === 'rejected' ? 'text-red-600' :
                  'text-yellow-600'
                }`}>
                  {statusData.reviewStatus}
                </span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-gray-600">Last Updated:</span>
              <span className="font-semibold text-gray-900">
                {new Date(statusData.updatedAt).toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        {isApproved && (
          <div className="space-y-3">
            <button 
              className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
              onClick={() => alert('Proceeding to next step...')}
            >
              Continue to Next Step
            </button>
            <Link 
              href="/"
              className="block w-full text-center bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-3 px-6 rounded-lg transition-colors"
            >
              Return to Dashboard
            </Link>
          </div>
        )}

        {isFailed && (
          <div className="space-y-3">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
              <p className="text-red-800 text-sm">
                {statusData.reviewStatus === 'onHold' || statusData.reviewStatus === 'retry' 
                  ? 'Additional information is required. Please contact support or resubmit your verification.'
                  : 'Your verification was not approved. Please contact support for assistance.'}
              </p>
            </div>
            <a 
              href={`/verify?applicantId=${applicantId}`}
              className="block w-full text-center bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
            >
              Resubmit Verification
            </a>
            <Link 
              href="/"
              className="block w-full text-center bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-3 px-6 rounded-lg transition-colors"
            >
              Return to Dashboard
            </Link>
          </div>
        )}

        {!isCompleted && !isFailed && (
          <div className="text-center">
            <p className="text-gray-600 text-sm mb-4">
              🔄 This page updates automatically every 3 seconds
            </p>
            <Link 
              href="/"
              className="text-indigo-600 hover:text-indigo-800 text-sm font-medium"
            >
              ← Return to Dashboard
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ProgressPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    }>
      <ProgressContent />
    </Suspense>
  );
}

