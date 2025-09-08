'use client'

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Loader2 } from "lucide-react"
import { JobWithMatchScore } from "@/lib/services/match-service"
import { applyToJob } from "@/lib/jobs"
import { toast } from "sonner"

interface JobApplicationDialogProps {
  job: JobWithMatchScore | null
  isOpen: boolean
  onClose: () => void
  userId: string | null
  onSuccess?: () => void
}

export function JobApplicationDialog({
  job,
  isOpen,
  onClose,
  userId,
  onSuccess
}: JobApplicationDialogProps) {
  const [coverLetter, setCoverLetter] = useState('')
  const [resumeUrl, setResumeUrl] = useState('')
  const [applying, setApplying] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!userId || !job) {
      toast.error('Please login to apply for jobs')
      return
    }

    try {
      setApplying(true)
      await applyToJob(userId, job.id, coverLetter || undefined, resumeUrl || undefined)
      toast.success('Application submitted successfully!')
      setCoverLetter('')
      setResumeUrl('')
      onClose()
      onSuccess?.()
    } catch (error: any) {
      toast.error(error.message || 'Failed to apply for job')
    } finally {
      setApplying(false)
    }
  }

  const formatSalary = (min: number | null, max: number | null) => {
    if (!min || !max) return 'По договоренности'
    return `${min.toLocaleString()}-${max.toLocaleString()} ₸`
  }

  if (!job) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="text-xl">Apply for {job.title}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Job Summary */}
          <div className="p-4 bg-gray-50 rounded-lg">
            <h3 className="font-semibold text-[#0A2540] mb-2">{job.title}</h3>
            <p className="text-sm text-gray-600">{job.companies?.name || 'Company'} • {job.location}</p>
            <p className="text-sm text-gray-600">{formatSalary(job.salary_min, job.salary_max)}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="cover-letter">Cover Letter (Optional)</Label>
              <Textarea
                id="cover-letter"
                placeholder="Tell the employer why you're interested in this position..."
                value={coverLetter}
                onChange={(e) => setCoverLetter(e.target.value)}
                rows={6}
                className="resize-none"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="resume-url">Resume URL (Optional)</Label>
              <Input
                id="resume-url"
                placeholder="https://your-resume-link.com"
                value={resumeUrl}
                onChange={(e) => setResumeUrl(e.target.value)}
                type="url"
              />
              <p className="text-xs text-gray-500">
                Link to your online resume (Google Drive, Dropbox, etc.)
              </p>
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={applying} className="bg-[#FF7A00] hover:bg-[#E66A00]">
                {applying ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  'Submit Application'
                )}
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  )
}