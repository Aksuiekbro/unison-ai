# Unison AI - Job Portal Platform

A modern job portal platform built with Next.js, TypeScript, and Supabase, featuring role-based authentication, comprehensive profile management, and a complete job search interface with application tracking.

## Features
### 🔐 Authentication & Role Management
- Role-based authentication (Employer vs Job Seeker)
- Protected routes with middleware
- Automatic redirection based on user roles

### 👔 Employer Features
- **Company Profile Management**: Comprehensive company information forms
- **Company Details**: Name, description, industry, company size, location
- **Company Culture**: Describe work atmosphere and values
- **Benefits & Perks**: Manage employee benefits
- **Technology Stack**: Track company technologies
- **Contact Information**: HR contact details

### 👨‍💼 Job Seeker Features
- **Personal Profile**: Name, contact information, desired position
- **Professional Summary**: Personal description and career objectives
- **Work Experience**: Track employment history with detailed descriptions
- **Education**: Academic background and qualifications
- **Skills Management**: Tag-based skill system
- **Resume Upload**: File upload functionality (planned)
- **Social Profiles**: LinkedIn and GitHub integration
- **Async Personality Insights**: Open-ended AI assessment that queues instantly, shows queued/processing statuses, and notifies in-app when analysis is ready

### 🔍 Job Search & Filtering
- **Advanced Search**: Find jobs by skills, technologies, or keywords
- **Location filtering**: Filter by city or remote work options
- **Salary range filtering**: Set minimum and maximum salary expectations
- **Job type filtering**: Full-time, part-time, contract, or freelance positions
- **Experience level filtering**: Junior, Middle, Senior, or Lead positions
- **Remote work toggle**: Find remote-friendly positions

### 📝 Job Application System
- **One-click apply**: Quick application process for authenticated users
- **Enhanced application dialog**: Add cover letters and resume links
- **Application tracking**: Real-time status updates for submitted applications
- **Duplicate prevention**: Prevents multiple applications to the same job

### 📊 Application Dashboard
- **Status tracking**: Monitor application progress (Pending, Reviewed, Interview, Accepted, Rejected)
- **Job details**: View complete job information from your applications
- **Application history**: Timeline of all submitted applications
- **Company information**: Access company details from joined database queries

### 🛠️ Technical Features
- **Server Actions**: Form handling with proper validation
- **Database Integration**: Supabase with type-safe operations
- **Form Validation**: Zod schema validation
- **UI Components**: Modern design with shadcn/ui
- **Real-time Updates**: Optimistic updates with error handling
- **Responsive Design**: Mobile-first approach

## Tech Stack

- **Framework**: Next.js 15.2.4 with App Router
- **Language**: TypeScript
- **Database**: Supabase
- **UI Library**: shadcn/ui + Tailwind CSS
- **Form Handling**: React Hook Form with Zod validation
- **Authentication**: Supabase Auth with middleware
- **Icons**: Lucide React

## Project Structure

```
├── app/
│   ├── actions/          # Server actions for data mutations
│   ├── auth/             # Authentication pages
│   ├── employer/         # Employer-specific pages
│   ├── job-seeker/       # Job seeker-specific pages and job search
│   └── layout.tsx        # Root layout with toast provider
├── components/
│   ├── profile/          # Profile form components
│   ├── job-application-dialog.tsx # Job application modal
│   └── ui/              # Reusable UI components
├── lib/
│   ├── auth.ts          # Authentication utilities
│   ├── database.types.ts # TypeScript database types
│   ├── validations.ts   # Zod validation schemas
│   ├── jobs.ts          # Job search and application functions
│   ├── types.ts         # Job-related TypeScript types
│   ├── database-schema.sql # Complete database schema
│   └── supabase-*.ts    # Supabase client configurations
├── hooks/               # Custom React hooks
├── middleware.ts        # Route protection middleware
└── supabase/
    ├── schema.sql       # Complete database schema
    └── seed.sql         # Sample data
```

## Database Schema

### Core Tables
- **profiles**: Base user profiles with role information
- **employer_profiles**: Detailed company information
- **job_seeker_profiles**: Personal job seeker data
- **job_seeker_experiences**: Work experience records
- **job_seeker_education**: Educational background

### Job Board Tables
- **companies**: Company profiles linked to employer users
- **jobs**: Job listings with detailed information and requirements
- **applications**: Application tracking between job seekers and jobs
- **skills**: Skill taxonomy with junction tables for users and jobs

### Job Search Tables
- **jobs**: Complete job posting data with filtering indexes
- **applications**: User applications with foreign key relationships

## Setup Instructions

### 1. Environment Variables
Copy `.env.example` to `.env.local` and fill in your Supabase credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
PERSONALITY_ANALYSIS_INLINE=false # set to true to force inline AI processing (useful for local tests)
```

### 2. Database Setup
Execute the SQL commands in `supabase/schema.sql` and `lib/database-schema.sql` in your Supabase SQL Editor. This will:
- Create custom types for enums
- Set up all database tables with proper foreign key constraints
- Add indexes for optimal query performance
- Enable Row Level Security (RLS)
- Create comprehensive RLS policies
- Set up automatic timestamp updates

Optionally, run `supabase/seed.sql` to populate with sample data.

### 3. Install Dependencies
```bash
pnpm install
```

### 4. Run Development Server
```bash
pnpm run dev
```

## Key Components

### Profile Forms
- `JobSeekerProfileForm`: Comprehensive form for job seeker profile management
- `EmployerProfileForm`: Company profile management interface

### Job Search Components
- `JobApplicationDialog`: Enhanced application modal with cover letter and resume URL
- Job search page with advanced filtering
- Application tracking dashboard

### Server Actions
- `updateJobSeekerProfile`: Handle job seeker profile updates
- `updateEmployerProfile`: Handle employer profile updates
- `addJobSeekerExperience`: Add work experience records
- `addJobSeekerEducation`: Add education records

### Authentication
- Middleware-based route protection
- Role-based access control
- Automatic redirects based on user roles

## Security Features

- **Row Level Security**: All tables have RLS enabled with appropriate policies
- **Role-based Access**: Users can only access data they're authorized for
- **Data Validation**: Database constraints ensure data integrity
- **Secure Queries**: All database interactions use parameterized queries
- **User authentication**: Required for job applications
- **Unique constraints**: Prevents duplicate applications

## Development

### Available Scripts
- `pnpm dev` - Start development server
- `pnpm build` - Build for production  
- `pnpm lint` - Run ESLint

## Pages Structure

- `/job-seeker/search` - Job search with filtering
- `/job-seeker/applications` - Application tracking dashboard
- `/job-seeker/dashboard` - Overview with recent activity
- `/job-seeker/profile` - Profile management
- `/employer/dashboard` - Employer dashboard
- `/employer/jobs` - Job posting management

Each page includes responsive design, loading states, error handling, and optimistic UI updates for the best user experience.

## Future Enhancements

- [ ] File upload functionality for resumes and company logos
- [ ] Advanced search and filtering enhancements
- [ ] Email notifications for applications
- [ ] Real-time messaging between employers and job seekers
- [ ] Analytics dashboard
- [ ] PDF resume generation

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.
