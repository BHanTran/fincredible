"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { ReimbursementRecord } from "@/types/reimbursement";
import { formatCurrency, formatDate } from "@/lib/utils";
import { ChevronDown, ChevronUp, Search, Filter, Loader2, Calendar, CheckCircle, AlertCircle, XCircle, X } from "lucide-react";

interface ReimbursementTableInfiniteProps {
  data: ReimbursementRecord[];
  onLoadMore?: () => void;
  hasMore: boolean;
  loading: boolean;
  googleAccessToken?: string | null;
  onDataUpdate?: (data: ReimbursementRecord[]) => void;
}

export default function ReimbursementTableInfinite({
  data,
  onLoadMore,
  hasMore,
  loading,
  googleAccessToken,
  onDataUpdate
}: ReimbursementTableInfiniteProps) {
  const [sortField, setSortField] = useState<keyof ReimbursementRecord>('date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [searchTerm, setSearchTerm] = useState('');
  const [teamFilter, setTeamFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [matchingExpenses, setMatchingExpenses] = useState<Set<string>>(new Set());
  const loadMoreRef = useRef<HTMLDivElement>(null);

  // Column width management
  const [columnWidths, setColumnWidths] = useState<Record<string, number>>({
    department_name: 180,
    memo: 300,
    calendar_event: 350
  });
  const [isResizing, setIsResizing] = useState<string | null>(null);
  const [resizeStartX, setResizeStartX] = useState(0);
  const [resizeStartWidth, setResizeStartWidth] = useState(0);

  // Get unique values for filters
  const uniqueDepartments = [...new Set(data.map((record: any) => record.department_name))].sort();
  const uniqueLocations = [...new Set(data.map((record: any) => record.location_name))].sort();

  // Filter and sort data
  const filteredData = data.filter((record: any) => {
    const matchesSearch = searchTerm === '' ||
      Object.values(record).some(value =>
        value?.toString().toLowerCase().includes(searchTerm.toLowerCase())
      );
    const matchesDepartment = teamFilter === '' || record.department_name === teamFilter;
    const matchesLocation = categoryFilter === '' || record.location_name === categoryFilter;

    return matchesSearch && matchesDepartment && matchesLocation;
  });

  const sortedData = [...filteredData].sort((a, b) => {
    let aValue = a[sortField];
    let bValue = b[sortField];

    // Special handling for different data types
    if (sortField === 'usd_amount') {
      aValue = Number(aValue);
      bValue = Number(bValue);
    } else if (sortField === 'purchased_at' || sortField === 'date') {
      aValue = new Date(aValue as string).getTime();
      bValue = new Date(bValue as string).getTime();
    } else if (sortField === 'calendar_match_confidence') {
      const confidenceOrder = { 'high': 3, 'medium': 2, 'low': 1, '': 0, null: 0, undefined: 0 };
      aValue = confidenceOrder[aValue as keyof typeof confidenceOrder] || 0;
      bValue = confidenceOrder[bValue as keyof typeof confidenceOrder] || 0;
    } else if (sortField === 'calendar_event') {
      aValue = a.calendar_event?.summary || '';
      bValue = b.calendar_event?.summary || '';
      aValue = aValue.toString().toLowerCase();
      bValue = bValue.toString().toLowerCase();
    } else {
      aValue = (aValue || '').toString().toLowerCase();
      bValue = (bValue || '').toString().toLowerCase();
    }

    if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  const handleSort = (field: keyof ReimbursementRecord) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const totalAmount = filteredData.reduce((sum, record: any) => sum + record.usd_amount, 0);

  // Column resize handlers
  const startResize = (columnKey: string, e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(columnKey);
    setResizeStartX(e.clientX);
    setResizeStartWidth(columnWidths[columnKey]);
  };

  const handleResize = useCallback((e: MouseEvent) => {
    if (!isResizing) return;

    const deltaX = e.clientX - resizeStartX;
    const newWidth = Math.max(80, Math.min(800, resizeStartWidth + deltaX)); // Min 80px, Max 800px

    setColumnWidths(prev => ({
      ...prev,
      [isResizing]: newWidth
    }));
  }, [isResizing, resizeStartX, resizeStartWidth]);

  const stopResize = useCallback(() => {
    setIsResizing(null);
  }, []);

  useEffect(() => {
    if (isResizing) {
      document.addEventListener('mousemove', handleResize);
      document.addEventListener('mouseup', stopResize);
      return () => {
        document.removeEventListener('mousemove', handleResize);
        document.removeEventListener('mouseup', stopResize);
      };
    }
  }, [isResizing, handleResize, stopResize]);

  const matchSingleExpense = async (expense: any) => {
    if (!googleAccessToken || !onDataUpdate) {
      console.error('Google Calendar not connected or no update function provided');
      return;
    }

    const expenseId = expense.id || expense.purchased_at + expense.usd_amount;
    setMatchingExpenses(prev => new Set(prev).add(expenseId));

    try {
      const response = await fetch('/api/calendar/match-single', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          expense,
          accessToken: googleAccessToken,
        }),
      });

      const result = await response.json();

      if (result.success) {
        // Update the expense in the data array
        const updatedData = data.map(item => {
          if ((item.id || item.purchased_at + item.usd_amount) === expenseId) {
            return result.data;
          }
          return item;
        });
        onDataUpdate(updatedData);
      } else {
        console.error('Failed to match expense:', result.error);
      }
    } catch (error) {
      console.error('Error matching expense with calendar:', error);
    } finally {
      setMatchingExpenses(prev => {
        const newSet = new Set(prev);
        newSet.delete(expenseId);
        return newSet;
      });
    }
  };

  const unmatchExpense = (expense: any) => {
    if (!onDataUpdate) {
      console.error('No update function provided');
      return;
    }

    const expenseId = expense.id || expense.purchased_at + expense.usd_amount;

    // Update the expense to remove calendar match data
    const updatedData = data.map(item => {
      if ((item.id || item.purchased_at + item.usd_amount) === expenseId) {
        return {
          ...item,
          calendar_event: null,
          calendar_match_confidence: null,
          calendar_match_reasoning: null
        };
      }
      return item;
    });

    onDataUpdate(updatedData);
  };

  // Intersection Observer for infinite scroll
  const observerRef = useCallback((node: HTMLDivElement | null) => {
    if (loading) return;
    if (loadMoreRef.current) loadMoreRef.current = null;

    if (node) {
      loadMoreRef.current = node;
      const observer = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && hasMore && onLoadMore && !loading) {
          onLoadMore();
        }
      }, {
        threshold: 0.1,
        rootMargin: '100px',
      });

      observer.observe(node);

      return () => {
        observer.disconnect();
      };
    }
  }, [loading, hasMore, onLoadMore]);

  const SortIcon = ({ field }: { field: keyof ReimbursementRecord }) => {
    if (sortField !== field) return null;
    return sortDirection === 'asc' ?
      <ChevronUp className="h-4 w-4" /> :
      <ChevronDown className="h-4 w-4" />;
  };

  const ConfidenceIcon = ({ confidence }: { confidence?: 'high' | 'medium' | 'low' }) => {
    if (!confidence) return <XCircle className="h-4 w-4 text-gray-400" />;

    switch (confidence) {
      case 'high':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'medium':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      case 'low':
        return <AlertCircle className="h-4 w-4 text-orange-500" />;
      default:
        return <XCircle className="h-4 w-4 text-gray-400" />;
    }
  };

  const formatCalendarEvent = (event: any) => {
    if (!event) return 'No match';

    const startTime = event.start?.dateTime
      ? new Date(event.start.dateTime).toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit'
        })
      : 'All day';

    return `${event.summary} (${startTime})`;
  };

  return (
    <div className="bg-white/80 rounded-xl border border-rose-200/60 shadow-lg p-6 w-full">
      <style jsx>{`
        .scrollable-table {
          scrollbar-width: auto !important;
          scrollbar-color: #9ca3af #f3f4f6;
          overflow-x: scroll !important;
        }
        .scrollable-table::-webkit-scrollbar {
          height: 20px !important;
          width: 20px !important;
          display: block !important;
        }
        .scrollable-table::-webkit-scrollbar-track {
          background: #f3f4f6 !important;
          border-radius: 10px;
          border: 1px solid #e5e7eb;
        }
        .scrollable-table::-webkit-scrollbar-thumb {
          background: #9ca3af !important;
          border-radius: 10px;
          border: 3px solid #f3f4f6;
          min-height: 30px;
        }
        .scrollable-table::-webkit-scrollbar-thumb:hover {
          background: #6b7280 !important;
        }
        .scrollable-table::-webkit-scrollbar-corner {
          background: #f3f4f6;
        }
        .sticky-header {
          position: sticky;
          top: 0;
          z-index: 20;
          background: #f9fafb;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }
        .sticky-header th {
          position: sticky;
          top: 0;
          background: #f9fafb;
          z-index: 25;
        }
        .sticky-header-cell {
          position: sticky;
          top: 0;
          background: #f9fafb;
          z-index: 25;
        }
        .sticky-column-header {
          position: sticky !important;
          left: 0 !important;
          top: 0 !important;
          z-index: 60 !important;
          background: #f9fafb !important;
          box-shadow: 2px 0 4px rgba(0, 0, 0, 0.1) !important;
          min-width: 120px !important;
          max-width: none;
          display: table-cell !important;
          visibility: visible !important;
          opacity: 1 !important;
        }
        .sticky-column-cell {
          position: sticky;
          left: 0;
          z-index: 30;
          background: white;
          box-shadow: 2px 0 4px rgba(0, 0, 0, 0.1);
        }
        tr:hover .sticky-column-cell {
          background: #f9fafb;
        }
        .resize-handle {
          position: absolute;
          top: 0;
          right: 0;
          width: 4px;
          height: 100%;
          cursor: col-resize;
          background: transparent;
          transition: background-color 0.2s;
        }
        .resize-handle:hover {
          background: #3b82f6;
        }
        .resize-handle.resizing {
          background: #1d4ed8;
        }
      `}</style>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 space-y-4 sm:space-y-0">
        <div>
          <h3 className="text-lg font-medium text-rose-900">Reimbursement Data</h3>
          <p className="text-sm text-rose-600">
            {filteredData.length} of {data.length} records • Total: {formatCurrency(totalAmount)}
            {hasMore && <span className="ml-2 text-blue-600">(More available)</span>}
          </p>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-rose-500 focus:border-rose-500"
            />
          </div>

          <select
            value={teamFilter}
            onChange={(e) => setTeamFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-rose-500 focus:border-rose-500"
          >
            <option value="">All Departments</option>
            {uniqueDepartments.map(dept => (
              <option key={dept} value={dept}>{dept}</option>
            ))}
          </select>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-rose-500 focus:border-rose-500"
          >
            <option value="">All Locations</option>
            {uniqueLocations.map(location => (
              <option key={location} value={location}>{location}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="w-full">
        <div
          className="scrollable-table border border-gray-200 rounded-lg bg-white"
          style={{
            overflowX: 'scroll',
            overflowY: 'auto',
            width: '100%',
            maxHeight: '70vh',
            minHeight: '300px',
            position: 'relative'
          }}
        >
          <table className="divide-y divide-gray-200" style={{ minWidth: '1400px', width: 'max-content' }}>
          <thead className="sticky-header">
            <tr>
              <th
                className="sticky-column-header px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap border-r border-gray-200"
              >
                <div className="flex items-center space-x-1">
                  <span>Match Event</span>
                </div>
              </th>
              {[
                { key: 'purchased_at', label: 'Date', autoFit: true },
                { key: 'budget_name', label: 'Budget', autoFit: true },
                { key: 'department_name', label: 'Department' },
                { key: 'location_name', label: 'Location', autoFit: true },
                { key: 'usd_amount', label: 'Amount', autoFit: true },
                { key: 'memo', label: 'Memo' },
                { key: 'calendar_event', label: 'Calendar Event' }
              ].map(({ key, label, autoFit }) => (
                <th
                  key={key}
                  className="sticky-header-cell relative px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap bg-gray-50 border-r border-gray-200"
                  style={autoFit ? { width: 'auto' } : { width: columnWidths[key] || 150, minWidth: '80px' }}
                >
                  <div
                    onClick={() => handleSort(key as keyof ReimbursementRecord)}
                    className="flex items-center space-x-1 cursor-pointer hover:bg-gray-100 rounded px-2 py-1 -mx-2 -my-1"
                  >
                    <span>{label}</span>
                    <SortIcon field={key as keyof ReimbursementRecord} />
                  </div>
                  {!autoFit && (
                    <div
                      className={`resize-handle ${isResizing === key ? 'resizing' : ''}`}
                      onMouseDown={(e) => startResize(key, e)}
                    />
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {sortedData.map((record: any, index) => (
              <tr key={record.id || index} className="hover:bg-gray-50">
                <td
                  className="sticky-column-cell px-6 py-4 text-sm text-gray-900 border-r border-gray-200"
                  style={{ minWidth: '120px' }}
                >
                  {googleAccessToken ? (
                    <div className="flex flex-col items-center space-y-2">
                      {!record.calendar_event ? (
                        <button
                          onClick={() => matchSingleExpense(record)}
                          disabled={matchingExpenses.has(record.id || record.purchased_at + record.usd_amount)}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                            matchingExpenses.has(record.id || record.purchased_at + record.usd_amount)
                              ? 'bg-gray-400 cursor-not-allowed'
                              : 'bg-gray-200 hover:bg-gray-300'
                          }`}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                              false ? 'translate-x-6' : 'translate-x-1'
                            }`}
                          />
                          {matchingExpenses.has(record.id || record.purchased_at + record.usd_amount) && (
                            <Loader2 className="absolute inset-0 h-4 w-4 animate-spin text-gray-600 m-auto" />
                          )}
                        </button>
                      ) : (
                        <>
                          <button
                            onClick={() => unmatchExpense(record)}
                            className="relative inline-flex h-6 w-11 items-center rounded-full bg-green-500 hover:bg-green-600 transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
                            title="Click to unmatch"
                          >
                            <span className="inline-block h-4 w-4 transform rounded-full bg-white translate-x-6 transition-transform" />
                          </button>
                          {record.calendar_match_confidence && (
                            <span className={`text-xs font-medium ${
                              record.calendar_match_confidence === 'high' ? 'text-green-600' :
                              record.calendar_match_confidence === 'medium' ? 'text-yellow-600' :
                              record.calendar_match_confidence === 'low' ? 'text-orange-600' :
                              'text-gray-500'
                            }`}>
                              {record.calendar_match_confidence.toUpperCase()}
                            </span>
                          )}
                        </>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center justify-center text-gray-400 text-xs">
                      Connect Calendar
                    </div>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 border-r border-gray-200">
                  {record.purchased_at}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 border-r border-gray-200">
                  <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-orange-100 text-orange-800">
                    {record.budget_name}
                  </span>
                </td>
                <td
                  className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 border-r border-gray-200"
                  style={{ width: columnWidths.department_name, minWidth: columnWidths.department_name }}
                >
                  <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800 truncate">
                    {record.department_name}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 border-r border-gray-200">
                  <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-purple-100 text-purple-800">
                    {record.location_name}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900 border-r border-gray-200">
                  ${record.usd_amount.toFixed(2)}
                </td>
                <td
                  className="px-6 py-4 text-sm text-gray-900 border-r border-gray-200"
                  style={{ width: columnWidths.memo, minWidth: columnWidths.memo }}
                >
                  <div className="break-words overflow-hidden">{record.memo}</div>
                </td>
                <td
                  className="px-6 py-4 text-sm text-gray-900 border-r border-gray-200"
                  style={{ width: columnWidths.calendar_event, minWidth: columnWidths.calendar_event }}
                >
                  <div className="flex flex-col space-y-1 overflow-hidden">
                    <div className="flex items-center space-x-2">
                      <Calendar className="h-4 w-4 text-blue-500 flex-shrink-0" />
                      <span className="truncate">{formatCalendarEvent(record.calendar_event)}</span>
                    </div>
                    {record.calendar_match_reasoning && (
                      <div className="text-xs text-gray-500 italic pl-6 truncate">
                        {record.calendar_match_reasoning}
                      </div>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Loading indicator for infinite scroll */}
        {hasMore && (
          <div
            ref={observerRef}
            className="flex justify-center items-center py-6"
          >
            {loading ? (
              <div className="flex items-center text-rose-600">
                <Loader2 className="h-5 w-5 animate-spin mr-2" />
                Loading more...
              </div>
            ) : (
              <div className="text-gray-500 text-sm">
                Scroll down to load more
              </div>
            )}
          </div>
        )}

        {sortedData.length === 0 && !loading && (
          <div className="text-center py-8">
            <Filter className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No records match your current filters</p>
          </div>
        )}
        </div>
      </div>
    </div>
  );
}