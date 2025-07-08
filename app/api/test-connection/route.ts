import { type NextRequest, NextResponse } from "next/server"

// Ruta para probar la conexión con Resend
export async function GET(request: NextRequest) {
  try {
    const apiKey = process.env.RESEND_API_KEY

    return NextResponse.json({
      timestamp: new Date().toISOString(),
      hasApiKey: !!apiKey,
      apiKeyLength: apiKey?.length || 0,
      apiKeyPrefix: apiKey?.substring(0, 8) || "none",
      apiKeyValid: apiKey?.startsWith("re_") || false,
      message: apiKey ? "API Key configurada correctamente" : "API Key no encontrada",
    })
  } catch (error) {
    return NextResponse.json(
      {
        error: "Error verificando conexión",
        details: error instanceof Error ? error.message : "Error desconocido",
      },
      { status: 500 },
    )
  }
}
