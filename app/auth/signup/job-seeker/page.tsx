import { SignupForm } from "@/components/signup-form"
import { ArrowRight, Briefcase } from "lucide-react"
import Link from "next/link"

export default function JobSeekerSignupLanding() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-white py-10">
      <div className="mx-auto grid w-full max-w-5xl gap-10 px-4 md:grid-cols-2">
        <div className="space-y-6 rounded-3xl border border-emerald-100 bg-white p-8 shadow-sm">
          <Link href="/" className="text-2xl font-bold text-emerald-900">
            UnisonAI
          </Link>
          <div>
            <p className="inline-flex items-center rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
              <ArrowRight className="mr-1 h-3 w-3" /> Built for modern candidates
            </p>
            <h1 className="mt-4 text-3xl font-bold text-gray-900">Find roles that match your strengths</h1>
            <p className="mt-3 text-base text-gray-600">
              Tell us about your experience and goals. We will surface the right opportunities and help you stand out with AI-personalized insights.
            </p>
          </div>
          <div className="rounded-2xl border border-dashed border-emerald-200 bg-emerald-50/80 p-6">
            <div className="flex items-center gap-4">
              <div className="rounded-2xl bg-white p-3 text-emerald-600">
                <Briefcase className="h-6 w-6" />
              </div>
              <div>
                <p className="font-semibold text-gray-900">Job seeker account unlocks</p>
                <ul className="mt-2 space-y-1 text-sm text-gray-600">
                  <li>• Curated job matches</li>
                  <li>• Personality-driven profile boosts</li>
                  <li>• Application tracking & interview prep</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
        <div className="flex items-center">
          <SignupForm
            initialRole="employee"
            locked
            title="Create your candidate profile"
            description="Join the UnisonAI talent network and unlock personalized job matches."
          />
        </div>
      </div>
    </div>
  )
}
