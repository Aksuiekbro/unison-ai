import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function GET() {
  try {
    const supa = await createClient()
    const { data: { user } } = await supa.auth.getUser()

    // Check admin connectivity
    let adminOk = false
    try {
      const { error: adminError } = await supabaseAdmin.from('users').select('id').limit(1)
      adminOk = !adminError
    } catch {
      adminOk = false
    }

    // Fetch application user row/role if logged in
    let profile: { id: string; email: string; role: string | null } | null = null
    if (user) {
      const { data: userRow } = await supabaseAdmin
        .from('users')
        .select('id,email,role')
        .eq('id', user.id)
        .single()
      profile = userRow ?? null
    }

    return NextResponse.json({
      user: user ? { id: user.id, email: user.email } : null,
      profile,
      adminOk,
      env: {
        PUBLIC_URL: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
        PUBLIC_ANON: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        SRV_URL: !!process.env.SUPABASE_URL,
        SRV_KEY: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
        STAGEWISE_ENABLED: process.env.NEXT_PUBLIC_STAGEWISE_ENABLED === 'true',
      }
    })
  } catch (error) {
    return NextResponse.json({ success: false, error: 'debug endpoint failed' }, { status: 500 })
  }
}


