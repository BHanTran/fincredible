import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

// Currency conversion function using a free API
async function convertCurrency(amount: number, fromCurrency: string): Promise<number | null> {
  try {
    if (fromCurrency.toLowerCase() === 'usd') {
      return amount;
    }

    // Using exchangerate-api.com (free tier)
    const response = await fetch(`https://api.exchangerate-api.com/v4/latest/${fromCurrency.toUpperCase()}`);
    const data = await response.json();

    if (data.rates && data.rates.USD) {
      return Math.round((amount * data.rates.USD) * 100) / 100; // Round to 2 decimal places
    }

    return null;
  } catch (error) {
    console.error('Currency conversion error:', error);
    return null;
  }
}

export interface ParsedReceiptData {
  amount: number | null;
  currency: string | null;
  amountUSD: number | null;
  merchant: string | null;
  date: string | null;
  description: string | null;
  category: string | null;
}

export async function parseReceiptText(imageFile: File): Promise<ParsedReceiptData> {
  try {
    console.log('Starting receipt parsing with Gemini...');
    console.log('File details:', { name: imageFile.name, size: imageFile.size, type: imageFile.type });

    if (!process.env.GEMINI_API_KEY) {
      console.error('GEMINI_API_KEY is not set');
      throw new Error('Gemini API key is not configured');
    }

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    // Convert file to base64
    const bytes = await imageFile.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64Data = buffer.toString('base64');
    console.log('Image converted to base64, length:', base64Data.length);

    const prompt = `
    Analyze this receipt image and extract the following information in JSON format:
    {
      "amount": <total amount as number>,
      "currency": "<3-letter currency code like USD, EUR, VND, etc>",
      "merchant": "<merchant/store name>",
      "date": "<date in YYYY-MM-DD format>",
      "description": "<brief description of items/service>",
      "category": "<one of: Office Supplies, Travel, Meals, Equipment, Other>"
    }

    For the currency field, identify the currency from symbols, text, or context:
    - Look for currency symbols: $, €, ¥, £, ₹, ₫, etc.
    - Look for currency codes: USD, EUR, JPY, GBP, INR, VND, etc.
    - Use country context (Vietnamese receipt = VND, Japanese = JPY, etc.)
    - If unclear, try to infer from location/language on receipt

    For the category field, classify the purchase into one of these categories:
    - Office Supplies: pens, paper, office equipment, supplies
    - Travel: gas, flights, hotels, transportation, parking
    - Meals: restaurants, food, groceries, coffee, snacks
    - Equipment: tools, computers, furniture, machinery
    - Other: anything that doesn't fit the above categories

    If any information is not clearly visible or cannot be determined, use null for that field.
    Only return the JSON, no additional text.
    `;

    const imagePart = {
      inlineData: {
        data: base64Data,
        mimeType: imageFile.type,
      },
    };

    console.log('Sending request to Gemini...');
    const result = await model.generateContent([prompt, imagePart]);
    const response = await result.response;
    const text = response.text();
    console.log('Gemini response:', text);

    // Try to parse the JSON response
    try {
      // Remove markdown code blocks if present
      let cleanText = text.trim();
      if (cleanText.startsWith('```json')) {
        cleanText = cleanText.replace(/^```json\s*/, '').replace(/\s*```$/, '');
      } else if (cleanText.startsWith('```')) {
        cleanText = cleanText.replace(/^```\s*/, '').replace(/\s*```$/, '');
      }

      const parsed = JSON.parse(cleanText.trim());

      // Convert currency if not USD
      let amountUSD = null;
      const originalAmount = parsed.amount ? Number(parsed.amount) : null;
      const currency = parsed.currency || 'USD';

      if (originalAmount && currency) {
        console.log(`Converting ${originalAmount} ${currency} to USD...`);
        amountUSD = await convertCurrency(originalAmount, currency);
        console.log(`Converted amount: ${amountUSD} USD`);
      }

      return {
        amount: originalAmount,
        currency: currency,
        amountUSD: amountUSD || originalAmount, // Fallback to original if conversion fails
        merchant: parsed.merchant || null,
        date: parsed.date || null,
        description: parsed.description || null,
        category: parsed.category || null,
      };
    } catch (parseError) {
      console.error('Error parsing Gemini response:', parseError);
      console.error('Raw response:', text);
      return {
        amount: null,
        currency: null,
        amountUSD: null,
        merchant: null,
        date: null,
        description: null,
        category: null,
      };
    }
  } catch (error) {
    console.error('Error parsing receipt with Gemini:', error);
    return {
      amount: null,
      currency: null,
      amountUSD: null,
      merchant: null,
      date: null,
      description: null,
      category: null,
    };
  }
}