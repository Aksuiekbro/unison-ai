"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { PasswordResetRequestForm } from "@/components/password-reset-request-form"

interface ForgotPasswordDialogProps {
  triggerLabel?: string
  triggerClassName?: string
}

export function ForgotPasswordDialog({ triggerLabel = "Forgot password?", triggerClassName = "text-sm font-medium text-purple-600 hover:underline" }: ForgotPasswordDialogProps) {
  const [open, setOpen] = useState(false)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button type="button" className={triggerClassName}>
          {triggerLabel}
        </button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Reset your password</DialogTitle>
          <DialogDescription>We'll email you a secure link to choose a new password.</DialogDescription>
        </DialogHeader>
        <PasswordResetRequestForm description={null} />
      </DialogContent>
    </Dialog>
  )
}
