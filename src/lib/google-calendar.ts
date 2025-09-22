import { google } from 'googleapis';

export interface CalendarEvent {
  id: string;
  summary: string;
  description?: string;
  start: {
    dateTime?: string;
    date?: string;
  };
  end: {
    dateTime?: string;
    date?: string;
  };
  location?: string;
  attendees?: Array<{
    email: string;
    displayName?: string;
  }>;
}

export interface ExpenseWithCalendar {
  purchased_at: string;
  budget_name: string;
  user_email: string;
  department_name: string;
  location_name: string;
  usd_amount: number;
  memo: string;
  calendar_event?: CalendarEvent;
  calendar_match_confidence?: 'high' | 'medium' | 'low';
}

export class GoogleCalendarService {
  private calendar: any;

  // Define additional calendars to search
  private additionalCalendars = [
    'c_kj6v4nvbgp4tr1tkbb1q7b3kks@group.calendar.google.com', // Marketing events calendar
    'anduintransact.com_91igbs7aq8jr2mvsfo3bc0anls@group.calendar.google.com' // Team calendar
  ];

  constructor(accessToken: string) {
    const auth = new google.auth.OAuth2();
    auth.setCredentials({ access_token: accessToken });
    this.calendar = google.calendar({ version: 'v3', auth });
  }

  /**
   * Get calendar events for a date range including multi-day events
   */
  async getEventsForDateRange(email: string, startDate: string, endDate: string): Promise<CalendarEvent[]> {
    const allEvents: CalendarEvent[] = [];

    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);

    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    // List of calendars to check (user's calendar + additional calendars)
    const calendarsToCheck = [email, ...this.additionalCalendars];

    console.log(`Checking calendars for ${email} from ${startDate} to ${endDate}:`, calendarsToCheck);

    for (const calendarId of calendarsToCheck) {
      try {
        console.log(`Fetching events from calendar: ${calendarId}`);

        const response = await this.calendar.events.list({
          calendarId: calendarId,
          timeMin: start.toISOString(),
          timeMax: end.toISOString(),
          singleEvents: true,
          orderBy: 'startTime',
          maxResults: 100, // Increased for multi-day searches
        });

        const events = response.data.items || [];
        console.log(`Found ${events.length} events in ${calendarId}`);

        // Add calendar source and multi-day detection to each event
        const eventsWithSource = events.map((event: any) => ({
          ...event,
          calendarSource: calendarId,
          isUserCalendar: calendarId === email,
          isMultiDay: this.isMultiDayEvent(event)
        }));

        allEvents.push(...eventsWithSource);
      } catch (error) {
        console.error(`Error fetching events from ${calendarId}:`, error);
        // Continue with other calendars even if one fails
      }
    }

