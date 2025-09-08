# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

### Development
- `pnpm dev` - Start Next.js development server
- `pnpm build` - Build production application
- `pnpm lint` - Run ESLint for code quality checks
- `pnpm start` - Start production server

### Testing
- `pnpm test` - Run Vitest unit tests
- `pnpm e2e` - Run Playwright end-to-end tests
- `pnpm e2e:ui` - Run Playwright tests with UI mode

## Project Overview

### Core Purpose
**Unison AI** is an AI-powered recruitment SaaS platform designed for small and medium businesses (SMBs) in Kazakhstan. The platform automates candidate screening and provides deep soft skills evaluation through AI analysis, solving the problem of time-consuming manual resume screening and lack of cultural fit assessment tools for SMBs.

### Key Differentiators
- **AI-First Approach**: Gemini AI integration for resume parsing, personality analysis, and intelligent candidate matching
- **Soft Skills Focus**: Deep personality assessment through open-ended questionnaires analyzed by AI
- **Match Score System**: 0-100 numerical compatibility scoring between candidates and job requirements
- **Kazakhstan Market Focus**: Localized for Russian/Kazakh languages and SMB business context

## Architecture Overview

### Core Application Structure
This is a **Next.js 15 App Router** AI-powered recruitment platform with role-based authentication (Employer/Job Seeker) built on **Supabase** and **Google Gemini AI**. The application uses **TypeScript**, **React Hook Form** with **Zod validation**, and **shadcn/ui** components.

### AI Integration Architecture
- **Gemini AI Core**: Google Gemini API integration for three main workflows:
  1. **Resume Parsing**: Extract structured data from PDF/DOCX files and populate profile fields
  2. **Personality Analysis**: Analyze open-ended questionnaire responses for soft skills assessment
  3. **Candidate Matching**: Generate Match Score (0-100) and compatibility summaries
- **Async Processing**: All AI operations run asynchronously to prevent UI blocking
- **JSON-First**: All AI interactions use structured JSON prompts and responses for reliability

### Key Architectural Patterns
- **Server Components First**: Minimize client components, prefer RSC for data fetching
- **Server Actions**: Form handling and mutations via Next.js server actions in `/actions` directory
- **Middleware Authentication**: Route protection via `middleware.ts` with role-based access
- **Type Safety**: Generated TypeScript types from Supabase schema in `lib/database.types.ts`
- **Row Level Security**: All database access controlled through Supabase RLS policies
- **AI-Driven Workflows**: Core platform features depend on AI analysis and scoring

### Database Architecture
- **Simplified Single-Table Profile Storage**: All user profile data (name, phone, location, bio, LinkedIn/GitHub URLs, job title, resume) stored directly in the `users` table
- **Role-Based Access**: Single `users` table serves both job seekers and employers with role-specific UI/permissions
- **Application Tracking**: Complete job application workflow with status management including Match Score
- **Skills Taxonomy**: Junction tables for user skills and job requirements
- **AI Analysis Storage**: Tables for storing personality analysis results and match scores
- **File Storage**: Supabase Storage integration for resume uploads (PDF/DOCX support)

#### Database Schema Note
**IMPORTANT**: The codebase uses a simplified single-table approach where ALL profile information is stored in the `users` table. The `users` table includes:
- Basic info: `full_name`, `email`, `phone`, `location`, `bio`, `role`
- Profile extensions: `linkedin_url`, `github_url`, `current_job_title`, `portfolio_url`, `resume_url`
- This eliminates the need for a separate `profiles` table and reduces data redundancy

### Key Directories
- `app/` - Next.js App Router pages and layouts
  - `actions/` - Server actions for data mutations
  - `auth/` - Authentication pages (login/signup)
  - `employer/` - Employer dashboard and job management
  - `job-seeker/` - Job search, applications, profile management
- `components/` - Reusable UI components
  - `profile/` - Profile form components
  - `ui/` - shadcn/ui components
- `lib/` - Utilities and configurations
  - `database.types.ts` - Generated Supabase types
  - `validations.ts` - Zod schemas
  - `supabase-*.ts` - Database client configurations
  - `auth.ts` - Authentication utilities
- `middleware.ts` - Route protection and role-based redirects

### User Roles & Workflows

