'use server';

import { createClient } from '@supabase/supabase-js';
import { revalidatePath } from 'next/cache';

export async function deleteAccount(userId: string) {
  try {
    if (!userId) {
      throw new Error('User ID is required');
    }

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

    console.log('Attempting to delete user:', userId);

    // Delete the user's account
    const { error: deleteUserError } = await supabase.auth.admin.deleteUser(userId);

    if (deleteUserError) {
      console.error('Error deleting user:', deleteUserError);
      throw new Error(deleteUserError.message);
    }

    console.log('Successfully deleted user:', userId);
    revalidatePath('/');
    return { success: true, message: 'Account successfully deleted' };
  } catch (error) {
    console.error('Error in deleteAccount action:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to delete account'
    };
  }
} 