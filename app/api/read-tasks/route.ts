import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabaseClient'

export async function POST(req: Request) {
  try {
    const { project_id, user_email } = await req.json()

    if (!project_id || !user_email) {
      return NextResponse.json(
        { error: 'Missing project_id or user_email.' },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('project_id', project_id)
      .eq('user_email', user_email)

    if (error) {
      console.error('Supabase fetch error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data, { status: 200 })
  } catch (err) {
    console.error('API Error:', err)
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    )
  }
} 