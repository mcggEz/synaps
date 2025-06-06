import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function DELETE(request: Request) {
  try {
    // Create a Supabase client with the service role key
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    const { user_id } = await request.json();
    console.log('Attempting to delete guest user:', user_id);

    if (!user_id) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // Delete the guest user account
    const { error: deleteUserError } = await supabase.auth.admin.deleteUser(user_id);

    if (deleteUserError) {
      console.error('Error deleting guest user:', deleteUserError);
      return NextResponse.json({ 
        error: 'Failed to delete guest user',
        details: deleteUserError.message 
      }, { status: 500 });
    }

    console.log('Successfully deleted guest user:', user_id);
    return NextResponse.json({ message: 'Guest user deleted successfully' });
  } catch (error) {
    console.error('Error in delete-guest:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 