#### Job Seeker Journey
1. **Registration**: Email/password signup with immediate role assignment
2. **Profile Creation**: Manual form filling OR resume file upload with AI parsing
3. **Mandatory Testing**: 5-7 open-ended questions (e.g., "Describe your biggest failure and what it taught you")
4. **AI Analysis**: Personality assessment covering problem-solving style, initiative level, work preferences, motivational factors, growth areas
5. **Job Search**: View jobs with one-click applications
6. **Results Viewing**: Access personal AI analysis report and application statuses

#### Employer Journey
1. **Company Registration**: Create company profile with culture description
2. **Job Creation**: Post jobs with detailed requirements including cultural fit criteria
3. **Automatic Scoring**: View applicants ranked by AI-generated Match Score (0-100)
4. **AI Analysis Review**: Access detailed candidate personality reports alongside resumes
5. **Hiring Process**: Simple workflow with "Invite to Interview", "Reject", "Make Offer" actions
6. **Notifications**: Automated email notifications to candidates on status changes

### Authentication Flow
1. Supabase handles auth with email/password and role-based registration pages
2. Middleware checks session and redirects based on user roles
3. Protected routes automatically redirect unauthenticated users
4. Role guards prevent access to wrong dashboards (employer vs job seeker)
5. Mandatory testing module blocks job seeker profile completion until completed

### AI-Powered Features

#### Resume Parsing System
- **File Upload**: Support for PDF and DOCX resume files
- **AI Extraction**: Gemini API processes files to extract structured data (personal info, experience, education, skills)
- **Auto-Population**: Pre-fill profile form fields with extracted data
- **User Confirmation**: Users must review and confirm AI-extracted information before saving

#### Mandatory Testing Module
- **Post-Registration Trigger**: Automatically shown to job seekers after first login
- **Open-Ended Questions**: 5-7 personality assessment questions requiring text responses
- **AI Personality Analysis**: Gemini API analyzes responses for:
  - Problem-solving style
  - Initiative level and self-motivation
  - Work preference (team vs individual)
  - Key motivational factors
  - Potential growth areas
- **Profile Gating**: Job seekers cannot access job search until testing completed

#### Match Score System
- **AI-Powered Matching**: Combines job requirements, company culture, candidate profile, and personality analysis
- **Numerical Score**: 0-100 compatibility rating for each candidate-job pairing
- **Explanation Summary**: 2-3 sentence AI-generated explanation of the score
- **Employer Dashboard**: Candidates automatically sorted by Match Score for efficient review

### Form Handling Pattern
- React Hook Form with Zod validation schemas
- Server actions for mutations with error handling
- Optimistic UI updates where appropriate
- Type-safe form data with database schema alignment
- File upload handling for resume processing

### Technical Requirements

#### Performance Requirements
- **Page Load Speed**: Maximum 3 seconds for all primary pages
- **Async AI Processing**: All Gemini API calls must run asynchronously to prevent UI blocking
- **Background Jobs**: AI operations (resume parsing, personality analysis, matching) should run in background with progress indicators

#### Security Requirements (SMB-Focused)
- **Modern Framework Security**: Leverage Next.js built-in protections against XSS, CSRF, SQL Injection
- **Password Security**: Salted hash storage using bcrypt (via Supabase Auth)
- **HTTPS Enforcement**: All traffic encrypted with SSL certificates
- **Server-Side Validation**: All user inputs and file uploads validated on server
- **API Key Security**: Gemini API keys stored in environment variables, never in code repository
- **File Upload Security**: Validate file types, scan for malicious content before AI processing

#### UI/UX Requirements
- **Mobile-First**: Responsive design for desktop and mobile devices
- **Intuitive Interface**: No extensive training required for SMB users
- **Kazakhstan Localization**: Russian/Kazakh language support
- **Loading States**: Clear progress indicators during AI processing
- **Error Handling**: User-friendly error messages with actionable guidance

### Database Migration Context
**Latest Change**: The codebase has been simplified from a dual-table approach (`users` + `profiles`) to a **single-table approach** where all profile data is stored directly in the `users` table. This eliminates redundancy and confusion between overlapping fields.

**Migration Required**: Run `/supabase/migrations/create_profiles_table.sql` (now renamed to add missing columns to `users` table) to add `linkedin_url`, `github_url`, `current_job_title`, `portfolio_url`, `resume_url` columns to your existing `users` table.

