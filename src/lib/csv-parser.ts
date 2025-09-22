import { ReimbursementRecord, ParsedCSVData } from "@/types/reimbursement";

export async function parseCSVFile(file: File): Promise<ParsedCSVData> {
  try {
    const text = await file.text();
    const lines = text.split('\n').filter(line => line.trim());

    if (lines.length < 2) {
      return {
        success: false,
        error: "CSV file must contain at least a header row and one data row"
      };
    }

    // Parse header row
    const headers = parseCSVRow(lines[0]);

    // Validate required columns
    const requiredColumns = ['date', 'employee', 'team', 'amount', 'description', 'category'];
    const normalizedHeaders = headers.map(h => h.toLowerCase().trim());

    const missingColumns = requiredColumns.filter(col =>
      !normalizedHeaders.includes(col)
    );

    if (missingColumns.length > 0) {
      return {
        success: false,
        error: `Missing required columns: ${missingColumns.join(', ')}`
      };
    }

    // Create column mapping
    const columnMap: Record<string, number> = {};
    requiredColumns.forEach(col => {
      const index = normalizedHeaders.indexOf(col);
      if (index !== -1) {
        columnMap[col] = index;
      }
    });

    // Parse data rows
    const records: ReimbursementRecord[] = [];

    for (let i = 1; i < lines.length; i++) {
      const row = parseCSVRow(lines[i]);

      if (row.length < headers.length) continue; // Skip incomplete rows

      try {
        const amount = parseFloat(row[columnMap.amount]);
        if (isNaN(amount)) {
          console.warn(`Invalid amount in row ${i + 1}: ${row[columnMap.amount]}`);
          continue;
        }

        const record: ReimbursementRecord = {
          id: `row-${i}`,
          date: row[columnMap.date]?.trim() || '',
          employee: row[columnMap.employee]?.trim() || '',
          team: row[columnMap.team]?.trim() || '',
          amount: amount,
          description: row[columnMap.description]?.trim() || '',
          category: row[columnMap.category]?.trim() || ''
        };

        records.push(record);
      } catch (error) {
        console.warn(`Error parsing row ${i + 1}:`, error);
        continue;
      }
    }

    if (records.length === 0) {
      return {
        success: false,
        error: "No valid data rows found in CSV file"
      };
    }

    return {
      success: true,
      data: records,
      headers: headers
    };

  } catch (error) {
    console.error('CSV parsing error:', error);
    return {
      success: false,
      error: "Failed to parse CSV file. Please check the file format."
    };
  }
}

function parseCSVRow(row: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < row.length; i++) {
    const char = row[i];
    const nextChar = row[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        // Escaped quote
        current += '"';
        i++; // Skip next quote
      } else {
        // Toggle quote state
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      // End of field
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }

  // Add the last field
  result.push(current.trim());

  return result;
}