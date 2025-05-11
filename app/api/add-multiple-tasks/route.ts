import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient'

export async function POST(req: Request) {
  try {
    const { project_id, user_email, tasks } = await req.json();
    
    console.log('Received request:', { project_id, user_email, tasksCount: tasks?.length });

    if (!project_id || !user_email || !tasks || !Array.isArray(tasks)) {
      return NextResponse.json(
        { error: 'Missing required fields or invalid tasks array.' },
        { status: 400 }
      );
    }

    // Verify the user owns this project
    try {
      const { data: projectData, error: projectError } = await supabase
        .from('projects')
        .select('id')
        .eq('id', project_id)
        .eq('user_email', user_email)
        .single();

      console.log('Project verification:', { projectData, error: projectError?.message });

      if (projectError || !projectData) {
        return NextResponse.json(
          { error: 'Project not found or you do not have permission' },
          { status: 403 }
        );
      }
    } catch (verifyError: any) {
      console.error('Error verifying project:', verifyError);
      return NextResponse.json(
        { error: `Error verifying project: ${verifyError.message}` },
        { status: 500 }
      );
    }

    // Check the structure of the tasks table
    try {
      const { data: tableInfo, error: tableError } = await supabase
        .from('tasks')
        .select('*')
        .limit(1);
      
      console.log('Tasks table structure check:', { 
        hasData: !!tableInfo, 
        error: tableError?.message,
        columns: tableInfo && tableInfo.length > 0 ? Object.keys(tableInfo[0]) : []
      });
      
      if (tableError) {
        return NextResponse.json(
          { error: `Error accessing tasks table: ${tableError.message}` },
          { status: 500 }
        );
      }
    } catch (tableCheckError: any) {
      console.error('Error checking tasks table:', tableCheckError);
    }

    // Transform tasks to include deadline if provided
    const tasksToInsert = tasks.map((task: { title: string; deadline?: string }) => ({
      title: task.title,
      project_id,
      user_email,
      deadline: task.deadline || null,
      completed: false
    }));

    console.log('Preparing to insert tasks:', { 
      count: tasksToInsert.length,
      sampleTask: tasksToInsert.length > 0 ? tasksToInsert[0] : null
    });

    // Try inserting one task at a time to identify problematic tasks
    const results = [];
    const errors = [];

    for (const task of tasksToInsert) {
      try {
        const { data, error } = await supabase
          .from('tasks')
          .insert([task])
          .select();

        if (error) {
          console.error('Error adding task:', { task, error: error.message });
          errors.push({ task: task.title, error: error.message });
        } else {
          results.push(data[0]);
        }
      } catch (singleInsertError: any) {
        console.error('Exception adding task:', { task, error: singleInsertError.message });
        errors.push({ task: task.title, error: singleInsertError.message });
      }
    }

    if (errors.length > 0) {
      console.log('Some tasks failed to insert:', { 
        successCount: results.length, 
        errorCount: errors.length,
        errors
      });
      
      if (results.length === 0) {
        return NextResponse.json(
          { error: `Failed to add tasks: ${errors[0].error}` },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({ 
      success: true, 
      data: results,
      partialSuccess: errors.length > 0,
      errorCount: errors.length
    });
  } catch (err) {
    console.error('API Error:', err);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
} 