import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CalendarEventRequest {
  appointmentId: string;
  professionalEmail: string;
  clientEmail: string;
  appointmentDate: string;
  appointmentTime: string;
  professionalName: string;
  clientName: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Google Calendar Integration - Starting');

    // ============================================
    // PASO 1: Aquí van tus credenciales de Google
    // ============================================
    const GOOGLE_CLIENT_ID = Deno.env.get('GOOGLE_CLIENT_ID');
    const GOOGLE_CLIENT_SECRET = Deno.env.get('GOOGLE_CLIENT_SECRET');
    const GOOGLE_REFRESH_TOKEN = Deno.env.get('GOOGLE_REFRESH_TOKEN');

    if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET || !GOOGLE_REFRESH_TOKEN) {
      throw new Error('Missing Google Calendar credentials');
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const eventData: CalendarEventRequest = await req.json();
    console.log('Event data received:', eventData);

    // Step 1: Get access token using refresh token
    console.log('Requesting access token from Google...');
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_CLIENT_SECRET,
        refresh_token: GOOGLE_REFRESH_TOKEN,
        grant_type: 'refresh_token',
      }),
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error('Token error:', errorText);
      throw new Error(`Failed to get access token: ${errorText}`);
    }

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;
    console.log('Access token obtained successfully');

    // Step 2: Create calendar event
    const startDateTime = `${eventData.appointmentDate}T${eventData.appointmentTime}:00`;
    const endTime = new Date(startDateTime);
    endTime.setHours(endTime.getHours() + 1); // 1 hour appointment
    const endDateTime = endTime.toISOString().slice(0, 19);

    const calendarEvent = {
      summary: `Cita: ${eventData.clientName} - ${eventData.professionalName}`,
      description: `Cita programada a través de la plataforma`,
      start: {
        dateTime: startDateTime,
        timeZone: 'America/Mexico_City', // Ajusta según tu zona horaria
      },
      end: {
        dateTime: endDateTime,
        timeZone: 'America/Mexico_City',
      },
      attendees: [
        { email: eventData.professionalEmail },
        { email: eventData.clientEmail },
      ],
      reminders: {
        useDefault: false,
        overrides: [
          { method: 'email', minutes: 24 * 60 }, // 1 day before
          { method: 'popup', minutes: 60 }, // 1 hour before
        ],
      },
    };

    console.log('Creating calendar event...');
    const calendarResponse = await fetch(
      'https://www.googleapis.com/calendar/v3/calendars/primary/events',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(calendarEvent),
      }
    );

    if (!calendarResponse.ok) {
      const errorText = await calendarResponse.text();
      console.error('Calendar API error:', errorText);
      throw new Error(`Failed to create calendar event: ${errorText}`);
    }

    const createdEvent = await calendarResponse.json();
    console.log('Calendar event created:', createdEvent.id);

    // Step 3: Update appointment with Google Calendar event ID
    const { error: updateError } = await supabase
      .from('appointments')
      .update({ google_event_id: createdEvent.id })
      .eq('id', eventData.appointmentId);

    if (updateError) {
      console.error('Failed to update appointment:', updateError);
      throw updateError;
    }

    console.log('Appointment updated with Google event ID');

    return new Response(
      JSON.stringify({
        success: true,
        eventId: createdEvent.id,
        eventLink: createdEvent.htmlLink,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error in google-calendar-integration:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(
      JSON.stringify({
        success: false,
        error: errorMessage,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
