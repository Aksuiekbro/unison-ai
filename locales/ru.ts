import { TranslationDictionary } from '@/lib/i18n/types'

export const ru: TranslationDictionary = {
  common: {
    locale: 'Язык',
    actions: {
      cancel: 'Отмена',
      selectFiles: 'Выбрать файл',
      addToProfile: 'Добавить в профиль',
      adding: 'Добавление...',
    },
    status: {
      uploading: 'Загрузка...',
      parsed: 'AI обработка завершена',
    },
    data: {
      current: 'Текущие данные',
      next: 'Новые данные Gemini',
      none: '—',
    },
  },
  header: {
    nav: {
      product: 'Продукт',
      functions: 'Функции',
      programs: 'Программы',
      tools: 'Инструменты',
      pricing: 'Тарифы',
      contacts: 'Контакты',
    },
    auth: {
      login: 'Войти',
      signup: 'Регистрация',
    },
    aria: {
      openNavigation: 'Открыть навигацию',
    },
  },
  resumeUpload: {
    title: 'Загрузка резюме',
    subtitle: 'Для лучшего результата загрузите PDF или DOCX до 10 МБ.',
    dropTitle: 'Перетащите резюме для загрузки',
    dropSubtitle: 'Резюме останется приватным, пока вы не опубликуете профиль.',
    acceptedTypesError: 'Поддерживаются только PDF или DOC/DOCX',
    maxSizeError: 'Размер файла должен быть меньше 10 МБ',
    serverResponseError: 'Неверный формат ответа сервера',
    networkError: 'Сетевая ошибка при загрузке файла',
    abortedError: 'Загрузка отменена',
    uploadError: 'Ошибка загрузки: {status}',
    processedToast: 'Резюме успешно обработано AI',
    attachedToast: 'Резюме добавлено в профиль',
    attachFailedToast: 'Не удалось добавить резюме в профиль',
    confirmHeading: 'Подтвердите найденные Gemini изменения',
    confirmDescription: 'Отметьте поля, которые выглядят корректно. Только отмеченные значения будут отправлены в профиль.',
    selectAll: 'Выбрать все поля',
    selectionCount: '{selected} из {total} выбрано',
    noChanges: 'AI не предложил изменений. Резюме всё равно будет прикреплено к вашему профилю.',
    fileMeta: '{size} МБ',
    fieldLabels: {
      firstName: 'Имя',
      lastName: 'Фамилия',
      title: 'Желаемая должность',
      summary: 'Профессиональное резюме',
      phone: 'Телефон',
      location: 'Локация',
      linkedinUrl: 'LinkedIn',
      githubUrl: 'GitHub',
      skills: 'Навыки',
    },
  },
}
