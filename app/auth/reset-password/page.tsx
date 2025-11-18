import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { PasswordResetRequestForm } from "@/components/password-reset-request-form"
import Link from "next/link"

export default function ResetPasswordPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md">
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Reset your password</CardTitle>
            <CardDescription>We'll send you a secure link to choose a new password.</CardDescription>
          </CardHeader>
          <CardContent>
            <PasswordResetRequestForm submitLabel="Email me the link" />
            <div className="mt-4 text-center text-sm">
              Remembered it?{" "}
              <Link href="/auth/login" className="font-medium text-purple-600 hover:underline">
                Return to login
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
