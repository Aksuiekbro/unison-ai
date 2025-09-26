import { test, expect } from '@playwright/test'

const EMAIL = process.env.E2E_EMAIL || ''
const PASSWORD = process.env.E2E_PASSWORD || ''

async function ensureUserWithAssessmentStatus(completed: boolean) {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
  const service = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !service || !EMAIL) return

  const { createClient } = await import('@supabase/supabase-js')
  const admin = createClient(url, service)

  // Ensure user exists and is confirmed
  let userId: string | undefined
  const { data: list1 } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 })
  userId = list1?.users.find(u => u.email?.toLowerCase() === EMAIL.toLowerCase())?.id

  if (!userId) {
    const { data } = await admin.auth.admin.createUser({
      email: EMAIL,
      password: PASSWORD,
      email_confirm: true,
      user_metadata: { role: 'job_seeker', full_name: 'E2E User' },
    })
    userId = data.user?.id
  } else {
    await admin.auth.admin.updateUserById(userId, {
      password: PASSWORD,
      email_confirm: true,
      user_metadata: { role: 'job_seeker', full_name: 'E2E User' },
    })
  }

  if (!userId) return

  // Update user table assessment flag (column must exist)
  await admin.from('users').update({ productivity_assessment_completed: completed }).eq('id', userId)
}

test('unauthenticated users are redirected to login', async ({ page, baseURL }) => {
  const url = baseURL || 'http://localhost:3000'

  await page.goto(`${url}/job-seeker/test`)

  // Expect redirect to login with redirectTo
  await page.waitForURL('**/auth/login**')
  expect(page.url()).toContain('/auth/login')
})

test('job seeker can complete minimal productivity assessment flow', async ({ page, baseURL }) => {
  test.skip(!EMAIL || !PASSWORD, 'E2E_EMAIL/E2E_PASSWORD are required')

  await ensureUserWithAssessmentStatus(false)

  const url = baseURL || 'http://localhost:3000'
  await page.goto(`${url}/auth/login`)

  await page.getByLabel('Email').fill(EMAIL)
  await page.getByLabel('Password').fill(PASSWORD)
  await page.getByRole('button', { name: 'Login' }).click()

  // Navigate to test page
  await page.goto(`${url}/job-seeker/test`)

  // Fill minimal required fields in work experience
  await page.getByPlaceholder('Название компании').fill('E2E Company')
  await page.getByPlaceholder('Ваша должность').fill('Developer')
  await page.getByLabel('Дата начала').fill('2024-01-01')

  // Go to the last tab (Оценка)
  await page.getByRole('tab', { name: 'Оценка' }).click()

  // Submit
  await page.getByRole('button', { name: 'Завершить оценку' }).click()

  // Expect redirect to results page
  await page.waitForURL('**/job-seeker/results')
  expect(page.url()).toMatch(/\/job-seeker\/results$/)
})

test('completed assessment redirects to results', async ({ page, baseURL }) => {
  test.skip(!EMAIL || !PASSWORD, 'E2E_EMAIL/E2E_PASSWORD are required')

  await ensureUserWithAssessmentStatus(true)

  const url = baseURL || 'http://localhost:3000'
  await page.goto(`${url}/auth/login`)

  await page.getByLabel('Email').fill(EMAIL)
  await page.getByLabel('Password').fill(PASSWORD)
  await page.getByRole('button', { name: 'Login' }).click()

  await page.goto(`${url}/job-seeker/test`)
  await page.waitForURL('**/job-seeker/results')
  expect(page.url()).toMatch(/\/job-seeker\/results$/)
})


