import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

export async function POST(req: Request) {
  try {
    const { project_id, user_email, message } = await req.json();
    console.log('Saving chat message:', { project_id, user_email, message });

    if (!project_id || !user_email || !message) {
      return NextResponse.json(
        { error: 'Missing required fields.' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('chat_history')
      .insert({
        project_id,
        user_email,
        sender: message.sender,
        text: message.text,
        timestamp: message.timestamp,
      })
      .select();

    if (error) {
      console.error('Supabase insert error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    console.log('Saved chat message:', data[0]);
    return NextResponse.json(data[0], { status: 201 });
  } catch (err) {
    console.error('API Error:', err);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const project_id = searchParams.get('project_id');
    const user_email = searchParams.get('user_email');

    console.log('Fetching chat history for:', { project_id, user_email });

    if (!project_id || !user_email) {
      return NextResponse.json(
        { error: 'Missing project_id or user_email.' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('chat_history')
      .select('*')
      .eq('project_id', project_id)
      .eq('user_email', user_email)
      .order('timestamp', { ascending: true });

    if (error) {
      console.error('Supabase fetch error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    console.log('Retrieved chat history:', data);
    return NextResponse.json(data, { status: 200 });
  } catch (err) {
    console.error('API Error:', err);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const project_id = searchParams.get('project_id');
    const user_email = searchParams.get('user_email');

    if (!project_id || !user_email) {
      return NextResponse.json(
        { error: 'Missing project_id or user_email.' },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from('chat_history')
      .delete()
      .eq('project_id', project_id)
      .eq('user_email', user_email);

    if (error) {
      console.error('Supabase delete error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ message: 'Chat history cleared successfully' }, { status: 200 });
  } catch (err) {
    console.error('API Error:', err);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
} 