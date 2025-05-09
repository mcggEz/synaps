import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

// DELETE route
export async function DELETE(req: Request) {
  try {
    const { id, user_email } = await req.json();

    if (!id || !user_email) {
      return NextResponse.json(
        { error: 'Missing id or user_email.' },
        { status: 400 }
      );
    }

    // Delete the task
    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', id)
      .eq('user_email', user_email);

    if (error) {
      console.error('Supabase delete error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'Task deleted successfully' });
  } catch (err) {
    console.error('Server error in delete-task:', err);
    return NextResponse.json(
      { error: 'Server error', details: err },
      { status: 500 }
    );
  }
}

export async function PATCH(req: Request) {
  try {
    const { id, user_email, updateData } = await req.json();

    if (!id || !user_email) {
      return NextResponse.json(
        { error: 'Missing id or user_email.' },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from('tasks')
      .update(updateData)
      .eq('id', id)
      .eq('user_email', user_email);

    if (error) {
      console.error('Supabase update error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'Task updated successfully' });
  } catch (err) {
    console.error('Server error in update-task:', err);
    return NextResponse.json(
      { error: 'Server error', details: err },
      { status: 500 }
    );
  }
}
