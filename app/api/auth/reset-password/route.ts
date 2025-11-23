import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase-server"
import { resetPasswordSchema, updatePassword } from "@/lib/auth/password-reset"

export async function POST(request: Request) {
  try {
    const raw = await request.json().catch(() => null)
    const parsed = resetPasswordSchema.safeParse(raw)

    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          message: "Please fix the highlighted fields and try again.",
          errors: parsed.error.flatten().fieldErrors,
        },
        { status: 400 }
      )
    }

    const supabase = await createClient()
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json(
        {
          success: false,
          message: "Your recovery session has expired. Please restart the password reset process.",
        },
        { status: 401 }
      )
    }

    const result = await updatePassword(supabase, parsed.data.password)
    const status = result.success ? 200 : 400
    return NextResponse.json(result, { status })
  } catch (error) {
    console.error("Reset password API error", error)
    return NextResponse.json(
      {
        success: false,
        message: "Unable to update password right now. Please try again shortly.",
      },
      { status: 500 }
    )
  }
}
