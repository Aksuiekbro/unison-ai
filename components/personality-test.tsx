'use client'

import { useState, useEffect } from 'react'
import { Button } from './ui/button'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Textarea } from './ui/textarea'
import { Progress } from './ui/progress'
import { Brain, ChevronRight, CheckCircle, Loader2 } from 'lucide-react'
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

  // Load questions on component mount
  useEffect(() => {
    loadQuestions()
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
    setIsSubmitting(true)
    setIsAnalyzing(true)

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
          setTestCompleted(true)
          toast.success('Тест личности завершен! Анализ готов.')
          onTestComplete?.(result.analysis)
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
    return (
      <div className={className}>
        <Card>
          <CardContent className="text-center p-8">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-gray-900 mb-2">Тест завершен!</h3>
            <p className="text-gray-600 mb-4">
              Спасибо за прохождение теста личности. Ваши ответы проанализированы ИИ.
            </p>
            <p className="text-sm text-gray-500">
              Теперь вы можете просматривать вакансии с персонализированными оценками совместимости.
            </p>
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