import { NextResponse } from "next/server"
import { forgotPasswordSchema, sendPasswordResetEmail } from "@/lib/auth/password-reset"

export async function POST(request: Request) {
  try {
    const raw = await request.json().catch(() => null)
    const parsed = forgotPasswordSchema.safeParse(raw)

    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          message: "We couldn't process your request.",
          errors: parsed.error.flatten().fieldErrors,
        },
        { status: 400 }
      )
    }

    const result = await sendPasswordResetEmail(parsed.data.email)
    return NextResponse.json(result)
  } catch (error) {
    console.error("Forgot password API error", error)
    return NextResponse.json(
      {
        success: false,
        message: "Unable to process password reset right now. Please try again shortly.",
      },
      { status: 500 }
    )
  }
}
