"use client"

import { createContext, useContext, useState, ReactNode } from "react"

type ToastType = {
  id: string
  title?: ReactNode
  description?: ReactNode
  action?: ReactNode
  variant?: "default" | "destructive"
}

type ToastContextType = {
  toasts: ToastType[]
  toast: (toast: Omit<ToastType, "id">) => void
  removeToast: (id: string) => void
}

const ToastContext = createContext<ToastContextType | undefined>(undefined)

let toastId = 0

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastType[]>([])

  const toast = (toast: Omit<ToastType, "id">) => {
    const id = (++toastId).toString()
    setToasts((prev) => [...prev, { ...toast, id }])
    setTimeout(() => removeToast(id), 4000) // auto-remove after 4s
  }

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }

  return (
    <ToastContext.Provider value={{ toasts, toast, removeToast }}>
      {children}
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error("useToast must be used within a ToastProvider")
  return ctx
}