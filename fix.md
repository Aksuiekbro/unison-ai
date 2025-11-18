Next steps

Split signup into two concrete routes or keep the shared form but add dedicated entry points per requirement, and wire “Forgot password” to Supabase Auth reset emails.
After Gemini parsing, present a diff/checkbox list so job seekers confirm each field before calling updateJobSeekerProfile.
Employer Candidate Page – PRD

1. Problem & Goal
- Problem: The current employer candidate page uses mock data and does not reflect real candidates, their applications, AI personality analysis, or AI match scores. Employers cannot reliably assess real applicants, open resumes, or prioritize by fit.
- Goal: Replace the mock employer candidate page with a production-ready experience powered by real Supabase data (users, applications, personality_analysis, match_scores), including resume access and match-score-driven sorting so employers can quickly identify the best candidates.

2. Scope
- In scope:
  - Replace the mock candidate detail page under the employer dashboard with a real, data-driven view.
  - Read candidate core profile from `public.users` (job_seeker role).
  - Read application data from `public.applications` (status, cover_letter, resume_url, notes, applied_at).
  - Read AI personality results from `public.personality_analysis`.
  - Read AI match scores from `public.match_scores` (overall_score + component scores).
  - Show resume links/buttons that open the candidate resume (from `applications.resume_url` or fallback to `users.resume_url`).
  - Add match-score-based sorting and display on the job’s candidates list page.
  - Wire list → detail navigation from the job’s candidates list to the candidate detail page.
- Out of scope:
  - New AI pipelines for generating personality_analysis or match_scores (reuse existing flows).
  - Major redesign of employer dashboard navigation, theming, or global layout.
  - Candidate-side UX changes beyond what is required to support data presence.

3. Users & Use Cases
- Primary user: Employer (role `employer`, authenticated, owner of a company and its jobs).
- Secondary: Internal admin/operators (if any) with elevated access; they should see similar views but are not the primary design target.

Core use cases:
1) View candidate details for a specific application
   - As an employer, I open a job, then the candidates list, and click into a candidate’s profile.
   - I see: full name, current job title, location, contact info, basic bio, and key skills.
   - I see application-specific info: applied date, status, cover letter, internal notes.
   - I see a button to open the candidate’s resume in a new tab.
   - I see AI-generated personality insights and match scores to help me decide whether to proceed.

2) Compare candidates for a job using match score
   - As an employer, I view the list of candidates for a given job.
   - I can sort candidates by AI match score (highest to lowest).
   - Candidates without a match score are still shown but appear after those with a score.
   - I can still filter by status and search by name/email as today.

3) Navigate quickly between candidates
   - From the candidates list page, I can click “View profile” (or equivalent) to open the candidate’s detail page.
   - From the candidate detail page, I can navigate back to the job’s candidates list.

4. Data Model & Sources
- Users (`public.users`):
  - Key fields: `id`, `role`, `full_name`, `email`, `phone`, `location`, `bio`, `current_job_title`, `resume_url`, `linkedin_url`, `github_url`, `portfolio_url`, `experiences`, `educations`, `skills`.
  - Only users with `role = 'job_seeker'` are candidates.
- Applications (`public.applications`):
  - Key fields: `id`, `job_id`, `applicant_id`, `status`, `cover_letter`, `resume_url`, `notes`, `match_score_id`, `applied_at`, `updated_at`.
  - Business rule: One application per `(job_id, applicant_id)` (unique constraint).
  - Resume URL priority: use `applications.resume_url` if present; otherwise fallback to `users.resume_url`.
- Match scores (`public.match_scores`):
  - Key fields: `id`, `job_id`, `candidate_id`, `overall_score`, `skills_match_score`, `experience_match_score`, `culture_fit_score`, `personality_match_score`, `match_explanation`, `strengths`, `potential_concerns`, `ai_confidence_score`, `analysis_version`, `created_at`, `updated_at`.
  - Association: `applications.match_score_id` or by `(match_scores.job_id, match_scores.candidate_id = applications.applicant_id)`.
  - Used for: candidate list sorting and detail view “match score” visualization.
