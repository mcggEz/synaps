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

    // First, verify the user owns this project
    const { data: projectData, error: projectError } = await supabase
      .from('projects')
      .select('id')
      .eq('id', id)
      .eq('user_email', user_email)
      .single();

    if (projectError || !projectData) {
      return NextResponse.json(
        { error: 'Project not found or you do not have permission' },
        { status: 403 }
      );
    }

    // Explicitly delete tasks first (though this should happen automatically with ON DELETE CASCADE)
    const { error: tasksError } = await supabase
      .from('tasks')
      .delete()
      .eq('project_id', id)
      .eq('user_email', user_email);

    if (tasksError) {
      console.error('Error deleting tasks:', tasksError);
      // Continue anyway, as we still want to try deleting the project
    }

    // Now delete the project
    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('id', id)
      .eq('user_email', user_email);

    if (error) {
      console.error('Supabase delete error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true,
      message: 'Project and all associated tasks deleted successfully'
    });
  } catch (err) {
    console.error('Server error in delete-projects:', err);
    return NextResponse.json(
      { error: 'Server error', details: err },
      { status: 500 }
    );
  }
}
