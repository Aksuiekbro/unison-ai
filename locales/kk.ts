import { TranslationDictionary } from '@/lib/i18n/types'

export const kk: TranslationDictionary = {
  common: {
    locale: 'Тіл',
    actions: {
      cancel: 'Бас тарту',
      selectFiles: 'Файлды таңдау',
      addToProfile: 'Профильге қосу',
      adding: 'Қосылуда...',
    },
    status: {
      uploading: 'Жүктелуде...',
      parsed: 'AI өңдеуі аяқталды',
    },
    data: {
      current: 'Ағымдағы деректер',
      next: 'Жаңа Gemini деректері',
      none: '—',
    },
  },
  header: {
    nav: {
      product: 'Өнім',
      functions: 'Функциялар',
      programs: 'Бағдарламалар',
      tools: 'Құралдар',
      pricing: 'Бағалар',
      contacts: 'Байланыс',
    },
    auth: {
      login: 'Кіру',
      signup: 'Тіркелу',
    },
    aria: {
      openNavigation: 'Навигацияны ашу',
    },
  },
  resumeUpload: {
    title: 'Түйіндемені жүктеу',
    subtitle: 'Ең жақсы нәтиже үшін 10 МБ дейін PDF немесе DOCX жүктеңіз.',
    dropTitle: 'Түйіндемені сүйреп әкеліп жүктеңіз',
    dropSubtitle: 'Түйіндеме профиліңізді жариялағанға дейін жеке қалады.',
    acceptedTypesError: 'Тек PDF немесе DOC/DOCX қолдау көрсетіледі',
    maxSizeError: 'Файл өлшемі 10 МБ-тан аспауы керек',
    serverResponseError: 'Сервер жауабының форматы қате',
    networkError: 'Файлды жүктеу кезінде желілік қате',
    abortedError: 'Жүктеу тоқтатылды',
    uploadError: 'Жүктеу қатесі: {status}',
    processedToast: 'Түйіндеме AI арқылы өңделді',
    attachedToast: 'Түйіндеме профильге қосылды',
    attachFailedToast: 'Түйіндемені профильге қосу мүмкін болмады',
    confirmHeading: 'Gemini ұсынған өзгерістерді растаңыз',
    confirmDescription: 'Дұрыс көрінетін өрістерді белгілеңіз. Тек белгіленген мәндер профильге жіберіледі.',
    selectAll: 'Барлық өрістерді таңдау',
    selectionCount: '{selected} / {total} таңдалды',
    noChanges: 'AI өзгерістер ұсынбады. Түйіндеме бәрібір профиліңізге тіркеледі.',
    fileMeta: '{size} МБ',
    fieldLabels: {
      firstName: 'Аты',
      lastName: 'Тегі',
      title: 'Қалаған лауазым',
      summary: 'Кәсіби түйін',
      phone: 'Телефон',
      location: 'Орналасу',
      linkedinUrl: 'LinkedIn',
      githubUrl: 'GitHub',
      skills: 'Дағдылар',
    },
  },
}
