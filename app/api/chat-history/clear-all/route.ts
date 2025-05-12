import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

export async function DELETE(req: Request) {
  try {
    const { user_email } = await req.json();

    if (!user_email) {
      return NextResponse.json(
        { error: 'Missing user_email.' },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from('chat_history')
      .delete()
      .eq('user_email', user_email);

    if (error) {
      console.error('Supabase delete error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(
      { message: 'All chat history cleared successfully' },
      { status: 200 }
    );
  } catch (err) {
    console.error('API Error:', err);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
} 