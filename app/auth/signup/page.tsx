import { SignupForm } from "@/components/signup-form"
import { Logotype } from "@/components/logotype"
import Link from "next/link"

export default function SignupPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md">
        <div className="mb-8 flex justify-center">
          <Link href="/" className="flex items-center gap-2 text-2xl font-semibold">
            <Logotype className="h-8 w-8" />
            <span>UnisonAI</span>
          </Link>
        </div>
        <SignupForm />
      </div>
    </div>
  )
}