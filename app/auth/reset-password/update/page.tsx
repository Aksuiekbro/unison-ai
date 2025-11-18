import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { UpdatePasswordForm } from "@/components/update-password-form"

export default function CompletePasswordResetPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md">
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Choose a new password</CardTitle>
            <CardDescription>You're signed in securely. Set a new password to finish resetting your account.</CardDescription>
          </CardHeader>
          <CardContent>
            <UpdatePasswordForm />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
