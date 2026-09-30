import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'

const admin = createAdminClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function translateText(
  text: string
): Promise<{
  translatedText: string
  detectedSourceLang: string
}> {
  if (!text?.trim()) {
    return {
      translatedText: '',
      detectedSourceLang: '',
    }
  }

  const res = await fetch(
    `https://translation.googleapis.com/language/translate/v2?key=${process.env.GOOGLE_TRANSLATE_API_KEY}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        q: text,
        target: 'id',
        format: 'text',
      }),
    }
  )

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Google Translate error: ${err}`)
  }

  const data = await res.json()
  const result = data.data.translations[0]

  return {
    translatedText: result.translatedText,
    detectedSourceLang: result.detectedSourceLanguage,
  }
}

export async function POST(req: Request) {
  console.log('--- ALL INCOMING HEADERS ---');
  req.headers.forEach((value, key) => {
    console.log(`${key}: ${value}`);
  });
  console.log('----------------------------');

  const authHeader = req.headers.get('authorization');
  console.log('Authorization Header:', authHeader);

  let user = null;

  // 1. If Flutter sends a Bearer token, validate it directly
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    
    // Create an un-scoped Supabase client just for token validation
    const tokenSupabase = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
    );
    
    const { data, error } = await tokenSupabase.auth.getUser(token);
    if (!error && data?.user) {
      user = data.user;
    }
  } else {
    // 2. Fallback to standard web cookie client if no Bearer token is present
    const supabase = await createClient();
    const { data } = await supabase.auth.getUser();
    user = data?.user;
  }

  if (!user) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    )
  }

  try {
    const { ticketId } = await req.json()

    if (!ticketId) {
      return NextResponse.json(
        { error: 'ticketId is required' },
        { status: 400 }
      )
    }

    const { data: ticket, error: ticketError } = await admin
      .from('tickets')
      .select(`
        id,
        description,
        room_detail,
        location:location_id (
          name
        )
      `)
      .eq('id', ticketId)
      .single()

    if (ticketError || !ticket) {
      return NextResponse.json(
        { error: 'Ticket not found' },
        { status: 404 }
      )
    }

    const [
      descriptionResult,
      roomDetailResult,
    ] = await Promise.all([
      translateText(ticket.description ?? ''),
      translateText(ticket.room_detail ?? ''),
    ])

    // Nothing is saved to Supabase.
    // These results only exist for this request.
    return NextResponse.json({
      success: true,
      translations: {
        description: descriptionResult.translatedText,
        room_detail: roomDetailResult.translatedText,
      },
      detectedLanguages: {
        description: descriptionResult.detectedSourceLang,
        room_detail: roomDetailResult.detectedSourceLang,
      },
    })
  } catch (error: any) {
    console.error('Translate ticket error:', error)

    return NextResponse.json(
      {
        error:
          error?.message ??
          'Failed to translate ticket',
      },
      { status: 500 }
    )
  }
}