import { type NextRequest, NextResponse } from "next/server"

// 🔑 NUEVA API KEY DIRECTAMENTE EN EL CÓDIGO
const RESEND_API_KEY = "re_NbaWWpQC_LPgTDPujxXrGpurYzjtGozF7"

export async function POST(request: NextRequest) {
  try {
    const { type, reserva } = await request.json()

    if (type === "nueva_reserva") {
      console.log("📧 Enviando notificación de nueva reserva...")

      // Email al administrador sobre nueva reserva usando fetch directo
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "Acuaria Spa <onboarding@resend.dev>",
          to: ["acuaria.carralero@gmail.com"],
          subject: "🆕 Nueva Reserva - Acuaria Spa",
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; text-align: center;">
                <h1 style="color: white; margin: 0;">Nueva Reserva Recibida</h1>
              </div>
              
              <div style="padding: 20px; background: #f8f9fa;">
                <h2 style="color: #333;">📅 Detalles de la Reserva</h2>
                
                <div style="background: white; padding: 15px; border-radius: 8px; margin: 10px 0;">
                  <p><strong>👤 Cliente:</strong> ${reserva.nombre_cliente}</p>
                  <p><strong>📞 Teléfono:</strong> ${reserva.telefono}</p>
                  <p><strong>📅 Fecha:</strong> ${new Date(reserva.fecha).toLocaleDateString("es-ES", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}</p>
                  <p><strong>⏰ Hora:</strong> ${reserva.hora}</p>
                  <p><strong>👥 Personas:</strong> ${reserva.numero_personas}</p>
                </div>
                
                <div style="text-align: center; margin-top: 20px;">
                  <a href="https://reservas-acuaria.vercel.app" 
                     style="background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                    Ver en la App
                  </a>
                </div>
              </div>
              
              <div style="background: #e9ecef; padding: 15px; text-align: center; font-size: 12px; color: #666;">
                <p>Acuaria Wellness & Spa - Sistema de Reservas</p>
              </div>
            </div>
          `,
        }),
      })

      const responseData = await response.text()
      let parsedData
      try {
        parsedData = JSON.parse(responseData)
      } catch {
        parsedData = responseData
      }

      if (!response.ok) {
        console.error("❌ Error enviando email:", parsedData)
        return NextResponse.json({ error: "Error enviando email" }, { status: 500 })
      }

      console.log("✅ Notificación enviada exitosamente")
      return NextResponse.json({ success: true, data: parsedData })
    }

    return NextResponse.json({ error: "Tipo de notificación no válido" }, { status: 400 })
  } catch (error) {
    console.error("Error en API de notificaciones:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
