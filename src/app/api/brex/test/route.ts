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

    // Test with a simple endpoint first
    const response = await fetch('https://platform.brexapis.com/v2/users/me', {
      headers: {
        'Authorization': `Bearer ${apiToken}`,
        'Content-Type': 'application/json',
      },
    });

    console.log('Brex test API response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Brex test API error:', errorText);
      return NextResponse.json({
        error: `Brex API test failed: ${response.status} ${response.statusText}`,
        details: errorText,
        success: false
      }, { status: response.status });
    }

    const userData = await response.json();
    console.log('Brex test API success:', userData);

    return NextResponse.json({
      success: true,
      message: "Brex API connection successful",
      user: userData,
    });

  } catch (error) {
    console.error("Error testing Brex API:", error);
    return NextResponse.json(
      {
        error: "Failed to test Brex API connection",
        success: false
      },
      { status: 500 }
    );
  }
}