"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import snsWebSdk from '@sumsub/websdk';

function VerifyContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const applicantId = searchParams.get('applicantId');
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const sdkInstanceRef = useRef<any>(null);

  useEffect(() => {
    if (!applicantId) {
      setError('No applicant ID provided');
      setLoading(false);
      return;
    }

    fetchAccessToken();
  }, [applicantId]);

  const fetchAccessToken = async () => {
    try {
      const response = await fetch('/api/kyc/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ applicantId }),
      });

      if (!response.ok) {
        throw new Error('Failed to get access token');
      }

      const data = await response.json();
      setAccessToken(data.accessToken);
      setLoading(false);
      
      // Initialize SDK after getting token
      setTimeout(() => initializeSDK(data.accessToken), 100);
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  const initializeSDK = (token: string) => {
    if (!containerRef.current) return;

    try {
      const snsWebSdkInstance = snsWebSdk
        .init(token, () => fetchAccessToken().then(() => token))
        .withConf({
          lang: "en",
          theme: "light",
        })
        .withOptions({ 
          addViewportTag: false, 
          adaptIframeHeight: true 
        })
        .on("idCheck.onReady", () => {
          console.log("SDK ready");
        })
        .on("idCheck.onApplicantSubmitted", () => {
          console.log("Verification submitted");
          // Redirect to progress page
          router.push(`/progress?applicantId=${applicantId}`);
        })
        .on("idCheck.onError", (error: any) => {
          console.error("Sumsub error:", error);
          setError("An error occurred during verification");
        })
        .build();

      sdkInstanceRef.current = snsWebSdkInstance;
      snsWebSdkInstance.launch(containerRef.current);
    } catch (err: any) {
      console.error("SDK initialization error:", err);
      setError("Failed to initialize verification");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading verification...</p>
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
          <a 
            href="/"
            className="inline-block bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-6 rounded-lg transition-colors"
          >
            Go Back
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6 mb-4">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Identity Verification
          </h1>
          <p className="text-gray-600">
            Please complete the verification process below
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6">
          <div 
            ref={containerRef}
            className="w-full min-h-[600px]"
          />
        </div>
      </div>
    </div>
  );
}

export default function VerifyPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    }>
      <VerifyContent />
    </Suspense>
  );
}

