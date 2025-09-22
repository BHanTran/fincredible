import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export interface ExpenseCalendarMatch {
  confidence: 'high' | 'medium' | 'low' | 'none';
  reasoning: string;
  matchedEventId?: string;
}

export async function matchExpenseWithGemini(
  expense: any,
  calendarEvents: any[]
): Promise<ExpenseCalendarMatch> {
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

  const prompt = `
You are an AI assistant that matches business expenses with calendar events to help with expense categorization and reporting.

**EXPENSE DETAILS:**
- Date: ${expense.purchased_at}
- Amount: $${expense.usd_amount}
- Memo: "${expense.memo}"
- Location: ${expense.location_name || 'N/A'}
- Department: ${expense.department_name || 'N/A'}
- User Email: ${expense.user_email}

**CALENDAR EVENTS FOR ${expense.purchased_at}:**
${calendarEvents.map((event, index) => `
${index + 1}. "${event.summary}"
   Time: ${event.start?.dateTime ? new Date(event.start.dateTime).toLocaleTimeString() : 'All day'}
   Location: ${event.location || 'N/A'}
   Description: ${event.description || 'N/A'}
   Attendees: ${event.attendees?.length || 0} people
`).join('')}

**TASK:**
Analyze the expense and determine which calendar event (if any) it most likely relates to. Consider:

1. **Semantic Matching**: Does the expense memo relate to any event's purpose?
2. **Timing**: Does the expense timing align with any event?
3. **Location Context**: Are there location clues that match?
4. **Business Context**: Does this seem like a business meal, meeting expense, etc.?
5. **Attendee Count**: Large meetings might correlate with group meals/expenses

**CONFIDENCE LEVELS:**
- **HIGH**: Strong semantic match + timing/location alignment
- **MEDIUM**: Good semantic match OR strong timing/location match
- **LOW**: Weak but plausible connection
- **NONE**: No reasonable connection found

**RESPONSE FORMAT (JSON only):**
{
  "confidence": "high|medium|low|none",
  "reasoning": "Brief explanation of why this match was chosen",
  "matchedEventId": "event_id_if_matched_or_null"
}

**EXAMPLES:**
- Expense memo "Team lunch at Olive Garden" + Calendar event "Weekly Team Sync" at 12pm = HIGH confidence
- Expense memo "Coffee" + Calendar event "1:1 with Sarah" at 10am = MEDIUM confidence
- Expense memo "Uber ride" + Calendar event "Client meeting downtown" = MEDIUM confidence
- Expense memo "Office supplies" + Calendar event "Birthday party" = NONE

Respond with JSON only, no additional text.
`;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // Parse JSON response
    const match = JSON.parse(text.trim());

    // Validate response format
    if (!['high', 'medium', 'low', 'none'].includes(match.confidence)) {
      throw new Error('Invalid confidence level');
    }

    return match;
  } catch (error) {
    console.error('Gemini matching error:', error);
    return {
      confidence: 'none',
      reasoning: 'AI matching failed, falling back to rule-based matching'
    };
  }
}

export async function enrichExpensesWithGeminiMatching(
  expenses: any[],
  getCalendarEvents: (email: string, date: string) => Promise<any[]>
): Promise<any[]> {
  const enrichedExpenses = [];

  for (const expense of expenses) {
    try {
      const events = await getCalendarEvents(expense.user_email, expense.purchased_at);
      const match = await matchExpenseWithGemini(expense, events);

      let matchedEvent = null;
      if (match.matchedEventId && match.confidence !== 'none') {
        const eventIndex = parseInt(match.matchedEventId) - 1;
        matchedEvent = events[eventIndex] || null;
      }

      enrichedExpenses.push({
        ...expense,
        calendar_event: matchedEvent,
        calendar_match_confidence: match.confidence !== 'none' ? match.confidence : null,
        ai_reasoning: match.reasoning
      });
    } catch (error) {
      console.error('Error enriching expense:', error);
      enrichedExpenses.push({
        ...expense,
        calendar_event: null,
        calendar_match_confidence: null,
        ai_reasoning: 'Matching failed'
      });
    }
  }

  return enrichedExpenses;
}