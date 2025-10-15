"use client";

import { useState, useEffect } from "react";

interface Applicant {
  applicantId: string;
  externalUserId: string;
  email: string;
  status: string;
  reviewStatus?: string;
  createdAt: string;
  updatedAt: string;
}

interface ApplicantWithProgress extends Applicant {
  progress: number;
  text: string;
  state: 'pending' | 'in-progress' | 'completed' | 'failed';
}

export default function AdminDashboard() {
  const [applicants, setApplicants] = useState<ApplicantWithProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Send invite form state
  const [email, setEmail] = useState("");
  const [sendingInvite, setSendingInvite] = useState(false);
  const [inviteResult, setInviteResult] = useState<{
    success: boolean;
    message: string;
    verificationLink?: string;
  } | null>(null);

  useEffect(() => {
    fetchApplicants();
    
    // Poll for updates every 5 seconds
    const interval = setInterval(fetchApplicants, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchApplicants = async () => {
    try {
      const response = await fetch('/api/admin/applicants');
      
      if (!response.ok) {
        throw new Error('Failed to fetch applicants');
      }

      const data = await response.json();
      setApplicants(data);
      setLoading(false);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      setLoading(false);
    }
  };

  const handleSendInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setSendingInvite(true);
    setInviteResult(null);

    try {
      const response = await fetch('/api/kyc/invite', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        setInviteResult({
          success: true,
          message: data.message,
          verificationLink: data.verificationLink,
        });
        setEmail("");
        // Refresh the applicants list to show the new applicant
        fetchApplicants();
      } else {
        setInviteResult({
          success: false,
          message: data.error || 'Failed to send invite',
        });
      }
    } catch {
      setInviteResult({
        success: false,
        message: 'Network error. Please try again.',
      });
    } finally {
      setSendingInvite(false);
    }
  };

  const getStatusColor = (state: string) => {
    switch (state) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'failed': return 'bg-red-100 text-red-800';
      case 'in-progress': return 'bg-blue-100 text-blue-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getReviewStatusColor = (reviewStatus?: string) => {
    if (!reviewStatus) return 'bg-gray-100 text-gray-800';
    
    switch (reviewStatus.toLowerCase()) {
      case 'green':
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'red':
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'onhold':
      case 'retry':
        return 'bg-yellow-100 text-yellow-800';
      case 'init':
      case 'queued':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading applicants...</p>
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
          <button 
            onClick={fetchApplicants}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-6 rounded-lg transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">KYC Admin Dashboard</h1>
              <p className="text-gray-600 mt-2">Monitor KYC verification progress</p>
            </div>
            <div className="flex space-x-4">
              <button 
                onClick={fetchApplicants}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
              >
                Refresh
              </button>
            </div>
          </div>
        </div>

        {/* Send Invite Form */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Send KYC Invite</h2>
          <form onSubmit={handleSendInvite} className="flex gap-4 items-end">
            <div className="flex-1">
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                User Email Address
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="user@example.com"
              />
            </div>
            <button
              type="submit"
              disabled={sendingInvite}
              className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-semibold py-2 px-6 rounded-lg transition-colors"
            >
              {sendingInvite ? 'Sending...' : 'Send Invite'}
            </button>
          </form>
          
          {/* Invite Result */}
          {inviteResult && (
            <div className={`mt-4 p-4 rounded-lg ${
              inviteResult.success 
                ? 'bg-green-50 border border-green-200' 
                : 'bg-red-50 border border-red-200'
            }`}>
              <div className="flex items-start">
                <div className={`flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center ${
                  inviteResult.success ? 'bg-green-500' : 'bg-red-500'
                }`}>
                  {inviteResult.success ? (
                    <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  )}
                </div>
                <div className="ml-3">
                  <p className={`text-sm font-medium ${
                    inviteResult.success ? 'text-green-800' : 'text-red-800'
                  }`}>
                    {inviteResult.message}
                  </p>
                  {inviteResult.verificationLink && (
                    <div className="mt-2">
                      <p className="text-xs text-green-700 mb-1">Verification Link:</p>
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={inviteResult.verificationLink}
                          readOnly
                          className="flex-1 text-xs px-2 py-1 bg-white border border-green-300 rounded text-green-800"
                        />
                        <button
                          onClick={() => navigator.clipboard.writeText(inviteResult.verificationLink!)}
                          className="text-xs bg-green-600 hover:bg-green-700 text-white px-2 py-1 rounded"
                        >
                          Copy
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Applicants</p>
                <p className="text-2xl font-bold text-gray-900">{applicants.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Approved</p>
                <p className="text-2xl font-bold text-gray-900">
                  {applicants.filter(a => a.state === 'completed').length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">In Progress</p>
                <p className="text-2xl font-bold text-gray-900">
                  {applicants.filter(a => a.state === 'in-progress' || a.state === 'pending').length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-red-100 rounded-lg">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Failed</p>
                <p className="text-2xl font-bold text-gray-900">
                  {applicants.filter(a => a.state === 'failed').length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Applicants Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">All Applicants</h2>
            <p className="text-sm text-gray-600">Real-time status updates (refreshes every 5 seconds)</p>
          </div>

          {applicants.length === 0 ? (
            <div className="text-center py-12">
              <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No applicants yet</h3>
              <p className="text-gray-600 mb-4">Start by sending KYC invites using the form above</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Applicant
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Progress
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Review Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Created
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {applicants.map((applicant) => (
                    <tr key={applicant.applicantId} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{applicant.email}</div>
                          <div className="text-sm text-gray-500">ID: {applicant.applicantId.substring(0, 12)}...</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(applicant.state)}`}>
                          {applicant.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                            <div 
                              className={`h-2 rounded-full ${
                                applicant.state === 'completed' ? 'bg-green-500' : 
                                applicant.state === 'failed' ? 'bg-red-500' : 
                                'bg-indigo-500'
                              }`}
                              style={{ width: `${applicant.progress}%` }}
                            />
                          </div>
                          <span className="text-sm text-gray-600">{applicant.progress}%</span>
                        </div>
                        <div className="text-xs text-gray-500 mt-1">{applicant.text}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {applicant.reviewStatus ? (
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getReviewStatusColor(applicant.reviewStatus)}`}>
                            {applicant.reviewStatus}
                          </span>
                        ) : (
                          <span className="text-sm text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(applicant.createdAt).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <a 
                            href={`/progress?applicantId=${applicant.applicantId}`}
                            target="_blank"
                            className="text-indigo-600 hover:text-indigo-900"
                          >
                            View Progress
                          </a>
                          <a 
                            href={`/verify?applicantId=${applicant.applicantId}`}
                            target="_blank"
                            className="text-green-600 hover:text-green-900"
                          >
                            Verify
                          </a>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}