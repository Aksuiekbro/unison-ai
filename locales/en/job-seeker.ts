import { TranslationDictionary } from '@/lib/i18n/types'

export const jobSeekerEn: TranslationDictionary = {
  dashboard: {
    welcome: 'Welcome!',
    welcomeNamed: 'Welcome, {name}!',
    applicationStatus: {
      title: 'My application status',
      description: 'Track the progress of your applications',
      interviewCta: 'Respond',
    },
    profileProgress: {
      title: 'Profile completion',
      description: 'Complete your profile for better matches',
      cta: 'Complete profile',
      items: {
        personalData: 'Personal info',
        workExperience: 'Work experience',
        skills: 'Skills',
        assessments: 'Assessment',
      },
    },
    recommendations: {
      title: 'Recommended jobs',
      description: 'Selected just for you',
      emptyTitle: 'No jobs available.',
      emptyDescription: 'Start searching to find new opportunities.',
      cta: 'Go to search',
      viewDetails: 'View details',
    },
  },
  applicationStatus: {
    pending: 'Submitted',
    reviewing: 'In review',
    interview: 'Interview invite',
    accepted: 'Accepted',
    rejected: 'Rejected',
  },
}
