import { test, expect } from '@playwright/test'

function uniqueEmail(prefix = 'e2e') {
  const ts = Date.now()
  return `${prefix}+${ts}@example.com`
}

test('signup happy path (job seeker)', async ({ page, baseURL }) => {
  const email = uniqueEmail('jobseeker')
  await page.goto(`${baseURL}/auth/signup`)

  // Choose Job Seeker role
  await page.getByText('Job Seeker').click()

  // Fill form
  await page.getByLabel('Full Name').fill('Jane Doe')
  await page.getByLabel('Email').fill(email)
  await page.getByLabel('Password').fill('password123')

  await page.getByRole('button', { name: 'Create Account' }).click()

  // Wait for success card OR redirect to /auth/login
  await Promise.race([
    page.waitForURL('**/auth/login', { timeout: 15_000 }),
    page.getByText(/Account created successfully/i).waitFor({ timeout: 15_000 }),
    page.getByText(/Success!/i).waitFor({ timeout: 15_000 }),
  ])
})

test('signup happy path (employer)', async ({ page, baseURL }) => {
  const email = uniqueEmail('employer')
  await page.goto(`${baseURL}/auth/signup`)

  // Choose Employer role
  await page.getByText('Employer').click()

  // Fill employer fields
  await page.getByLabel('Company Name').fill('E2E Test Co')
  await page.getByLabel('Your Full Name').fill('John Employer')
  await page.getByLabel('Email').fill(email)
  await page.getByLabel('Password').fill('password123')

  await page.getByRole('button', { name: 'Create Account' }).click()

  await Promise.race([
    page.waitForURL('**/auth/login', { timeout: 15_000 }),
    page.getByText(/Account created successfully/i).waitFor({ timeout: 15_000 }),
    page.getByText(/Success!/i).waitFor({ timeout: 15_000 }),
  ])
})
