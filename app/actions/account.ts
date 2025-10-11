"use server"

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase-server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function deleteAccount() {
  const supabase = await createClient()

  // Identify the currently authenticated user via cookies
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return { success: false, message: 'Not authenticated' }
  }

  // Delete the user from Supabase Auth; ON DELETE CASCADE removes all related rows in public.*
  const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(user.id)
  if (deleteError) {
    return { success: false, message: deleteError.message || 'Failed to delete account' }
  }

  // Clear the session cookies for this user
  try {
    await supabase.auth.signOut()
  } catch {
    // Ignore sign-out failures; user is already deleted
  }

  // Redirect to home after deletion (handled by Next.js server actions)
  redirect('/')
}


