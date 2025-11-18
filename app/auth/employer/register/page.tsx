import { redirect } from "next/navigation"

export default function LegacyEmployerRegisterRedirect() {
  redirect("/auth/signup/employer")
}
