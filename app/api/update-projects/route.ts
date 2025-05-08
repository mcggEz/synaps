import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

export async function PATCH(req: Request) {
    try {
      const { id, user_email, updateData } = await req.json();
  
      if (!id || !user_email || !updateData) {
        return NextResponse.json(
          { error: 'Missing id, user_email, or updateData.' },
          { status: 400 }
        );
      }
  
      const { error } = await supabase
        .from('projects')
        .update(updateData)
        .eq('id', id)
        .eq('user_email', user_email);
  
      if (error) {
        console.error('Supabase update error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
  
      return NextResponse.json({ success: true });
    } catch (err) {
      return NextResponse.json(
        { error: 'Server error', details: err },
        { status: 500 }
      );
    }
  }
  