import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function cleanupGuests() {
  try {
    // Get all guest users created more than 24 hours ago
    const { data: oldGuests, error: fetchError } = await supabase
      .from('auth.users')
      .select('id, email, raw_user_meta_data')
      .eq('raw_user_meta_data->is_guest', true)
      .lt('raw_user_meta_data->guest_created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

    if (fetchError) {
      console.error('Error fetching old guest users:', fetchError);
      return;
    }

    console.log(`Found ${oldGuests?.length || 0} old guest accounts to clean up`);

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
          continue;
        }

        // Delete the guest user account from auth
        const { error: deleteUserError } = await supabase.auth.admin.deleteUser(guest.id);
        
        if (deleteUserError) {
          console.error(`Error deleting guest user ${guest.email}:`, deleteUserError);
        } else {
          console.log(`Successfully deleted guest account ${guest.email}`);
        }
      } catch (error) {
        console.error(`Error processing guest ${guest.email}:`, error);
      }
    }

    console.log('Guest cleanup completed');
  } catch (error) {
    console.error('Error in guest cleanup:', error);
  }
}

// Run cleanup every 6 hours
setInterval(cleanupGuests, 6 * 60 * 60 * 1000);

// Run initial cleanup
cleanupGuests(); 