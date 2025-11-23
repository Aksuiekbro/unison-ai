'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { Button } from './ui/button'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Textarea } from './ui/textarea'
import { Progress } from './ui/progress'
import { Brain, ChevronRight, CheckCircle, Loader2, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'

interface Question {
  id: string
  question_text: string
  category: string
  order_index: number
}

interface PersonalityTestProps {
  userId: string
  onTestComplete?: (analysisData: any) => void
  className?: string
}

const DEFAULT_QUESTIONS: Question[] = [
  {
    id: '1',
    question_text: 'Опишите самую большую неудачу в вашей карьере и что она вас научила.',
    category: 'problem_solving',
    order_index: 1
  },
  {
    id: '2', 
    question_text: 'Расскажите о ситуации, когда вам пришлось работать в команде с конфликтными людьми. Как вы решили эту проблему?',
    category: 'teamwork',
    order_index: 2
  },
  {
    id: '3',
    question_text: 'Опишите проект или инициативу, которую вы начали сами, без указания руководства.',
    category: 'initiative',
    order_index: 3
  },
  {
    id: '4',
    question_text: 'Как вы обычно принимаете важные решения? Опишите свой процесс на конкретном примере.',
    category: 'decision_making',
    order_index: 4
  },
  {
    id: '5',
    question_text: 'Расскажите о времени, когда вам пришлось изучить что-то совершенно новое для работы. Как вы подошли к обучению?',
    category: 'learning',
    order_index: 5
  },
  {
    id: '6',
    question_text: 'Опишите ситуацию, когда вы не согласились с решением руководства. Как вы отреагировали?',
    category: 'leadership',
    order_index: 6
  },
  {
    id: '7',
    question_text: 'Что вас мотивирует больше всего в работе? Приведите конкретные примеры.',
    category: 'motivation',
    order_index: 7
  }
]

type AnalysisStatus = 'idle' | 'queued' | 'processing' | 'completed' | 'failed'

const STATUS_LABELS: Record<AnalysisStatus, { title: string; description: string }> = {
  idle: {
    title: 'Ответы еще не отправлены',
    description: 'Завершите тест, чтобы запустить анализ.'
  },
  queued: {
    title: 'Ответы сохранены',
    description: 'Мы поставили анализ в очередь и сообщим, как только он завершится.'
  },
  processing: {
    title: 'ИИ анализирует ответы',
    description: 'Обычно это занимает меньше минуты. Не закрывайте вкладку, если хотите увидеть уведомление.'
  },
  completed: {
    title: 'Анализ готов',
    description: 'Можете открыть результаты и перейти к подбору вакансий.'
  },
  failed: {
    title: 'Не удалось завершить анализ',
    description: 'Попробуйте еще раз позже или перепройдите тест.'
  }
}

export function PersonalityTest({ userId, onTestComplete, className }: PersonalityTestProps) {
  // Runtime validation for userId prop
  if (!userId || typeof userId !== 'string' || !userId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
    if (process.env.NODE_ENV !== 'production') {
      console.error('PersonalityTest: Invalid or missing userId prop:', userId)
    }
    return (
      <div className="p-4 text-center text-red-600">
        <p>Unable to load personality test: Invalid user session</p>
        <p className="text-sm text-gray-500">Please refresh the page and try again</p>
      </div>
    )
  }

  const [questions, setQuestions] = useState<Question[]>([])
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [responses, setResponses] = useState<Record<string, string>>({})
  const [currentResponse, setCurrentResponse] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [testCompleted, setTestCompleted] = useState(false)
  const [analysisStatus, setAnalysisStatus] = useState<AnalysisStatus>('idle')
  const [statusMessage, setStatusMessage] = useState('')

  const pollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const pollAttemptsRef = useRef(0)
  const pollingActiveRef = useRef(false)

  // Load questions on component mount
  useEffect(() => {
    loadQuestions()
  }, [])

  useEffect(() => {
    return () => {
      stopStatusPolling()
    }
  }, [])

  const loadQuestions = async () => {
    try {
      setIsLoading(true)
      
      // Try to load questions from API, fallback to default questions
      const response = await fetch('/api/personality/questions')
      if (response.ok) {
        const data = await response.json()
        if (data.success && data.questions?.length > 0) {
          setQuestions(data.questions)
        } else {
          setQuestions(DEFAULT_QUESTIONS)
        }
      } else {
        // Use default questions if API fails
        setQuestions(DEFAULT_QUESTIONS)
      }
    } catch (error) {
      console.error('Error loading questions:', error)
      setQuestions(DEFAULT_QUESTIONS)
    } finally {
      setIsLoading(false)
    }
  }

  const stopStatusPolling = () => {
    pollingActiveRef.current = false
    if (pollTimeoutRef.current) {
      clearTimeout(pollTimeoutRef.current)
      pollTimeoutRef.current = null
    }
  }

  const scheduleNextPoll = () => {
    if (!pollingActiveRef.current) {
      return
    }
    if (pollTimeoutRef.current) {
      clearTimeout(pollTimeoutRef.current)
    }
    const attempts = pollAttemptsRef.current
    const baseDelay = attempts >= 6 ? 10000 : 5000
    const jitter = Math.floor(Math.random() * 1500)
    pollTimeoutRef.current = setTimeout(() => {
      if (!pollingActiveRef.current) {
        return
      }
      pollAttemptsRef.current += 1
      pollPersonalityStatus()
    }, baseDelay + jitter)
  }

  const pollPersonalityStatus = async () => {
    let shouldContinue = true
    try {
      const response = await fetch('/api/personality/status')
      if (response.status === 401) {
        stopStatusPolling()
        setStatusMessage('Сессия истекла. Войдите снова, чтобы узнать статус.')
        toast.error('Сессия истекла. Пожалуйста, войдите снова.', { id: 'personality-status' })
        return
      }

      if (!response.ok) {
        throw new Error('Failed to fetch personality status')
      }

      const data = await response.json()
      const nextStatus = (data.status as AnalysisStatus) || 'queued'
      setAnalysisStatus(nextStatus)

      const copy = STATUS_LABELS[nextStatus] ?? STATUS_LABELS.queued
      setStatusMessage(copy.description)

      if (nextStatus === 'completed') {
        setStatusMessage(STATUS_LABELS.completed.description)
        toast.success('Анализ готов! Можно открыть результаты.', { id: 'personality-status' })
        stopStatusPolling()
        onTestComplete?.(null)
        shouldContinue = false
      } else if (nextStatus === 'failed') {
        const errorMessage = data?.error || STATUS_LABELS.failed.description
        setStatusMessage(errorMessage)
        toast.error(errorMessage, { id: 'personality-status' })
        stopStatusPolling()
        shouldContinue = false
      }
    } catch (error) {
      console.error('Failed to poll personality status', error)
      setStatusMessage('Не удалось обновить статус. Попробуем еще раз...')
    } finally {
      if (shouldContinue) {
        scheduleNextPoll()
      }
    }
  }

  const startStatusPolling = () => {
    pollingActiveRef.current = true
    pollAttemptsRef.current = 0
    if (pollTimeoutRef.current) {
      clearTimeout(pollTimeoutRef.current)
      pollTimeoutRef.current = null
    }
    pollPersonalityStatus()
  }

  // Guard against empty questions array and bounds check currentQuestionIndex
  const safeQuestionIndex = questions.length === 0 ? 0 : Math.max(0, Math.min(currentQuestionIndex, questions.length - 1))
  const currentQuestion = questions[safeQuestionIndex]
  const progress = questions.length === 0 ? 0 : ((safeQuestionIndex + 1) / questions.length) * 100
  const isLastQuestion = questions.length === 0 ? false : safeQuestionIndex === questions.length - 1

  const handleNextQuestion = () => {
    if (!currentResponse.trim()) {
      toast.error('Пожалуйста, ответьте на вопрос перед продолжением')
      return
    }

    if (currentResponse.trim().length < 50) {
      toast.error('Пожалуйста, дайте более подробный ответ (минимум 50 символов)')
      return
    }

    // Save response
    setResponses(prev => ({
      ...prev,
      [currentQuestion.id]: currentResponse
    }))

    if (isLastQuestion) {
      // Submit all responses
      submitTest()
    } else {
      // Move to next question
      setCurrentQuestionIndex(prev => prev + 1)
      setCurrentResponse('')
    }
  }

  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      // Save current response
      setResponses(prev => ({
        ...prev,
        [currentQuestion.id]: currentResponse
      }))

      // Go to previous question
      setCurrentQuestionIndex(prev => prev - 1)
      
      // Load previous response
      const prevQuestion = questions[currentQuestionIndex - 1]
      setCurrentResponse(responses[prevQuestion.id] || '')
    }
  }

  const submitTest = async () => {
    stopStatusPolling()
    setIsSubmitting(true)
    setIsAnalyzing(true)
    setAnalysisStatus('idle')
    setStatusMessage('')

    try {
      // Save final response
      const finalResponses = {
        ...responses,
        [currentQuestion.id]: currentResponse
      }

      // Submit responses and get AI analysis
      const payload = {
        userId,
        responses: finalResponses
      }
      
      // Serialize and validate payload size (max 512KB)
      const bodyData = JSON.stringify(payload)
      const bodySizeKB = new Blob([bodyData]).size / 1024
      const maxSizeKB = 512
      
      if (bodySizeKB > maxSizeKB) {
        throw new Error(`Ответы слишком длинные (${Math.round(bodySizeKB)}KB). Пожалуйста, сократите ваши ответы до ${maxSizeKB}KB.`)
      }
      
      // Create AbortController for timeout (20 seconds)
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 20000)
      
      try {
        const response = await fetch('/api/personality/analyze', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: bodyData,
          signal: controller.signal
        })
        
        clearTimeout(timeoutId)
        
        if (!response.ok) {
          throw new Error('Failed to submit personality test')
        }
        
        const result = await response.json()
        
        if (result.success) {
          const nextStatus: AnalysisStatus = result.status || 'queued'
          const analysisPayload = result.analysis ?? null
          setTestCompleted(true)
          setAnalysisStatus(nextStatus)

          if (nextStatus === 'completed') {
            setStatusMessage(STATUS_LABELS.completed.description)
            toast.success('Анализ готов! Можно перейти к результатам.', { id: 'personality-status' })
            onTestComplete?.(analysisPayload)
          } else if (nextStatus === 'failed') {
            const errorText = result.error || STATUS_LABELS.failed.description
            setStatusMessage(errorText)
            toast.error(errorText, { id: 'personality-status' })
          } else {
            const copy = STATUS_LABELS[nextStatus] ?? STATUS_LABELS.queued
            setStatusMessage(copy.description)
            toast.info(copy.title, { description: copy.description, id: 'personality-status' })
            startStatusPolling()
          }
        } else {
          throw new Error(result.error || 'Failed to analyze responses')
        }
      } catch (error) {
        clearTimeout(timeoutId)
        if (error instanceof Error && error.name === 'AbortError') {
          throw new Error('Анализ занимает слишком много времени. Пожалуйста, попробуйте еще раз.')
        }
        throw error
      }
    } catch (error) {
      console.error('Test submission error:', error)
      
      // Show user-friendly error messages
      if (error instanceof Error) {
        toast.error(error.message)
      } else {
        toast.error('Ошибка при отправке теста. Попробуйте еще раз.')
      }
    } finally {
      setIsSubmitting(false)
      setIsAnalyzing(false)
    }
  }

  if (isLoading) {
    return (
      <div className={`flex justify-center items-center p-8 ${className}`}>
        <Loader2 className="w-8 h-8 animate-spin text-[#00C49A]" />
        <span className="ml-2 text-gray-600">Загрузка теста...</span>
      </div>
    )
  }

  if (testCompleted) {
    const effectiveStatus: Exclude<AnalysisStatus, 'idle'> =
      analysisStatus === 'idle' ? 'queued' : analysisStatus
    const isReady = effectiveStatus === 'completed'
    const isFailed = effectiveStatus === 'failed'
    const statusCopy = STATUS_LABELS[effectiveStatus] ?? STATUS_LABELS.queued

    return (
      <div className={className}>
        <Card>
          <CardContent className="text-center p-8 space-y-6">
            <div className="flex justify-center">
              {isReady ? (
                <CheckCircle className="w-16 h-16 text-green-500" />
              ) : isFailed ? (
                <AlertCircle className="w-16 h-16 text-red-500" />
              ) : (
                <Loader2 className="w-16 h-16 text-[#00C49A] animate-spin" />
              )}
            </div>
            <div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">{statusCopy.title}</h3>
              <p className="text-gray-600">
                {statusMessage || statusCopy.description}
              </p>
            </div>

            {!isFailed && (
              <p className="text-sm text-gray-500">
                Мы отправим уведомление в приложении, как только анализ завершится. Вы можете перейти к другим разделам.
              </p>
            )}

            <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
              <Button
                asChild
                disabled={!isReady}
                className="bg-[#00C49A] hover:bg-[#00A085] disabled:opacity-70"
              >
                <Link href="/job-seeker/results">
                  {isReady ? 'Открыть результаты' : 'Перейти к результатам'}
                </Link>
              </Button>

              <Button asChild variant="outline">
                <Link href="/job-seeker/dashboard">Вернуться в дашборд</Link>
              </Button>
            </div>

            {isFailed && (
              <div className="space-y-3">
                <p className="text-sm text-red-500">
                  Если ошибка повторяется, попробуйте перепройти тест или свяжитесь с поддержкой.
                </p>
                <Button asChild variant="ghost" className="text-red-600 hover:text-red-600">
                  <Link href="/job-seeker/test">Пройти тест заново</Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className={className}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="w-5 h-5 text-[#00C49A]" />
            Тест личности
            <span className="text-sm font-normal text-gray-500">
              ({currentQuestionIndex + 1} из {questions.length})
            </span>
          </CardTitle>
          <Progress value={progress} className="w-full" />
        </CardHeader>
        
        <CardContent className="space-y-6">
          {isAnalyzing && (
            <div className="p-4 bg-[#00C49A]/10 border border-[#00C49A]/20 rounded-lg">
              <div className="flex items-center gap-2 text-[#00C49A] mb-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="font-medium">ИИ анализирует ваши ответы...</span>
              </div>
              <p className="text-sm text-gray-600">
                Пожалуйста, подождите. Это может занять несколько секунд.
              </p>
            </div>
          )}

          <div className="space-y-4">
            <div className="p-4 bg-gray-50 rounded-lg">
              <span className="text-sm font-medium text-[#00C49A] uppercase tracking-wide">
                {currentQuestion?.category || 'Вопрос'}
              </span>
              <h3 className="text-lg font-medium text-gray-900 mt-1">
                {currentQuestion?.question_text}
              </h3>
            </div>

            <div className="space-y-2">
              <Textarea
                placeholder="Опишите вашу ситуацию подробно. Мин. 50 символов для качественного анализа..."
                value={currentResponse}
                onChange={(e) => setCurrentResponse(e.target.value)}
                rows={6}
                className="resize-none"
                disabled={isSubmitting}
              />
              <div className="flex justify-between text-sm text-gray-500">
                <span>
                  {currentResponse.length} символов
                  {currentResponse.length < 50 && (
                    <span className="text-red-500"> (минимум 50)</span>
                  )}
                </span>
                <span>Будьте конкретны и честны для лучшего анализа</span>
              </div>
            </div>
          </div>

          <div className="flex justify-between">
            <Button
              variant="outline"
              onClick={handlePreviousQuestion}
              disabled={currentQuestionIndex === 0 || isSubmitting}
            >
              Назад
            </Button>
            
            <Button
              onClick={handleNextQuestion}
              disabled={!currentResponse.trim() || currentResponse.length < 50 || isSubmitting}
              className="bg-[#00C49A] hover:bg-[#00A085]"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {isLastQuestion ? 'Анализируем...' : 'Отправка...'}
                </>
              ) : (
                <>
                  {isLastQuestion ? 'Завершить тест' : 'Следующий'}
                  <ChevronRight className="w-4 h-4 ml-2" />
                </>
              )}
            </Button>
          </div>

          <div className="text-xs text-gray-500 text-center">
            Ваши ответы анализируются ИИ для определения совместимости с вакансиями.
            Все данные обрабатываются конфиденциально.
          </div>
        </CardContent>
      </Card>
    </div>
  )
}