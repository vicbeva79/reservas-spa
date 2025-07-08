import { type NextRequest, NextResponse } from "next/server"

// Permitir tanto GET como POST
export async function GET(request: NextRequest) {
  return testResendDirect()
}

export async function POST(request: NextRequest) {
  return testResendDirect()
}

async function testResendDirect() {
  try {
    const apiKey = process.env.RESEND_API_KEY

    if (!apiKey) {
      return NextResponse.json({ error: "No API key found" }, { status: 500 })
    }

    console.log("🔑 Probando API key directamente...")
    console.log("🔑 Key length:", apiKey.length)
    console.log("🔑 Key prefix:", apiKey.substring(0, 10))

    // Probar directamente con fetch (sin el cliente Resend)
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Acuaria Spa <onboarding@resend.dev>",
        to: ["acuaria.carralero@gmail.com"],
        subject: "🧪 Prueba Directa - API Resend",
        html: "<h1>Prueba directa con fetch</h1><p>Si recibes este email, la API key funciona correctamente.</p>",
      }),
    })

    const responseData = await response.text()
    console.log("📧 Respuesta de Resend:", response.status, responseData)

    let parsedData
    try {
      parsedData = JSON.parse(responseData)
    } catch {
      parsedData = responseData
    }

    return NextResponse.json({
      success: response.ok,
      status: response.status,
      statusText: response.statusText,
      headers: Object.fromEntries(response.headers.entries()),
      data: parsedData,
      rawResponse: responseData,
      apiKeyUsed: `${apiKey.substring(0, 10)}...${apiKey.slice(-5)}`,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("💥 Error en prueba directa:", error)
    return NextResponse.json(
      {
        error: "Error en prueba directa",
        details: error instanceof Error ? error.message : "Error desconocido",
        stack: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 },
    )
  }
}
