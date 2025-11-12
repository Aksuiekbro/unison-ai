'use client'

import { useState, useRef } from 'react'
import { Button } from './ui/button'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Upload, FileText, Loader2, CheckCircle, XCircle } from 'lucide-react'
import { toast } from 'sonner'
import { Badge } from './ui/badge'

interface ResumeUploadProps {
  userId: string
  onParsingComplete?: (data: any) => void
  className?: string
}

interface Skill {
  id?: string
  name?: string
  level?: string | number
  category?: string
}

interface ParsedResumeData {
  personal_info: {
    full_name: string
    email: string
    phone: string
    location: string
    linkedin_url?: string
    github_url?: string
  }
  professional_summary: string
  experience: any[]
  education: any[]
  skills: Skill[]
  confidence_scores: {
    overall: number
    personal_info: number
    experience: number
    education: number
    skills: number
  }
}

export function ResumeUpload({ userId, onParsingComplete, className }: ResumeUploadProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [isParsing, setIsParsing] = useState(false)
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [parseResult, setParseResult] = useState<ParsedResumeData | null>(null)
  const [parseError, setParseError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const acceptedTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ]

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    
    const files = Array.from(e.dataTransfer.files)
    if (files.length > 0) {
      handleFileSelection(files[0])
    }
  }

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      handleFileSelection(files[0])
    }
  }

  const handleFileSelection = (file: File) => {
    // Validate file type
    if (!acceptedTypes.includes(file.type)) {
      toast.error('Please upload a PDF or Word document')
      return
    }

    // Validate file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('File size must be less than 10MB')
      return
    }

    setUploadedFile(file)
    setParseResult(null)
    setParseError(null)
    uploadAndParseResume(file)
  }

  const uploadAndParseResume = async (file: File) => {
    setIsUploading(true)
    setIsParsing(true)
    
    // Helper function for exponential backoff
    const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))
    
    // Get CSRF token from meta tag or cookie
    const getCsrfToken = (): string | null => {
      // Try meta tag first
      const metaTag = document.querySelector('meta[name="csrf-token"]')
      if (metaTag) return metaTag.getAttribute('content')
      
      // Try cookie fallback
      const cookies = document.cookie.split(';')
      const csrfCookie = cookies.find(c => c.trim().startsWith('csrf-token='))
      return csrfCookie ? csrfCookie.split('=')[1] : null
    }
    
    const maxRetries = 3
    let controller: AbortController | null = null
    
    try {
      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 30000) // 30 second timeout
        
        try {
          // Create FormData for file upload
          const formData = new FormData()
          formData.append('resume', file)
          formData.append('userId', userId)
          
          // Prepare headers with CSRF protection
          const headers: Record<string, string> = {}
          const csrfToken = getCsrfToken()
          if (csrfToken) {
            headers['X-CSRF-Token'] = csrfToken
          }

          // Upload and parse resume with timeout and CSRF protection
          const response = await fetch('/api/resume/parse', {
            method: 'POST',
            body: formData,
            headers,
            signal: controller.signal
          })
          
          clearTimeout(timeoutId)

          if (!response.ok) {
            // Try to extract server error message
            let errorMessage = `HTTP ${response.status}: ${response.statusText}`
            
            try {
              const contentType = response.headers.get('content-type')
              if (contentType && contentType.includes('application/json')) {
                const errorData = await response.json()
                errorMessage = errorData.error || errorData.message || errorMessage
              }
            } catch {
              // Ignore JSON parse errors for error responses
            }
            
            throw new Error(errorMessage)
          }

          // Validate content type before parsing JSON
          const contentType = response.headers.get('content-type')
          if (!contentType || !contentType.includes('application/json')) {
            throw new Error('Server returned invalid response format')
          }
          
          let result
          try {
            result = await response.json()
          } catch (jsonError) {
            throw new Error('Failed to parse server response')
          }
          
          if (result.success) {
            setParseResult(result.data)
            toast.success('Resume parsed successfully!')
            onParsingComplete?.(result.data)
            return // Success - exit retry loop
          } else {
            throw new Error(result.error || 'Failed to parse resume')
          }
        } catch (error) {
          clearTimeout(timeoutId)
          
          // Handle specific error types
          if (error instanceof Error) {
            if (error.name === 'AbortError') {
              const timeoutError = new Error('Upload timed out. Please try again.')
              if (attempt === maxRetries) throw timeoutError
              
              toast.error(`Attempt ${attempt} timed out, retrying...`)
              await sleep(1000 * Math.pow(2, attempt - 1)) // Exponential backoff
              continue
            }
            
            // Network or other fetch errors
            if (error.message.includes('fetch') || error.message.includes('network')) {
              if (attempt === maxRetries) {
                throw new Error('Network error. Please check your connection and try again.')
              }
              
              toast.error(`Network error on attempt ${attempt}, retrying...`)
              await sleep(1000 * Math.pow(2, attempt - 1)) // Exponential backoff
              continue
            }
          }
          
          // For other errors, don't retry
          throw error
        }
      }
    } catch (error) {
      console.error('Resume upload error:', error)
      
      let userMessage = 'Failed to upload resume'
      if (error instanceof Error) {
        userMessage = error.message
      }
      
      setParseError(userMessage)
      toast.error(userMessage)
    } finally {
      if (controller) {
        controller = null
      }
      setIsUploading(false)
      setIsParsing(false)
    }
  }

  const getConfidenceColor = (score: number) => {
    if (score >= 0.8) return 'bg-green-500'
    if (score >= 0.6) return 'bg-yellow-500'
    return 'bg-red-500'
  }

  const getConfidenceLabel = (score: number) => {
    if (score >= 0.8) return 'High'
    if (score >= 0.6) return 'Medium'
    return 'Low'
  }

  const formatFileName = (name: string, maxLength: number = 20) => {
    if (!name) return ''
    if (name.length <= maxLength) return name
    return `${name.slice(0, Math.max(0, maxLength - 3))}...`
  }

  return (
    <div className={className}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Resume Upload & AI Analysis
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {!uploadedFile ? (
            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                isDragging
                  ? 'border-[#00C49A] bg-[#00C49A]/10'
                  : 'border-gray-300 hover:border-gray-400'
              }`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-lg font-medium text-gray-700 mb-2">
                Upload your resume
              </p>
              <p className="text-sm text-gray-500 mb-4">
                Drag and drop your PDF or Word document here, or click to select
              </p>
              <Button
                onClick={() => fileInputRef.current?.click()}
                className="bg-[#00C49A] hover:bg-[#00A085]"
              >
                Select File
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.doc,.docx"
                onChange={handleFileInput}
                className="hidden"
              />
              <p className="text-xs text-gray-400 mt-2">
                Supported formats: PDF, DOC, DOCX (max 10MB)
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* File Info */}
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <FileText className="w-8 h-8 text-[#00C49A]" />
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{formatFileName(uploadedFile.name)}</p>
                  <p className="text-sm text-gray-500">
                    {(uploadedFile.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
                {isParsing ? (
                  <Loader2 className="w-5 h-5 animate-spin text-[#00C49A]" />
                ) : parseResult ? (
                  <CheckCircle className="w-5 h-5 text-green-500" />
                ) : parseError ? (
                  <XCircle className="w-5 h-5 text-red-500" />
                ) : null}
              </div>

              {/* Parsing Status */}
              {isParsing && (
                <div className="flex items-center gap-2 text-[#00C49A]">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-sm">AI is analyzing your resume...</span>
                </div>
              )}

              {/* Parse Error */}
              {parseError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-700">{parseError}</p>
                  <Button
                    size="sm"
                    variant="outline"
                    className="mt-2"
                    onClick={() => {
                      setUploadedFile(null)
                      setParseError(null)
                    }}
                  >
                    Try Again
                  </Button>
                </div>
              )}

              {/* Parse Results */}
              {parseResult && (
                <div className="space-y-4">
                  <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                    <h4 className="font-medium text-green-800 mb-2">Resume Analysis Complete</h4>
                    <p className="text-sm text-green-700">
                      Your resume has been successfully parsed and analyzed by AI.
                    </p>
                  </div>

                  {/* Confidence Scores */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {[
                      { label: 'Overall', score: parseResult.confidence_scores.overall },
                      { label: 'Personal', score: parseResult.confidence_scores.personal_info },
                      { label: 'Experience', score: parseResult.confidence_scores.experience },
                      { label: 'Skills', score: parseResult.confidence_scores.skills }
                    ].map(({ label, score }) => (
                      <div key={label} className="text-center">
                        <div className={`w-full h-2 rounded-full ${getConfidenceColor(score)} mb-1`} />
                        <p className="text-xs text-gray-600">{label}</p>
                        <p className="text-xs font-medium">{getConfidenceLabel(score)}</p>
                      </div>
                    ))}
                  </div>

                  {/* Extracted Data Summary */}
                  <div className="space-y-3">
                    <h5 className="font-medium text-gray-900">Extracted Information:</h5>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="font-medium text-gray-700">Personal Info</p>
                        <p className="text-gray-600">{parseResult.personal_info.full_name}</p>
                        <p className="text-gray-600">{parseResult.personal_info.email}</p>
                        <p className="text-gray-600">{parseResult.personal_info.location}</p>
                      </div>
                      
                      <div>
                        <p className="font-medium text-gray-700">Experience & Education</p>
                        <p className="text-gray-600">{parseResult.experience.length} work experiences</p>
                        <p className="text-gray-600">{parseResult.education.length} education entries</p>
                        <p className="text-gray-600">{parseResult.skills.length} skills identified</p>
                      </div>
                    </div>

                    {/* Skills Preview */}
                    {parseResult.skills.length > 0 && (
                      <div>
                        <p className="font-medium text-gray-700 mb-2">Skills:</p>
                        <div className="flex flex-wrap gap-2">
                          {parseResult.skills.slice(0, 10).map((skill, index) => (
                            <Badge key={index} variant="secondary" className="text-xs">
                              {skill?.name ?? 'Unknown skill'}
                            </Badge>
                          ))}
                          {parseResult.skills.length > 10 && (
                            <Badge variant="outline" className="text-xs">
                              +{parseResult.skills.length - 10} more
                            </Badge>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  <Button
                    onClick={() => {
                      setUploadedFile(null)
                      setParseResult(null)
                    }}
                    variant="outline"
                    className="w-full"
                  >
                    Upload Another Resume
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}