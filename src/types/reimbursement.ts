export interface ReimbursementRecord {
  purchased_at: string;
  employee: string;
  team: string;
  amount: number;
  description: string;
  category: string;
  id?: string; // For table row identification
}

export interface ParsedCSVData {
  success: boolean;
  data?: ReimbursementRecord[];
  error?: string;
  headers?: string[];
}