- Personality analysis (`public.personality_analysis`):
  - Key fields: `id`, `user_id`, `problem_solving_style`, `initiative_level`, `work_preference`, `motivational_factors`, `growth_areas`, `communication_style`, `leadership_potential`, `analytical_score`, `creative_score`, `leadership_score`, `teamwork_score`, `trait_scores`, `ai_confidence_score`, `analysis_version`, `created_at`, `updated_at`, `UNIQUE(user_id)`.
  - Association: `personality_analysis.user_id = users.id`.
  - Used for: candidate detail page “soft skills / personality” section.

5. Functional Requirements

5.1 Candidate Detail Page (Employer)
- Route & identity:
  - The existing mock candidate page under `app/employer/candidates/[id]/page.tsx` must be replaced.
  - `[id]` will represent a specific application identifier, or we will migrate to a more explicit route (e.g., `/employer/jobs/[jobId]/candidates/[applicationId]`); the implementation must pick one and be consistent between list and detail pages.
- Data fetching:
  - The candidate detail page must be data-driven, not mock-based.
  - It must fetch:
    - Application data for the given application ID.
    - The applicant’s user profile (`public.users`).
    - The associated match score entry (`public.match_scores`) if it exists.
    - The applicant’s personality analysis (`public.personality_analysis`) if it exists.
  - This logic should be encapsulated in a server-side function (e.g., `getApplicationWithDetails`) that:
    - Validates that the requesting employer owns the job (via company ownership).
    - Returns a single consolidated view model used by the page.
- UI presentation:
  - Above-the-fold header must show:
    - Avatar / initials, full name.
    - Current job title.
    - Location.
    - Email and phone (if available).
  - The page must show:
    - Application meta: status, applied_at (localized), and notes (if any).
    - Resume button: “Открыть резюме” or similar, which opens `resumeUrl` in a new tab.
    - Summary / bio text (from `users.bio` and/or resume parsing summary if available).
    - Structured sections for:
      - Work experience (from `users.experiences`).
      - Education (from `users.educations`).
      - Skills (from `users.skills` and/or `user_skills` relation).
  - AI sections:
    - Match score:
      - Display `overall_score` prominently (0–100%) for this job.
      - If available, also show component scores (skills, experience, culture, personality) as sub-metrics or progress bars.
      - Display `match_explanation` (if present) as a short paragraph and optionally render bullet lists for `strengths` and `potential_concerns`.
    - Personality analysis:
      - Display key scores (`analytical_score`, `leadership_score`, `teamwork_score`, etc.) as progress bars or chips.
      - Show short textual descriptions for `problem_solving_style`, `work_preference`, `growth_areas`, etc.

5.2 Candidates List Page (per Job)
- Data:
  - Extend the existing candidates list (currently under `app/employer/jobs/[id]/candidates/page.tsx` using `useJobApplications`) to receive:
    - Applications data including applicant basic profile.
    - A `matchScore` value per application, if available.
  - Server-side:
    - Add a function (e.g., `getJobApplicationsWithMatchScores(jobId, employerId)`) that:
      - Fetches applications for that job with their applicants (as today).
      - Joins or queries `match_scores` for each `(job_id, applicant_id)` pair or via `match_score_id`.
      - Returns applications augmented with `matchScore` (overall_score) and optionally a small breakdown.
    - Update the API route `/api/employer/jobs/[jobId]/applications` to use this new function and include match scores in the response.
- Sorting:
  - Add a sorting control (Select) on the candidates list page.
  - Sorting options must include:
    - “По совместимости” (by match score).
    - At least one existing option (e.g., by application date).
  - When “По совместимости” is selected:
    - Sort candidates descending by `matchScore` (highest first).
    - Applications without `matchScore` appear after those with scores, but remain visible.
  - Sorting must apply after any status or search filters.
- Resume link:
  - For each application, if a resume URL exists:
    - Render a “Резюме” button that links to the resume and opens in a new tab.
  - Use the same resume prioritization rule as the detail page (application-level first, then user-level).
- Navigation to detail:
  - The “Просмотр профиля” action on each candidate row should:
    - Navigate to the candidate detail page for that application.
    - Pass the correct identifier (applicationId or jobId+candidateId) to match the detail route.

