import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { GoogleCalendarService } from "@/lib/google-calendar";

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { expenses, accessToken } = await req.json();

    if (!expenses || !Array.isArray(expenses)) {
      return NextResponse.json({ error: "Expenses array is required" }, { status: 400 });
    }

    if (!accessToken) {
      return NextResponse.json({ error: "Google Calendar access token is required" }, { status: 400 });
    }

    console.log(`Enriching ${expenses.length} expenses with calendar data`);

    const calendarService = new GoogleCalendarService(accessToken);
    const enrichedExpenses = await calendarService.enrichExpensesWithCalendar(expenses);

    const matchedCount = enrichedExpenses.filter(exp => exp.calendar_event).length;
    console.log(`Successfully matched ${matchedCount} out of ${expenses.length} expenses with calendar events`);

    return NextResponse.json({
      success: true,
      data: enrichedExpenses,
      stats: {
        total: expenses.length,
        matched: matchedCount,
        unmatched: expenses.length - matchedCount
      }
    });

  } catch (error) {
    console.error("Error enriching expenses with calendar data:", error);

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
        error: "Failed to enrich expenses with calendar data",
        success: false
      },
      { status: 500 }
    );
  }
}