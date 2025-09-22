import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const apiToken = process.env.BREX_API_TOKEN;

    if (!apiToken) {
      return NextResponse.json({ error: "Brex API token not configured" }, { status: 500 });
    }

    // Test the expenses endpoint with reimbursement filter
    const response = await fetch('https://platform.brexapis.com/v1/expenses?expense_type=REIMBURSEMENT&limit=5', {
      headers: {
        'Authorization': `Bearer ${apiToken}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    });

    console.log('Brex expenses API response status:', response.status);
    console.log('Brex expenses API response headers:', Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Brex expenses API error:', errorText);

      return NextResponse.json({
        error: `Brex Expenses API test failed: ${response.status} ${response.statusText}`,
        details: errorText,
        success: false,
        suggestion: response.status === 401 ?
          "Your API token may not have permissions to access expenses. Check your token permissions in the Brex dashboard." :
          "Unknown error occurred"
      }, { status: response.status });
    }

    const expensesData = await response.json();
    console.log('Brex expenses API success:', expensesData);

    return NextResponse.json({
      success: true,
      message: "Brex Expenses API connection successful",
      data: expensesData,
    });

  } catch (error) {
    console.error("Error testing Brex Expenses API:", error);
    return NextResponse.json(
      {
        error: "Failed to test Brex Expenses API connection",
        success: false
      },
      { status: 500 }
    );
  }
}