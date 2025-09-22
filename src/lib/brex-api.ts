import { ReimbursementRecord } from "@/types/reimbursement";

const BREX_API_BASE = "https://platform.brexapis.com/v1";

export interface BrexExpense {
  id: string;
  updated_at: string;
  purchased_at?: string;
  memo?: string;
  category: string;
  expense_type: string;
  status: string;
  original_amount?: {
    amount: number;
    currency: string;
  };
  billing_amount?: {
    amount: number;
    currency: string;
  };
  usd_equivalent_amount?: {
    amount: number;
    currency: string;
  };
  merchant_id?: string;
  location_id?: string;
  department_id?: string;
  spending_entity_id: string;
}

export interface BrexExpensesResponse {
  items: BrexExpense[];
  next_cursor?: string;
}

class BrexAPIError extends Error {
  constructor(message: string, public status?: number) {
    super(message);
    this.name = "BrexAPIError";
  }
}

/**
 * Internal function to send authorized requests to Brex API
 */
async function makeBrexRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const apiToken = process.env.BREX_API_TOKEN;

  if (!apiToken) {
    throw new BrexAPIError("Brex API token is not configured");
  }

  const url = `${BREX_API_BASE}${endpoint}`;

  console.log("Brex API request:", url);

  const response = await fetch(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${apiToken}`,
      "Content-Type": "application/json",
      Accept: "application/json",
      "User-Agent": "Expense-Tracker-App/1.0",
      ...options.headers,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("Brex API error response:", errorText);
    throw new BrexAPIError(
      `Brex API error: ${response.status} ${response.statusText} - ${errorText}`,
      response.status
    );
  }

  return response.json();
}

/**
 * Build query string for expense fetching with filters
 */
function buildExpenseQueryParams(params: {
  cursor?: string;
  limit?: number;
  purchased_at_start?: string;
  purchased_at_end?: string;
}): string {
  const searchParams = new URLSearchParams();

  if (params.cursor) searchParams.set("cursor", params.cursor);
  if (params.limit) searchParams.set("limit", params.limit.toString());

  if (params.purchased_at_start) {
    searchParams.append(
      "purchased_at_start",
      `${params.purchased_at_start}T00:00:00.000`
    );
  }

  if (params.purchased_at_end) {
    searchParams.append(
      "purchased_at_end",
      `${params.purchased_at_end}T23:59:59.999`
    );
  }

  // Always filter to reimbursement expenses only
  searchParams.append("expense_type[]", "REIMBURSEMENT");

  // Add expand parameters to get additional details
  searchParams.append("expand[]", "merchant");
  searchParams.append("expand[]", "location");
  searchParams.append("expand[]", "department");
  searchParams.append("expand[]", "receipts.download_uris");
  searchParams.append("expand[]", "user");
  searchParams.append("expand[]", "budget");
  searchParams.append("expand[]", "payment");

  return searchParams.toString();
}

/**
 * Fetch a single page of Brex reimbursement expenses
 */
export async function getBrexExpenses(params: {
  cursor?: string;
  limit?: number;
  purchased_at_start?: string;
  purchased_at_end?: string;
} = {}): Promise<BrexExpensesResponse> {
  const query = buildExpenseQueryParams(params);
  const endpoint = `/expenses?${query}`;
  return makeBrexRequest<BrexExpensesResponse>(endpoint);
}

/**
 * Fetch all reimbursement expenses across pages
 */
export async function getAllBrexExpenses(params: {
  purchased_at_start?: string;
  purchased_at_end?: string;
  limit?: number;
} = {}): Promise<BrexExpense[]> {
  const allExpenses: BrexExpense[] = [];
  let cursor: string | undefined;
  const limit = params.limit || 100;

  do {
    const response = await getBrexExpenses({
      cursor,
      limit,
      purchased_at_start: params.purchased_at_start,
      purchased_at_end: params.purchased_at_end,
    });

    allExpenses.push(...response.items);
    cursor = response.next_cursor;
  } while (cursor);

  return allExpenses;
}

/**
 * Extract specific fields from raw Brex expense for display
 */
export function extractBrexExpenseFields(expense: any) {
  // Extract budget name and get string after "'s" if it exists
  let budgetName = expense.budget?.name || "N/A";
  if (budgetName !== "N/A" && budgetName.includes("'s")) {
    const parts = budgetName.split("'s");
    budgetName = parts[1]?.trim() || budgetName;
  }

  // Create email from budget name by removing spaces and adding domain
  let userEmail = "N/A";
  if (budgetName !== "N/A") {
    const emailUsername = budgetName.replace(/\s+/g, '').toLowerCase();
    userEmail = `${emailUsername}@anduintransact.com`;
  }

  return {
    purchased_at: expense.purchased_at?.split("T")[0] || expense.updated_at?.split("T")[0] || "N/A",
    budget_name: budgetName,
    user_email: userEmail,
    department_name: expense.department?.name || "N/A",
    location_name: expense.location?.name || "N/A",
    usd_amount: expense.usd_equivalent_amount?.amount ? (expense.usd_equivalent_amount.amount / 100) : 0,
    memo: expense.memo || "N/A",
    calendar_event: expense.calendar_event || null,
    calendar_match_confidence: expense.calendar_match_confidence || null
  };
}

/**
 * Fetch and return all reimbursement expenses (flattened)
 */
export async function fetchBrexReimbursements(params: {
  purchased_at_start?: string;
  purchased_at_end?: string;
} = {}): Promise<ReimbursementRecord[]> {
  try {
    const expenses = await getAllBrexExpenses(params);
    const reimbursementExpenses = expenses.filter(
      (e) => e.expense_type === "REIMBURSEMENT"
    );
    return reimbursementExpenses.map(convertBrexExpenseToReimbursement);
  } catch (error) {
    console.error("Error fetching Brex reimbursements:", error);
    throw error;
  }
}

/**
 * Fetch and return paginated reimbursement expenses
 */
export async function fetchBrexReimbursementsPaginated(params: {
  purchased_at_start?: string;
  purchased_at_end?: string;
  cursor?: string;
  limit?: number;
} = {}): Promise<{
  data: ReimbursementRecord[];
  nextCursor?: string;
  hasMore: boolean;
  rawItems?: BrexExpense[];
}> {
  try {
    const response = await getBrexExpenses({
      cursor: params.cursor,
      limit: params.limit || 20,
      purchased_at_start: params.purchased_at_start,
      purchased_at_end: params.purchased_at_end,
    });

    const reimbursementExpenses = response.items.filter(
      (e) => e.expense_type === "REIMBURSEMENT"
    );

    return {
      data: reimbursementExpenses.map(extractBrexExpenseFields), // Extract specific fields
      nextCursor: response.next_cursor,
      hasMore: !!response.next_cursor,
      rawItems: reimbursementExpenses, // Include raw Brex items
    };
  } catch (error) {
    console.error("Error fetching paginated Brex reimbursements:", error);
    throw error;
  }
}
