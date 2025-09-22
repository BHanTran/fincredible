import { parseReceiptText, ParsedReceiptData } from "./gemini";

export interface ReceiptParseResult {
  success: boolean;
  data?: ParsedReceiptData;
  error?: string;
}

export interface FileValidationResult {
  isValid: boolean;
  error?: string;
}

export function validateReceiptFile(file: File): FileValidationResult {
  if (!file.type.startsWith("image/")) {
    return {
      isValid: false,
      error: "File must be an image"
    };
  }

  if (file.size > 5 * 1024 * 1024) {
    return {
      isValid: false,
      error: "File too large (max 5MB)"
    };
  }

  return { isValid: true };
}

export async function parseReceipt(file: File): Promise<ReceiptParseResult> {
  try {
    const validation = validateReceiptFile(file);
    if (!validation.isValid) {
      return {
        success: false,
        error: validation.error
      };
    }

    const parsedData = await parseReceiptText(file);
    
    return {
      success: true,
      data: parsedData
    };
  } catch (error) {
    console.error("Error parsing receipt:", error);
    return {
      success: false,
      error: "Failed to parse receipt"
    };
  }
}