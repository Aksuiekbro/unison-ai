import { TranslationDictionary } from '@/lib/i18n/types'

export const jobSeekerRu: TranslationDictionary = {
  dashboard: {
    welcome: 'Добро пожаловать!',
    welcomeNamed: 'Добро пожаловать, {name}!',
    applicationStatus: {
      title: 'Статус моих откликов',
      description: 'Отслеживайте прогресс ваших заявок',
      interviewCta: 'Ответить',
    },
    profileProgress: {
      title: 'Прогресс заполнения профиля',
      description: 'Заполните профиль для более точных рекомендаций',
      cta: 'Завершить профиль',
      items: {
        personalData: 'Личные данные',
        workExperience: 'Опыт работы',
        skills: 'Навыки',
        assessments: 'Тестирование',
      },
    },
    recommendations: {
      title: 'Рекомендованные вакансии',
      description: 'Подобраны специально для вас',
      emptyTitle: 'Вакансии отсутствуют.',
      emptyDescription: 'Начните поиск, чтобы увидеть новые предложения.',
      cta: 'Перейти к поиску',
      viewDetails: 'Подробнее',
    },
  },
  applicationStatus: {
    pending: 'Отправлено',
    reviewing: 'В рассмотрении',
    interview: 'Приглашение на интервью',
    accepted: 'Принято',
    rejected: 'Отклонено',
  },
}
