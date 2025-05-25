import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

export async function DELETE(req: Request) {
  try {
    const { project_id, user_email } = await req.json();

    if (!project_id || !user_email) {
      return NextResponse.json(
        { error: 'Missing project_id or user_email.' },
        { status: 400 }
      );
    }

    // First, verify the user owns this project
    const { data: projectData, error: projectError } = await supabase
      .from('projects')
      .select('id')
      .eq('id', project_id)
      .eq('user_email', user_email)
      .single();

    if (projectError || !projectData) {
      return NextResponse.json(
        { error: 'Project not found or you do not have permission' },
        { status: 403 }
      );
    }

    // Delete all tasks for the project
    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('project_id', project_id)
      .eq('user_email', user_email);

    if (error) {
      console.error('Error deleting tasks:', error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      success: true,
      message: 'All tasks deleted successfully'
    });
  } catch (err) {
    console.error('Server error:', err);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
} 