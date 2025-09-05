import { test, expect } from '@playwright/test'

const EMAIL = process.env.E2E_EMAIL || ''
const PASSWORD = process.env.E2E_PASSWORD || ''

async function ensureUserExistsAndConfirmed() {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
  const service = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !service || !EMAIL || !PASSWORD) return
  const { createClient } = await import('@supabase/supabase-js')
  const admin = createClient(url, service)

  // Find user by email
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

test('prod login redirects to dashboard', async ({ page, baseURL }) => {
  test.skip(!EMAIL || !PASSWORD, 'E2E_EMAIL/E2E_PASSWORD are required')

  await ensureUserExistsAndConfirmed()

  const url = baseURL || 'https://unison-ai-alpha.vercel.app'
  await page.goto(`${url}/auth/login`)

  await page.getByLabel('Email').fill(EMAIL)
  await page.getByLabel('Password').fill(PASSWORD)
  await page.getByRole('button', { name: 'Login' }).click()

  // Wait for either success feedback or route change
  await Promise.race([
    page.getByText(/Login successful!/i).waitFor({ timeout: 15000 }),
    page.waitForURL('**/(job-seeker|employer)/**', { timeout: 20000 }) as any,
  ])

  // Then, expect redirect to a dashboard
  await Promise.race([
    page.waitForURL('**/job-seeker/**', { timeout: 20000 }),
    page.waitForURL('**/employer/**', { timeout: 20000 }),
  ])

  expect(page.url()).toMatch(/\/(job-seeker|employer)\//)
})


