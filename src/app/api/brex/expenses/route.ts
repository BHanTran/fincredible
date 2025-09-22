import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { fetchBrexReimbursementsPaginated } from "@/lib/brex-api";

export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);

    // Gather date-range
    const purchased_at_start = searchParams.get('purchased_at_start') || undefined;
    const purchased_at_end = searchParams.get('purchased_at_end') || undefined;
    const cursor = searchParams.get('cursor') || undefined;
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!, 10) : 20;

    console.log('Fetching Brex reimbursements with params:', { purchased_at_start, purchased_at_end, cursor, limit });

    const result = await fetchBrexReimbursementsPaginated({
      purchased_at_start: purchased_at_start,
      purchased_at_end: purchased_at_end,
      cursor,
      limit,
      expense_type: ["REIMBURSEMENT"],
    });

    console.log(`Successfully fetched ${result.data.length} expenses from Brex, hasMore: ${result.hasMore}`);

    return NextResponse.json({
      success: true,
      data: result.data,
      nextCursor: result.nextCursor,
      hasMore: result.hasMore,
      count: result.data.length,
      rawBrexData: result.rawItems, // Include raw Brex response
    });

  } catch (error) {
    console.error("Error fetching Brex expenses:", error);

    if (error instanceof Error) {
      return NextResponse.json(
        {
          error: error.message,
          success: false
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        error: "Failed to fetch expenses from Brex",
        success: false
      },
      { status: 500 }
    );
  }
}
