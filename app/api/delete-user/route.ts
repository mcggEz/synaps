import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'

import { NextResponse } from 'next/server'

import { supabase } from '@/lib/supabaseClient'

export async function DELETE(request: Request) {
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Delete user data from your tables first (if any)
    const { error: deleteDataError } = await supabase
      .from('your_table_name')
      .delete()
      .eq('user_id', user.id)

    if (deleteDataError) {
      return NextResponse.json({ error: 'Failed to delete user data' }, { status: 500 })
    }

    // Delete the user from Supabase Auth
    const { error: deleteUserError } = await supabase.auth.admin.deleteUser(user.id)

    if (deleteUserError) {
      return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 })
    }

    return NextResponse.json({ message: 'User deleted successfully' })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 