    console.log(`Total events found across all calendars: ${allEvents.length}`);
    return allEvents;
  }

  /**
   * Get calendar events for a specific date and email from multiple calendars
   */
  async getEventsForDate(email: string, date: string): Promise<CalendarEvent[]> {
    const allEvents: CalendarEvent[] = [];

    // Set time range for the entire day
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    // List of calendars to check (user's calendar + additional calendars)
    const calendarsToCheck = [email, ...this.additionalCalendars];

    console.log(`Checking calendars for ${email} on ${date}:`, calendarsToCheck);

    for (const calendarId of calendarsToCheck) {
      try {
        console.log(`Fetching events from calendar: ${calendarId}`);

        const response = await this.calendar.events.list({
          calendarId: calendarId,
          timeMin: startOfDay.toISOString(),
          timeMax: endOfDay.toISOString(),
          singleEvents: true,
          orderBy: 'startTime',
          maxResults: 50,
        });

        const events = response.data.items || [];
        console.log(`Found ${events.length} events in ${calendarId}`);

        // Add calendar source to each event for tracking
        const eventsWithSource = events.map((event: any) => ({
          ...event,
          calendarSource: calendarId,
          isUserCalendar: calendarId === email
        }));

        allEvents.push(...eventsWithSource);
      } catch (error) {
        console.error(`Error fetching events from ${calendarId}:`, error);
        // Continue with other calendars even if one fails
      }
    }

    console.log(`Total events found across all calendars: ${allEvents.length}`);
    return allEvents;
  }

  /**
   * Check if an event spans multiple days
   */
  private isMultiDayEvent(event: any): boolean {
    if (!event.start || !event.end) return false;

    const startDate = new Date(event.start.dateTime || event.start.date);
    const endDate = new Date(event.end.dateTime || event.end.date);

    // If it's an all-day event, check if it spans multiple days
    if (event.start.date && event.end.date) {
      const daysDiff = Math.floor((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
      return daysDiff > 1;
    }

    // For timed events, check if they cross midnight
    return startDate.toDateString() !== endDate.toDateString();
  }

  /**
   * Enhanced matching for multi-day events using contextual lookback
   */
  async matchExpenseWithMultiDayEvents(
    expense: any,
    email: string
  ): Promise<{ event: CalendarEvent | null; confidence: 'high' | 'medium' | 'low' | null; reasoning?: string }> {

    console.log(`\n=== MULTI-DAY MATCHING for ${expense.memo} on ${expense.purchased_at} ===`);

    // Strategy: Look for events in a 7-day window around the expense date
    const expenseDate = new Date(expense.purchased_at);
    const startDate = new Date(expenseDate);
    startDate.setDate(startDate.getDate() - 7); // Look 7 days back

    const endDate = new Date(expenseDate);
    endDate.setDate(endDate.getDate() + 1); // Look 1 day forward

    const events = await this.getEventsForDateRange(
      email,
      startDate.toISOString().split('T')[0],
      endDate.toISOString().split('T')[0]
    );

    if (!events.length) {
      return { event: null, confidence: null, reasoning: 'No events found in 7-day window' };
    }

    // Filter and prioritize multi-day events
    const multiDayEvents = events.filter((event: any) => event.isMultiDay);
    const singleDayEvents = events.filter((event: any) => !event.isMultiDay);

    console.log(`Found ${multiDayEvents.length} multi-day events and ${singleDayEvents.length} single-day events`);

    let bestMatch: CalendarEvent | null = null;
    let bestConfidence: 'high' | 'medium' | 'low' | null = null;
    let bestScore = 0;
    let bestReasoning = '';

    // First, try matching with multi-day events (higher priority)
    for (const event of multiDayEvents) {
      const result = this.analyzeMultiDayEventMatch(expense, event);
      console.log(`Multi-day event "${event.summary}": Score ${result.score}, Confidence: ${result.confidence}`);

      if (result.score > bestScore) {
        bestScore = result.score;
        bestMatch = event;
        bestConfidence = result.confidence;
        bestReasoning = result.reasoning;
      }
    }

    // If no good multi-day match, try single-day events with lower priority
    if (bestScore < 30) {
      for (const event of singleDayEvents) {
        // Only consider single-day events on the same date
        const eventDate = new Date(event.start?.dateTime || event.start?.date || '');
        if (eventDate.toDateString() === expenseDate.toDateString()) {
          const result = this.matchExpenseWithCalendar(expense, [event]);
          if (result.event && result.confidence) {
            const adjustedScore = this.getConfidenceScore(result.confidence) * 0.8; // Reduce score for single-day fallback

            if (adjustedScore > bestScore) {
              bestScore = adjustedScore;
              bestMatch = result.event;
              bestConfidence = result.confidence;
              bestReasoning = `Single-day fallback: ${result.reasoning}`;
            }
          }
        }
      }
    }

    console.log(`Best multi-day match: "${bestMatch?.summary}" with score ${bestScore}`);

    return {
      event: bestMatch,
      confidence: bestConfidence,
      reasoning: bestReasoning
    };
  }

  /**
   * Analyze multi-day event matching with business trip context
   */
  private analyzeMultiDayEventMatch(expense: any, event: any) {
    let score = 0;
    let confidence: 'high' | 'medium' | 'low' = 'low';
    let reasoning: string[] = [];

    const expenseDate = new Date(expense.purchased_at);
    const eventStart = new Date(event.start?.dateTime || event.start?.date || '');
    const eventEnd = new Date(event.end?.dateTime || event.end?.date || '');

    const expenseMemo = expense.memo?.toLowerCase() || '';
    const eventSummary = event.summary?.toLowerCase() || '';
    const eventDescription = event.description?.toLowerCase() || '';
    const eventLocation = event.location?.toLowerCase() || '';
    const expenseLocation = expense.location_name?.toLowerCase() || '';

    console.log(`  Analyzing: "${event.summary}" (${eventStart.toDateString()} - ${eventEnd.toDateString()})`);

    // 1. CHECK IF EXPENSE DATE FALLS WITHIN EVENT PERIOD
    if (expenseDate >= eventStart && expenseDate <= eventEnd) {
      score += 40;
      reasoning.push('Expense date within event period');
      confidence = 'high';
      console.log(`    ✓ Date within event period (+40)`);
    } else {
      // Nearby dates get partial credit
      const daysBefore = Math.ceil((eventStart.getTime() - expenseDate.getTime()) / (1000 * 60 * 60 * 24));
      const daysAfter = Math.ceil((expenseDate.getTime() - eventEnd.getTime()) / (1000 * 60 * 60 * 24));

      if (daysBefore >= 0 && daysBefore <= 2) {
        score += 20;
        reasoning.push(`${daysBefore} days before event start`);
        confidence = 'medium';
      } else if (daysAfter >= 0 && daysAfter <= 2) {
        score += 15;
        reasoning.push(`${daysAfter} days after event end`);
        confidence = 'medium';
      }
    }

    // 2. BUSINESS TRIP & TRAVEL CONTEXT ANALYSIS
    const tripKeywords = ['trip', 'travel', 'business trip', 'visit', 'conference', 'summit', 'expo'];
    const expenseHasTripContext = tripKeywords.some(keyword => expenseMemo.includes(keyword));
    const eventHasTripContext = tripKeywords.some(keyword =>
      eventSummary.includes(keyword) || eventDescription.includes(keyword)
    );

    if (expenseHasTripContext && eventHasTripContext) {
      score += 35;
      reasoning.push('Business trip context match');
      confidence = 'high';
      console.log(`    ✓ Business trip context (+35)`);
    } else if (eventHasTripContext) {
      score += 25;
      reasoning.push('Event has trip context');
      if (confidence !== 'high') confidence = 'medium';
    }

    // 3. LOCATION/GEOGRAPHY MATCHING
    if (expenseLocation && eventLocation) {
      if (this.isLocationMatch(expenseLocation, eventLocation)) {
        score += 30;
        reasoning.push('Location match');
        confidence = 'high';
        console.log(`    ✓ Location match (+30)`);
      } else if (this.isBroadLocationMatch(expenseLocation, eventLocation)) {
        score += 20;
        reasoning.push('Geographic area match');
        if (confidence !== 'high') confidence = 'medium';
      }
    }

    // 4. EXPENSE TYPE ANALYSIS FOR TRIPS
    const travelExpenseTypes = {
      'accommodation': ['hotel', 'accommodation', 'stay', 'lodging'],
      'transport': ['flight', 'uber', 'taxi', 'transport', 'airline', 'train'],
      'meals': ['dinner', 'lunch', 'breakfast', 'meal', 'restaurant'],
      'client': ['client', 'meeting', 'demo', 'presentation']
    };

    for (const [type, keywords] of Object.entries(travelExpenseTypes)) {
      if (keywords.some(keyword => expenseMemo.includes(keyword))) {
        score += 15;
        reasoning.push(`${type} expense type`);
        break;
      }
    }

    // 5. MULTI-DAY EVENT BONUS
    score += 10;
    reasoning.push('Multi-day event bonus');

    // 6. CALENDAR SOURCE CONSIDERATION
    const calendarSource = (event as any).calendarSource;
    if (calendarSource?.includes('marketing')) {
      score += 8;
      reasoning.push('Marketing calendar');
    } else if (calendarSource?.includes('team')) {
      score += 6;
      reasoning.push('Team calendar');
    }

    console.log(`    Final score: ${score}, Reasoning: ${reasoning.join('; ')}`);

    return {
      score,
      confidence,
      reasoning: reasoning.join('; ')
    };
  }

  /**
   * Convert confidence level to numeric score for comparison
   */
  private getConfidenceScore(confidence: 'high' | 'medium' | 'low'): number {
    switch (confidence) {
      case 'high': return 40;
      case 'medium': return 25;
      case 'low': return 15;
      default: return 0;
    }
  }

  /**
   * Enhanced matching using memo, location, and context from multiple calendars
   */
  matchExpenseWithCalendar(
    expense: any,
    events: CalendarEvent[]
  ): { event: CalendarEvent | null; confidence: 'high' | 'medium' | 'low' | null; reasoning?: string } {
    if (!events.length) {
      return { event: null, confidence: null, reasoning: 'No calendar events found for this date' };
    }

    console.log(`Matching expense: ${expense.memo} (${expense.purchased_at}) at ${expense.location_name}`);
    console.log(`Against ${events.length} calendar events`);

    const expenseMemo = expense.memo?.toLowerCase() || '';
    const expenseLocation = expense.location_name?.toLowerCase() || '';
    const expenseUserEmail = expense.user_email?.toLowerCase() || '';

    let bestMatch: CalendarEvent | null = null;
    let bestConfidence: 'high' | 'medium' | 'low' | null = null;
    let bestScore = 0;
    let bestReasoning = '';

    for (const event of events) {
      let score = 0;
      let confidence: 'high' | 'medium' | 'low' = 'low';
      let reasoning: string[] = [];

      const eventSummary = event.summary?.toLowerCase() || '';
      const eventDescription = event.description?.toLowerCase() || '';
      const eventLocation = event.location?.toLowerCase() || '';
      const isUserCalendar = (event as any).isUserCalendar;
      const calendarSource = (event as any).calendarSource;

      console.log(`  Checking event: "${event.summary}" from ${calendarSource}`);

      // 1. EXACT LOCATION MATCHING (highest priority)
      if (expenseLocation && eventLocation) {
        // Conference/venue matching
        if (expenseLocation.includes('conference') && eventLocation.includes('conference')) {
          score += 40;
          reasoning.push('Conference location match');
          confidence = 'high';
        }
        // Restaurant/dining location matching
        else if (this.isLocationMatch(expenseLocation, eventLocation)) {
          score += 35;
          reasoning.push('Location match');
          confidence = 'high';
        }
        // Country/city matching
        else if (this.isBroadLocationMatch(expenseLocation, eventLocation)) {
          score += 20;
          reasoning.push('Broad location match');
          confidence = 'medium';
        }
      }

      // 2. MEMO CONTENT ANALYSIS
      const memoScore = this.analyzeMemoMatch(expenseMemo, eventSummary, eventDescription);
      score += memoScore.score;
      if (memoScore.reasoning) reasoning.push(memoScore.reasoning);
      if (memoScore.confidence === 'high') confidence = 'high';
      else if (memoScore.confidence === 'medium' && confidence !== 'high') confidence = 'medium';

      // 3. MEAL/DINING CONTEXT
      const mealScore = this.analyzeMealContext(expenseMemo, eventSummary, event);
      score += mealScore.score;
      if (mealScore.reasoning) reasoning.push(mealScore.reasoning);
      if (mealScore.confidence === 'high') confidence = 'high';
      else if (mealScore.confidence === 'medium' && confidence !== 'high') confidence = 'medium';

      // 4. BUSINESS CONTEXT (conferences, meetings, travel)
      const businessScore = this.analyzeBusinessContext(expenseMemo, eventSummary, eventDescription);
      score += businessScore.score;
      if (businessScore.reasoning) reasoning.push(businessScore.reasoning);
      if (businessScore.confidence === 'high') confidence = 'high';
      else if (businessScore.confidence === 'medium' && confidence !== 'high') confidence = 'medium';

      // 5. CALENDAR SOURCE BONUS
      if (isUserCalendar) {
        score += 5;
        reasoning.push('User personal calendar');
      } else if (calendarSource?.includes('marketing')) {
        score += 8;
        reasoning.push('Marketing calendar event');
      } else if (calendarSource?.includes('team')) {
        score += 6;
        reasoning.push('Team calendar event');
      }

      console.log(`    Score: ${score}, Confidence: ${confidence}, Reasoning: ${reasoning.join(', ')}`);

      if (score > bestScore) {
        bestScore = score;
        bestMatch = event;
        bestConfidence = confidence;
        bestReasoning = reasoning.join('; ');
      }
    }

    // Minimum threshold for matching
    if (bestScore >= 20) {
      console.log(`Best match: "${bestMatch?.summary}" with score ${bestScore}`);
      return {
        event: bestMatch,
        confidence: bestConfidence,
        reasoning: bestReasoning
      };
    }

    console.log(`No good matches found (best score: ${bestScore})`);
    return {
      event: null,
      confidence: null,
      reasoning: `No strong matches found (best score: ${bestScore})`
    };
  }

  private isLocationMatch(expenseLocation: string, eventLocation: string): boolean {
    // Restaurant/venue name matching
    const expenseWords = expenseLocation.split(/\s+|[,.-]/);
    const eventWords = eventLocation.split(/\s+|[,.-]/);

    // Check for common venue names
    for (const expWord of expenseWords) {
      if (expWord.length > 3) {
        for (const eventWord of eventWords) {
          if (eventWord.includes(expWord) || expWord.includes(eventWord)) {
            return true;
          }
        }
      }
    }
    return false;
  }

  private isBroadLocationMatch(expenseLocation: string, eventLocation: string): boolean {
    // Country, state, city matching
    const broadTerms = ['us', 'usa', 'united states', 'california', 'ca', 'san francisco', 'sf', 'new york', 'ny'];

    for (const term of broadTerms) {
      if (expenseLocation.includes(term) && eventLocation.includes(term)) {
        return true;
      }
    }
    return false;
  }

  private analyzeMemoMatch(memo: string, summary: string, description: string) {
    let score = 0;
    let confidence: 'high' | 'medium' | 'low' = 'low';
    let reasoning = '';

    // Extract meaningful words (>3 characters, not common words)
    const commonWords = ['the', 'and', 'with', 'for', 'from', 'this', 'that', 'your', 'our'];
    const memoWords = memo.split(/\s+/).filter(word =>
      word.length > 3 && !commonWords.includes(word.toLowerCase())
    );
    const summaryWords = (summary + ' ' + description).split(/\s+/).filter(word =>
      word.length > 3 && !commonWords.includes(word.toLowerCase())
    );

    // Check for exact word matches
    const matchedWords = memoWords.filter(memoWord =>
      summaryWords.some(summaryWord =>
        summaryWord.toLowerCase().includes(memoWord.toLowerCase()) ||
        memoWord.toLowerCase().includes(summaryWord.toLowerCase())
      )
    );

    if (matchedWords.length >= 2) {
      score += 25;
      confidence = 'high';
      reasoning = `Strong text match: ${matchedWords.join(', ')}`;
    } else if (matchedWords.length === 1) {
      score += 15;
      confidence = 'medium';
      reasoning = `Text match: ${matchedWords[0]}`;
    }

    return { score, confidence, reasoning };
  }

  private analyzeMealContext(memo: string, summary: string, event: any) {
    let score = 0;
    let confidence: 'high' | 'medium' | 'low' = 'low';
    let reasoning = '';

    const mealKeywords = ['dinner', 'lunch', 'breakfast', 'meal', 'restaurant', 'food', 'eat'];
    const eventKeywords = ['meeting', 'conference', 'team', 'client', 'sync', 'networking'];

    const hasMealKeyword = mealKeywords.some(keyword => memo.includes(keyword));
    const hasEventKeyword = eventKeywords.some(keyword => summary.includes(keyword));

    if (hasMealKeyword && hasEventKeyword) {
      const eventStart = new Date(event.start?.dateTime || event.start?.date || '');
      const eventHour = eventStart.getHours();

      // Check if it's during typical meal times
      if ((eventHour >= 7 && eventHour <= 10) || // Breakfast
          (eventHour >= 11 && eventHour <= 14) || // Lunch
          (eventHour >= 17 && eventHour <= 21)) { // Dinner
        score += 30;
        confidence = 'high';
        reasoning = 'Meal expense during meeting time';
      } else {
        score += 20;
        confidence = 'medium';
        reasoning = 'Meal expense with meeting event';
      }
    }

    return { score, confidence, reasoning };
  }

  private analyzeBusinessContext(memo: string, summary: string, description: string) {
    let score = 0;
    let confidence: 'high' | 'medium' | 'low' = 'low';
    let reasoning = '';

    const businessContexts = {
      'conference': ['conference', 'summit', 'expo', 'convention'],
      'travel': ['travel', 'trip', 'flight', 'uber', 'taxi', 'hotel'],
      'client': ['client', 'customer', 'prospect', 'demo'],
      'team': ['team', 'all-hands', 'offsite', 'retreat']
    };

    for (const [context, keywords] of Object.entries(businessContexts)) {
      const memoHasContext = keywords.some(keyword => memo.includes(keyword));
      const eventHasContext = keywords.some(keyword =>
        summary.includes(keyword) || description.includes(keyword)
      );

      if (memoHasContext && eventHasContext) {
        score += 25;
        confidence = 'high';
        reasoning = `${context} context match`;
        break;
      } else if (memoHasContext || eventHasContext) {
        score += 10;
        confidence = 'medium';
        reasoning = `Partial ${context} context`;
      }
    }

    return { score, confidence, reasoning };
  }

  /**
   * Enrich expenses with calendar data using multi-day aware matching
   */
  async enrichExpensesWithCalendar(expenses: any[]): Promise<ExpenseWithCalendar[]> {
    const enrichedExpenses: ExpenseWithCalendar[] = [];

    for (const expense of expenses) {
      try {
        console.log(`\n🔍 Processing expense: ${expense.memo} (${expense.purchased_at})`);

        // Try multi-day matching first (looks at 7-day window)
        const multiDayMatch = await this.matchExpenseWithMultiDayEvents(expense, expense.user_email);

        let finalMatch = multiDayMatch;

        // If multi-day matching didn't find a good match, fall back to single-day matching
        if (!multiDayMatch.event || !multiDayMatch.confidence || multiDayMatch.confidence === 'low') {
          console.log(`  📅 Fallback to single-day matching...`);
          const events = await this.getEventsForDate(expense.user_email, expense.purchased_at);
          const singleDayMatch = this.matchExpenseWithCalendar(expense, events);

          // Use single-day match if it's better than multi-day match
          if (singleDayMatch.event && singleDayMatch.confidence) {
            const multiDayScore = this.getConfidenceScore(multiDayMatch.confidence || 'low');
            const singleDayScore = this.getConfidenceScore(singleDayMatch.confidence);

            if (singleDayScore > multiDayScore) {
              finalMatch = {
                ...singleDayMatch,
                reasoning: `Single-day match: ${singleDayMatch.reasoning}`
              };
              console.log(`  ✅ Using single-day match (better score)`);
            }
          }
        } else {
          console.log(`  ✅ Using multi-day match`);
        }

        enrichedExpenses.push({
          ...expense,
          calendar_event: finalMatch.event,
          calendar_match_confidence: finalMatch.confidence,
          calendar_match_reasoning: finalMatch.reasoning,
        });

        console.log(`  📊 Final result: ${finalMatch.confidence || 'NONE'} - "${finalMatch.event?.summary || 'No match'}"`);

      } catch (error) {
        console.error(`❌ Error enriching expense with calendar data:`, error);
        // Add expense without calendar data if there's an error
        enrichedExpenses.push({
          ...expense,
          calendar_event: undefined,
          calendar_match_confidence: undefined,
          calendar_match_reasoning: 'Error occurred during matching',
        });
      }
    }

    return enrichedExpenses;
  }
}

/**
 * Helper function to format calendar event for display
 */
export function formatCalendarEvent(event: CalendarEvent): string {
  if (!event) return 'No matching event';

  const startTime = event.start.dateTime
    ? new Date(event.start.dateTime).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit'
      })
    : 'All day';

  return `${event.summary} (${startTime})`;
}