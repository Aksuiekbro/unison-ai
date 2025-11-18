import { redirect } from "next/navigation"

export default function LegacyJobSeekerRegisterRedirect() {
  redirect("/auth/signup/job-seeker")
}
