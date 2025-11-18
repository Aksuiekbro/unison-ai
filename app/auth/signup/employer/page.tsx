import { SignupForm } from "@/components/signup-form"
import { Building2, Sparkles } from "lucide-react"
import Link from "next/link"

export default function EmployerSignupLanding() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-purple-50 py-10">
      <div className="mx-auto grid w-full max-w-5xl gap-10 px-4 md:grid-cols-2">
        <div className="space-y-6 rounded-3xl border border-purple-100 bg-white/80 p-8 shadow-sm">
          <Link href="/" className="text-2xl font-bold text-purple-900">
            UnisonAI
          </Link>
          <div>
            <p className="inline-flex items-center rounded-full bg-purple-100 px-3 py-1 text-xs font-semibold text-purple-700">
              <Sparkles className="mr-1 h-3 w-3" /> Tailored for hiring teams
            </p>
            <h1 className="mt-4 text-3xl font-bold text-gray-900">Scale your hiring with AI insights</h1>
            <p className="mt-3 text-base text-gray-600">
              Post openings, review AI-enriched candidate profiles, and collaborate with your team in one shared workspace.
            </p>
          </div>
          <div className="rounded-2xl border border-dashed border-purple-200 bg-purple-50/80 p-6">
            <div className="flex items-center gap-4">
              <div className="rounded-2xl bg-white p-3 text-purple-600">
                <Building2 className="h-6 w-6" />
              </div>
              <div>
                <p className="font-semibold text-gray-900">Employer account includes</p>
                <ul className="mt-2 space-y-1 text-sm text-gray-600">
                  <li>• Unlimited job postings</li>
                  <li>• Candidate recommendations with personality insights</li>
                  <li>• Team collaboration and interview notes</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
        <div className="flex items-center">
          <SignupForm
            initialRole="employer"
            locked
            title="Create your employer account"
            description="Access the employer workspace tailored to hiring managers and talent teams."
          />
        </div>
      </div>
    </div>
  )
}
