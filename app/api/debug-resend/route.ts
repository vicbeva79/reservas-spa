import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const apiKey = process.env.RESEND_API_KEY

    // Diagnóstico completo
    const diagnosis = {
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      hasApiKey: !!apiKey,
      apiKeyLength: apiKey?.length || 0,
      apiKeyPrefix: apiKey?.substring(0, 10) || "none",
      apiKeySuffix: apiKey?.slice(-10) || "none",
      apiKeyValid: apiKey?.startsWith("re_") || false,
      expectedKey: "re_71qisyV5_GqaKPS8bPTHr7fkgNGm8mzqgy",
      keysMatch: apiKey === "re_71qisyV5_GqaKPS8bPTHr7fkgNGm8mzqgy",
      allResendVars: Object.keys(process.env).filter((key) => key.includes("RESEND")),
      // Verificar si hay caracteres invisibles
      keyHex: apiKey ? Buffer.from(apiKey).toString("hex") : "none",
    }

    return NextResponse.json(diagnosis, { status: 200 })
  } catch (error) {
    return NextResponse.json(
      {
        error: "Error en diagnóstico",
        details: error instanceof Error ? error.message : "Error desconocido",
      },
      { status: 500 },
    )
  }
}
