import { type NextRequest, NextResponse } from "next/server"

// Ruta temporal para verificar variables de entorno
export async function GET(request: NextRequest) {
  try {
    const apiKey = process.env.RESEND_API_KEY

    return NextResponse.json({
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      hasApiKey: !!apiKey,
      apiKeyLength: apiKey?.length || 0,
      apiKeyPrefix: apiKey?.substring(0, 5) || "none",
      apiKeyValid: apiKey?.startsWith("re_") || false,
      allEnvKeys: Object.keys(process.env).filter((key) => key.includes("RESEND") || key.includes("NEXT_PUBLIC")),
    })
  } catch (error) {
    return NextResponse.json(
      {
        error: "Error checking environment",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
