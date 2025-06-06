import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function POST() {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    // Get all guest users created more than 24 hours ago
    const { data: oldGuests, error: fetchError } = await supabase
      .from('auth.users')
      .select('id, email, raw_user_meta_data')
      .eq('raw_user_meta_data->is_guest', true)
      .lt('raw_user_meta_data->guest_created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

    if (fetchError) {
      console.error('Error fetching old guest users:', fetchError);
      return NextResponse.json({ error: 'Failed to fetch guest users' }, { status: 500 });
    }

    let deletedCount = 0;
    let errorCount = 0;

    // Delete projects and tasks for each old guest
    for (const guest of oldGuests || []) {
      try {
        // Delete projects (tasks will be deleted automatically due to CASCADE)
        const { error: deleteError } = await supabase
          .from('projects')
          .delete()
          .eq('user_email', guest.email);

        if (deleteError) {
          console.error(`Error deleting data for guest ${guest.email}:`, deleteError);
          errorCount++;
          continue;
        }

        // Delete the guest user account from auth
        const { error: deleteUserError } = await supabase.auth.admin.deleteUser(guest.id);
        
        if (deleteUserError) {
          console.error(`Error deleting guest user ${guest.email}:`, deleteUserError);
          errorCount++;
        } else {
          deletedCount++;
        }
      } catch (error) {
        console.error(`Error processing guest ${guest.email}:`, error);
        errorCount++;
      }
    }

    return NextResponse.json({ 
      message: 'Guest cleanup completed',
      cleanedGuests: deletedCount,
      errors: errorCount
    });
  } catch (error) {
    console.error('Error in guest cleanup:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 