import { TranslationDictionary } from '@/lib/i18n/types'

export const jobSeekerKk: TranslationDictionary = {
  dashboard: {
    welcome: 'Қош келдіңіз!',
    welcomeNamed: 'Қош келдіңіз, {name}!',
    applicationStatus: {
      title: 'Өтініштерімнің статусы',
      description: 'Өтініштердің барысын бақылаңыз',
      interviewCta: 'Жауап беру',
    },
    profileProgress: {
      title: 'Профильді толтыру',
      description: 'Дәл ұсыныстар үшін профильді толықтырыңыз',
      cta: 'Профильді аяқтау',
      items: {
        personalData: 'Жеке деректер',
        workExperience: 'Жұмыс тәжірибесі',
        skills: 'Дағдылар',
        assessments: 'Тест',
      },
    },
    recommendations: {
      title: 'Ұсынылған вакансиялар',
      description: 'Сізге арнайы таңдалған',
      emptyTitle: 'Вакансиялар жоқ.',
      emptyDescription: 'Жаңа мүмкіндіктерді көру үшін іздеуді бастаңыз.',
      cta: 'Іздеуге өту',
      viewDetails: 'Толығырақ',
    },
  },
  applicationStatus: {
    pending: 'Жіберілді',
    reviewing: 'Қаралуда',
    interview: 'Сұхбатқа шақыру',
    accepted: 'Қабылданды',
    rejected: 'Қабылданбады',
  },
}
