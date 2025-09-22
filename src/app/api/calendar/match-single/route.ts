import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { GoogleCalendarService } from "@/lib/google-calendar";

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { expense, accessToken } = await req.json();

    if (!expense) {
      return NextResponse.json({ error: "Expense object is required" }, { status: 400 });
    }

    if (!accessToken) {
      return NextResponse.json({ error: "Google Calendar access token is required" }, { status: 400 });
    }

    console.log(`Matching single expense with calendar data: ${expense.memo}`);

    const calendarService = new GoogleCalendarService(accessToken);
    const enrichedExpenses = await calendarService.enrichExpensesWithCalendar([expense]);
    const enrichedExpense = enrichedExpenses[0];

    const hasMatch = !!enrichedExpense.calendar_event;
    console.log(`${hasMatch ? 'Successfully matched' : 'No match found for'} expense: ${expense.memo}`);

    return NextResponse.json({
      success: true,
      data: enrichedExpense,
      hasMatch
    });

  } catch (error) {
    console.error("Error matching expense with calendar data:", error);

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
        error: "Failed to match expense with calendar data",
        success: false
      },
      { status: 500 }
    );
  }
}