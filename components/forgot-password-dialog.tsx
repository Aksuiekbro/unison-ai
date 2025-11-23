"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { PasswordResetRequestForm } from "@/components/password-reset-request-form"
import { useI18n } from "@/components/i18n/I18nProvider"

interface ForgotPasswordDialogProps {
  triggerLabel?: string
  triggerClassName?: string
}

export function ForgotPasswordDialog({ triggerLabel, triggerClassName = "text-sm font-medium text-purple-600 hover:underline" }: ForgotPasswordDialogProps) {
  const [open, setOpen] = useState(false)
  const { t } = useI18n()

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button type="button" className={triggerClassName}>
          {triggerLabel ?? t("auth.login.forgot")}
        </button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("auth.resetRequest.title")}</DialogTitle>
          <DialogDescription>{t("auth.resetRequest.description")}</DialogDescription>
        </DialogHeader>
        <PasswordResetRequestForm description={null} />
      </DialogContent>
    </Dialog>
  )
}
