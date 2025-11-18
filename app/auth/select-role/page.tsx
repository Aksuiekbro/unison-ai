import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Building2, Search } from "lucide-react"

const roles = [
  {
    id: "employer",
    title: "Employer",
    description: "Post roles, review AI summaries, and move fast with collaborative hiring tools.",
    icon: Building2,
    href: "/auth/signup/employer",
    color: "bg-purple-100 text-purple-700",
  },
  {
    id: "job-seeker",
    title: "Job Seeker",
    description: "Showcase your strengths and unlock curated opportunities powered by AI.",
    icon: Search,
    href: "/auth/signup/job-seeker",
    color: "bg-emerald-100 text-emerald-700",
  },
]

export default function SelectRolePage() {
  return (
    <div className="min-h-screen bg-gray-50 py-10">
      <div className="mx-auto w-full max-w-5xl px-4">
        <div className="mb-10 text-center">
          <h1 className="text-3xl font-bold text-gray-900">Who are you signing up as?</h1>
          <p className="mt-2 text-gray-600">Pick the experience that matches your goals. We'll tailor the onboarding journey automatically.</p>
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          {roles.map(({ id, title, description, icon: Icon, href, color }) => (
            <Card key={id} className="flex flex-col">
              <CardHeader>
                <div className={`mb-4 inline-flex w-fit items-center gap-2 rounded-full px-3 py-1 text-sm font-medium ${color}`}>
                  <Icon className="h-4 w-4" /> {title}
                </div>
                <CardTitle>{title}</CardTitle>
                <CardDescription>{description}</CardDescription>
              </CardHeader>
              <CardContent className="mt-auto">
                <Button asChild className="w-full">
                  <Link href={href}>Continue as {title}</Link>
                </Button>
                <p className="mt-3 text-center text-xs text-gray-500">You'll land on a tailored signup page with the right form preselected.</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}
