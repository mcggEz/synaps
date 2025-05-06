import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabaseClient'

export async function POST(req: Request) {
  try {
    const { user_email } = await req.json()

    if (!user_email) {
      return NextResponse.json(
        { error: 'Missing user_email.' },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('user_email', user_email)

    if (error) {
      console.error('Supabase fetch error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data, { status: 200 }) // ✅ Return all projects
  } catch (err) {
    console.error('API Error:', err)
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    )
  }
}
