'use server'

import { createClient } from '@supabase/supabase-js'

export async function deleteAccount(userId: string) {
  if (!userId) {
    return { success: false, error: 'User ID is required' }
  }

  try {
    console.log('Attempting to delete user:', userId)
    
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Delete the user
    const { error: deleteError } = await supabase.auth.admin.deleteUser(userId)
    
    if (deleteError) {
      console.error('Error deleting user:', deleteError)
      throw deleteError
    }

    console.log('Successfully deleted user:', userId)
    return { success: true }
  } catch (error) {
    console.error('Error in deleteAccount:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to delete account'
    }
  }
} 