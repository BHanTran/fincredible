"use client";

import { useState, useEffect } from "react";
import { AlertCircle, Download, CreditCard, Calendar } from "lucide-react";
import { ReimbursementRecord } from "@/types/reimbursement";
import ReimbursementTableInfinite from "./reimbursement-table-infinite";

interface ReimbursementUploadProps {
  userId: string;
}

export default function ReimbursementUpload({ userId }: ReimbursementUploadProps) {
  const [csvData, setCsvData] = useState<ReimbursementRecord[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [loadingBrex, setLoadingBrex] = useState(false);
  const [hasMoreData, setHasMoreData] = useState(false);
  const [rawApiResponse, setRawApiResponse] = useState<any>(null);
  const [googleAccessToken, setGoogleAccessToken] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState(() => {
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Format dates for input type="date" (YYYY-MM-DD) using local timezone
    const formatDate = (date: Date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    return {
      purchased_at_start: formatDate(firstDayOfMonth),
      purchased_at_end: formatDate(now),
    };
  });


  const clearData = () => {
    setCsvData([]);
    setFileName(null);
    setError(null);
    setHasMoreData(false);
    (window as any).brexNextCursor = null;
    (window as any).brexHasMore = false;
  };

  const fetchFromBrex = async (cursor?: string, append: boolean = false) => {
    setLoadingBrex(true);
    if (!append) {
      setError(null);
    }

    try {
      const params = new URLSearchParams({
        purchased_at_start: dateRange.purchased_at_start,
        purchased_at_end: dateRange.purchased_at_end,
        limit: '20',
      });

      // Add expand parameters to get additional details
      params.append('expand[]', 'merchant');
      params.append('expand[]', 'location');
      params.append('expand[]', 'department');
      params.append('expand[]', 'receipts.download_uris');
      params.append('expand[]', 'user');
      params.append('expand[]', 'budget');
      params.append('expand[]', 'payment');

      if (cursor) {
        params.set('cursor', cursor);
      }

      const response = await fetch(`/api/brex/expenses?${params}`);
      const result = await response.json();

      // Store the raw API response for display
      setRawApiResponse(result);

      if (!result.success) {
        setError(result.error || "Failed to fetch data from Brex");
        return;
      }

      if (append) {
        setCsvData(prev => [...prev, ...(result.data || [])]);
      } else {
        setCsvData(result.data || []);
        setFileName(`Brex API Response (${dateRange.purchased_at_start} to ${dateRange.purchased_at_end})`);
      }

      // Store next cursor for pagination
      if (result.hasMore && result.nextCursor) {
        (window as any).brexNextCursor = result.nextCursor;
        (window as any).brexHasMore = true;
        setHasMoreData(true);
      } else {
        (window as any).brexNextCursor = null;
        (window as any).brexHasMore = false;
        setHasMoreData(false);
      }
    } catch (error) {
      console.error("Error fetching from Brex:", error);
      setError("An error occurred while fetching data from Brex");
    } finally {
      setLoadingBrex(false);
    }
  };

  const loadMoreExpenses = () => {
    const nextCursor = (window as any).brexNextCursor;
    const hasMore = (window as any).brexHasMore;

    if (nextCursor && hasMore && !loadingBrex) {
      fetchFromBrex(nextCursor, true);
    }
  };

  // Check for Google access token on component mount and URL params
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Check for access token in sessionStorage
      const storedToken = sessionStorage.getItem('googleAccessToken');
      if (storedToken) {
        setGoogleAccessToken(storedToken);
      }

      // Check URL params for auth success/error
      const urlParams = new URLSearchParams(window.location.search);
      const authSuccess = urlParams.get('google_auth');
      const authError = urlParams.get('error');

      if (authSuccess === 'success') {
        // Clear the URL params
        window.history.replaceState({}, document.title, window.location.pathname);
      } else if (authError) {
        setError(`Google authentication failed: ${authError}`);
        // Clear the URL params
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    }
  }, []);

  const authenticateWithGoogle = async () => {
    try {
      // Get the authorization URL from our server
      const response = await fetch('/api/auth/google');
      const data = await response.json();

      if (!data.authUrl) {
        setError(data.error || 'Failed to get authorization URL');
        return;
      }

      // Redirect to Google OAuth
      window.location.href = data.authUrl;
    } catch (error) {
      console.error('Error initiating Google authentication:', error);
      setError('Failed to start Google Calendar authentication');
    }
  };


  return (
    <div className="space-y-6 w-full">
      {/* Brex Integration Section */}
      <div className="bg-white/80 rounded-xl border border-rose-200/60 shadow-lg p-6">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center">
            <CreditCard className="h-6 w-6 text-rose-600 mr-3" />
            <div>
              <h3 className="text-lg font-medium text-rose-900">Fetch from Brex</h3>
              <p className="text-sm text-rose-600">Import expenses directly from your Brex account</p>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-end space-y-4 sm:space-y-0 sm:space-x-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Date Range
            </label>
            <div className="flex space-x-2">
              <input
                type="date"
                value={dateRange.purchased_at_start}
                onChange={(e) => setDateRange(prev => ({ ...prev, purchased_at_start: e.target.value }))}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-rose-500 focus:border-rose-500"
                disabled={loadingBrex}
              />
              <input
                type="date"
                value={dateRange.purchased_at_end}
                onChange={(e) => setDateRange(prev => ({ ...prev, purchased_at_end: e.target.value }))}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-rose-500 focus:border-rose-500"
                disabled={loadingBrex}
              />
            </div>
          </div>
          <button
            onClick={() => fetchFromBrex()}
            disabled={loadingBrex}
            className="px-6 py-2 bg-rose-600 text-white rounded-md hover:bg-rose-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
          >
            {loadingBrex ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Fetching...
              </>
            ) : (
              <>
                <Download className="h-4 w-4 mr-2" />
                Fetch Expenses
              </>
            )}
          </button>
        </div>
      </div>

      {/* Google Calendar Integration Section */}
      {csvData.length > 0 && (
        <div className="bg-white/80 rounded-xl border border-blue-200/60 shadow-lg p-6">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center">
              <Calendar className="h-6 w-6 text-blue-600 mr-3" />
              <div>
                <h3 className="text-lg font-medium text-blue-900">Google Calendar Integration</h3>
                <p className="text-sm text-blue-600">
                  Connect to Google Calendar to enable per-expense matching
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-4">
            <div className="flex-1">
              {googleAccessToken ? (
                <div className="flex items-center text-green-600 text-sm">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                  Connected to Google Calendar
                </div>
              ) : (
                <div className="flex items-center text-gray-500 text-sm">
                  <div className="w-2 h-2 bg-gray-400 rounded-full mr-2"></div>
                  Not connected to Google Calendar
                </div>
              )}
            </div>

            {!googleAccessToken && (
              <div className="flex space-x-3">
                <button
                  onClick={authenticateWithGoogle}
                  className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                >
                  <Calendar className="h-4 w-4 mr-2" />
                  Connect Google Calendar
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Data Table Section */}
      {csvData.length > 0 && (
        <ReimbursementTableInfinite
          data={csvData}
          onLoadMore={loadMoreExpenses}
          hasMore={hasMoreData}
          loading={loadingBrex}
          googleAccessToken={googleAccessToken}
          onDataUpdate={setCsvData}
        />
      )}
    </div>
  );
}