### Important Cursor Rules
- **Server Startup**: Never start servers - ask user to run development commands
- **TypeScript/React Patterns**: Functional components, descriptive variable names, early returns for error handling
- **Supabase Integration**: Use RLS policies, type-safe queries, proper error handling
- **UI Standards**: shadcn/ui components, Tailwind CSS, mobile-first responsive design
- **AI Integration**: All AI operations must be async, include error handling, and use structured JSON responses

### Testing Strategy
- Unit tests with Vitest for utilities and hooks
- E2E tests with Playwright for critical user flows including AI-dependent features
- Test files: `tests/` (unit) and `tests-e2e/` (end-to-end)
- Mock AI responses for consistent testing

### Kazakhstan Market Context

#### Target Audience
- **Primary Market**: Small and Medium Businesses (SMBs) in Kazakhstan
- **Employers**: Business owners, HR managers, and recruiters in SMB companies
- **Job Seekers**: Professionals seeking career growth opportunities within Kazakhstan
- **Language Support**: Russian and Kazakh language interfaces (user choice)

#### SMB-Specific Considerations
- **Limited Technical Resources**: Platform designed for users with minimal technical training
- **Cost-Conscious**: Features focused on ROI and efficiency gains for smaller teams
- **Local Business Culture**: Integration with Kazakhstan business practices and cultural norms
- **Simplified Workflows**: Streamlined processes suitable for companies without dedicated HR departments

### MVP Scope Definition

#### Included in MVP (Beta Version)
- **Complete Authentication**: Role-based registration and login for both user types
- **Full Profile Management**: Job seeker profile creation with resume upload and AI parsing
- **Mandatory Testing System**: Personality assessment questionnaire with AI analysis
- **Job Creation & Management**: Employer job posting with cultural fit requirements
- **AI-Powered Matching**: Automatic candidate scoring and ranking system
- **Application Workflow**: Complete application process with status tracking
- **Email Notifications**: Automated status updates for candidates
- **AI Analysis Viewing**: Full personality reports and matching explanations for employers

#### Explicitly Excluded from MVP
- **Monetization Features**: No payment processing or subscription management
- **Internal Messaging**: No chat/messaging system between employers and candidates
- **Admin Panel**: No platform administration interface
- **Advanced Search**: Employers can only view applicants, not search broader candidate database
- **Multi-Language Expansion**: Only Russian/Kazakh support (no English or other languages)
- **Advanced Analytics**: No reporting dashboards or usage analytics
- **Third-Party Integrations**: No LinkedIn, external job boards, or ATS integrations

#### Beta Testing Goals
- **User Base**: 30+ SMB companies for validation and feedback
- **Core Value Validation**: Confirm AI analysis provides measurable hiring improvement
- **User Experience Feedback**: Iterate on interface and workflow based on real SMB usage
- **Technical Validation**: Ensure AI processing performance meets SMB expectations

### Environment Requirements
- Supabase project with configured RLS policies
- Environment variables: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `GEMINI_API_KEY`
- Database schema from `supabase/schema.sql` and `lib/database-schema.sql`
- Google Gemini API access with sufficient quota for resume parsing and personality analysis
- Database Schema - Single Table Architecture

  CRITICAL: The application uses a single-table approach for user
  profiles. ALL profile data is stored in the users table only.

  users table contains:

  - Basic info: id, email, full_name, phone, location, bio, role
  - Profile fields: linkedin_url, github_url, current_job_title,
  portfolio_url, resume_url
  - Timestamps: created_at, updated_at

  NO separate profiles table:

  - Do NOT create or reference a profiles table
  - Do NOT use dual-table queries or joins
  - ALL profile operations (read/write) use the users table
  exclusively

  Code patterns:

  // ✅ CORRECT - Single table approach
  const userData = await supabase.from('users').select('*').eq('id',
  userId)
  await supabase.from('users').update({linkedin_url: url}).eq('id',
  userId)

  // ❌ WRONG - Dual table approach
  const profile = await
  supabase.from('profiles').select('*').eq('user_id', userId)

  This eliminates confusion between overlapping users and profiles
  tables and ensures all profile data is stored consistently in one
  place.