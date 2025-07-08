import { type NextRequest, NextResponse } from "next/server"

// Esta función se puede llamar automáticamente con un cron job
export async function GET(request: NextRequest) {
  try {
    // Obtener la fecha de mañana para enviar el resumen
    const mañana = new Date()
    mañana.setDate(mañana.getDate() + 1)
    const fechaMañana = mañana.toISOString().split("T")[0]

    // Enviar resumen del día siguiente
    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/send-daily-summary`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        fecha: fechaMañana,
      }),
    })

    if (response.ok) {
      return NextResponse.json({ success: true, message: "Resumen diario enviado" })
    } else {
      return NextResponse.json({ error: "Error enviando resumen" }, { status: 500 })
    }
  } catch (error) {
    console.error("Error en cron job:", error)
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}
