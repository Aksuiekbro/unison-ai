import { TranslationDictionary } from '@/lib/i18n/types'

export const en: TranslationDictionary = {
  common: {
    locale: 'Language',
    actions: {
      cancel: 'Cancel',
      selectFiles: 'Select files',
      addToProfile: 'Add to profile',
      adding: 'Adding...',
    },
    status: {
      uploading: 'Uploading...',
      parsed: 'AI parsing complete',
    },
    data: {
      current: 'Current data',
      next: 'New Gemini data',
      none: '—',
    },
  },
  header: {
    nav: {
      product: 'Product',
      functions: 'Functions',
      programs: 'Programs',
      tools: 'Tools',
      pricing: 'Pricing',
      contacts: 'Contacts',
    },
    auth: {
      login: 'Login',
      signup: 'Sign up',
    },
    aria: {
      openNavigation: 'Open navigation',
    },
  },
  resumeUpload: {
    title: 'Upload a resume',
    subtitle: 'For best results, upload a PDF or DOCX up to 10MB.',
    dropTitle: 'Drag and drop resume to upload',
    dropSubtitle: 'Your resume will remain private until you publish your profile.',
    acceptedTypesError: 'Only PDF or DOC/DOCX are supported',
    maxSizeError: 'File size must be under 10MB',
    serverResponseError: 'Invalid server response format',
    networkError: 'Network error while uploading file',
    abortedError: 'Upload cancelled',
    uploadError: 'Upload error: {status}',
    processedToast: 'Resume processed by AI',
    attachedToast: 'Resume added to profile',
    attachFailedToast: 'Could not add resume to profile',
    confirmHeading: 'Review Gemini suggestions',
    confirmDescription: 'Select the fields that look correct. Only checked values will be sent to your profile.',
    selectAll: 'Select all fields',
    selectionCount: '{selected} of {total} selected',
    noChanges: 'AI did not suggest changes. The resume will still be attached to your profile.',
    fileMeta: '{size} MB',
    fieldLabels: {
      firstName: 'First name',
      lastName: 'Last name',
      title: 'Desired role',
      summary: 'Professional summary',
      phone: 'Phone',
      location: 'Location',
      linkedinUrl: 'LinkedIn',
      githubUrl: 'GitHub',
      skills: 'Skills',
    },
  },
}