5.3 Access Control & Security
- The employer must only see applications for jobs belonging to companies they own.
- All new queries must respect existing Supabase RLS policies:
  - `applications`: employers can see applications for their jobs only.
  - `users`: employers see job seeker profiles only via join to their jobs’ applications.
  - `personality_analysis` and `match_scores`: employers see data only for job seekers who applied to their jobs.
- If access checks fail (e.g., invalid jobId or employer mismatch), the server function should return an error and the page should render an appropriate error state (e.g., “Доступ запрещен” or “Заявка не найдена”).

6. Non-Functional Requirements
- Performance:
  - Candidate detail page data loading should complete within ~1–2 seconds under typical conditions.
  - Candidates list sorting should be done on the client over the already-fetched dataset; no extra round trip is required just to change sort order.
  - Server-side data functions should minimize N+1 queries (e.g., join match_scores in a single query where possible).
- Reliability:
  - The UI must handle missing data gracefully:
    - If no match score exists yet, show a neutral “AI анализ еще не готов” state instead of crashing.
    - If no personality_analysis exists, hide that section or show an empty state message.
  - If resume URL is missing, the resume button should not appear.
- UX/Design:
  - Follow existing typography, spacing, and colors from the current employer dashboard components.
  - Maintain mobile responsiveness at least at the same level as the rest of the employer dashboard.

7. Edge Cases & Error Handling
- Application exists but user profile partially filled:
  - Show whatever fields are available, omit missing ones without breaking layout.
- No match score yet:
  - Candidates list: show “N/A” or a subtle placeholder in the match score area; still allow sorting but treat `null` scores as lowest.
  - Detail page: show an informational banner that AI analysis is pending.
- No personality_analysis:
  - Hide the personality section or show a text: “Анализ личности еще не выполнен”.
- Orphaned match_scores or personality_analysis rows:
  - If a match_score or personality_analysis exists without a valid application or user row (should be rare), ignore it in the UI.
- Supabase/network error:
  - Display a user-friendly error message and a link back to `/employer/jobs`.

8. Success Metrics
- Adoption:
  - % of employers who view at least one candidate detail page per week.
  - % of candidate views that include at least one AI section (match score or personality_analysis).
- Efficiency:
  - Average time from employer opening the job candidates list to making a status change (e.g., moving a candidate to “interview” or “rejected”) should decrease compared to baseline (if measurable).
- Data quality:
  - % of applications where resume links open successfully (HTTP 200) in logs/monitoring.
  - % of candidates on a job with a calculated match score.

9. Technical Implementation Notes (high-level)
- Backend:
  - Add `getApplicationWithDetails` in `lib/actions/jobs.ts` to return unified candidate details, ensuring access control.
  - Add `getJobApplicationsWithMatchScores` (or equivalent) to augment applications with match scores.
  - Adjust `/api/employer/jobs/[jobId]/applications` endpoint to include `matchScore`.
- Frontend:
  - Replace mock implementation in `app/employer/candidates/[id]/page.tsx` with real data wiring (server component using the new backend function).
  - Extend `app/employer/jobs/[id]/candidates/page.tsx` to:
    - Consume the new `matchScore` field.
    - Add sort-by-match-score UI logic.
    - Turn “Просмотр профиля” into a real link to the detail route.
    - Turn the “Резюме” button into a working link.

10. Out-of-Scope / Future Enhancements
- Inline emailing candidates from the detail page (beyond simple `mailto:`).
- In-page comparison view across multiple candidates.
- Employer-configurable weighting for match-score components.
- Surfacing resume parsing highlights (e.g., extracted skills/experience) directly on the candidate detail page.

Hook updateApplicationStatus into an email service (or Supabase Edge Function) so accept/reject/interview actions notify candidates.
Introduce a server-side job that calls calculateMatchScoreForJobUser (e.g., on application submission) and update the job seeker search UI to display real-time AI scores rather than the default 75.
Offload Gemini calls to background jobs or show optimistic UI/spinners so requirement 5.2.2 (non-blocking AI requests) is met.
