import { test, expect } from '@playwright/test'

const EMAIL = process.env.E2E_EMAIL || 'timeywimey65@gmail.com'
const PASSWORD = process.env.E2E_PASSWORD || ''

async function ensureUserExistsAndConfirmed() {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
  const service = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !service || !EMAIL || !PASSWORD) return
  const { createClient } = await import('@supabase/supabase-js')
  const admin = createClient(url, service)

  let userId: string | undefined
  const { data: list1 } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 })
  userId = list1?.users.find(u => u.email?.toLowerCase() === EMAIL.toLowerCase())?.id

  if (!userId) {
    await admin.auth.admin.createUser({
      email: EMAIL,
      password: PASSWORD,
      email_confirm: true,
      user_metadata: { role: 'job_seeker', full_name: 'E2E User' },
    })
  } else {
    await admin.auth.admin.updateUserById(userId, {
      password: PASSWORD,
      email_confirm: true,
      user_metadata: { role: 'job_seeker', full_name: 'E2E User' },
    })
  }
}

test('login redirects and does not show NEXT_REDIRECT', async ({ page, baseURL }) => {
  test.skip(!EMAIL || !PASSWORD, 'E2E_EMAIL/E2E_PASSWORD are required')

  await ensureUserExistsAndConfirmed()

  const url = baseURL || 'http://localhost:3000'
  await page.goto(`${url}/auth/login?redirectTo=/job-seeker/dashboard`)

  await page.getByLabel('Email').fill(EMAIL)
  await page.getByLabel('Password').fill(PASSWORD)
  await page.getByRole('button', { name: 'Login' }).click()

  // Expect redirect to dashboard and no NEXT_REDIRECT message
  await expect(page).toHaveURL(/\/(job-seeker|employer)\//, { timeout: 30000 })
  await expect(page.getByText('NEXT_REDIRECT').first()).toHaveCount(0)
})


