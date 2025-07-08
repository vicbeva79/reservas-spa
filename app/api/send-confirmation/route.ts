import { type NextRequest, NextResponse } from "next/server"

// 🔑 NUEVA API KEY DIRECTAMENTE EN EL CÓDIGO
const RESEND_API_KEY = "re_NbaWWpQC_LPgTDPujxXrGpurYzjtGozF7"

export async function POST(request: NextRequest) {
  try {
    const { email, reserva } = await request.json()

    console.log("📧 Enviando confirmación al cliente:", email)

    // Email de confirmación al cliente usando fetch directo
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Acuaria Spa <onboarding@resend.dev>",
        to: [email],
        subject: "✅ Confirmación de Reserva - Acuaria Spa",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; text-align: center;">
              <h1 style="color: white; margin: 0;">¡Reserva Confirmada!</h1>
            </div>
            
            <div style="padding: 20px; background: #f8f9fa;">
              <p>Hola <strong>${reserva.nombre_cliente}</strong>,</p>
              <p>Tu reserva en Acuaria Spa ha sido confirmada exitosamente.</p>
              
              <div style="background: white; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #667eea;">
                <h3 style="margin-top: 0; color: #333;">📋 Detalles de tu Cita</h3>
                <p><strong>📅 Fecha:</strong> ${new Date(reserva.fecha).toLocaleDateString("es-ES", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}</p>
                <p><strong>⏰ Hora:</strong> ${reserva.hora}</p>
                <p><strong>👥 Personas:</strong> ${reserva.numero_personas}</p>
                <p><strong>⏱️ Duración:</strong> 60 minutos</p>
              </div>
              
              <div style="background: #e3f2fd; padding: 15px; border-radius: 8px; margin: 20px 0;">
                <h4 style="margin-top: 0; color: #1976d2;">📍 Información Importante</h4>
                <ul style="margin: 0; padding-left: 20px;">
                  <li>Llega 10 minutos antes de tu cita</li>
                  <li>Trae ropa cómoda y toalla</li>
                  <li>Si necesitas cancelar, hazlo con 24h de antelación</li>
                </ul>
              </div>
              
              <div style="text-align: center; margin-top: 20px;">
                <p>¿Necesitas hacer cambios?</p>
                <a href="tel:${reserva.telefono}" 
                   style="background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin: 5px;">
                  📞 Llamar
                </a>
              </div>
            </div>
            
            <div style="background: #e9ecef; padding: 15px; text-align: center; font-size: 12px; color: #666;">
              <p>Acuaria Wellness & Spa - Falla Plaça Espanyoleto</p>
              <p>¡Te esperamos para una experiencia de relajación única!</p>
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
      console.error("❌ Error enviando confirmación:", parsedData)
      return NextResponse.json({ error: "Error enviando confirmación" }, { status: 500 })
    }

    console.log("✅ Confirmación enviada exitosamente")
    return NextResponse.json({ success: true, data: parsedData })
  } catch (error) {
    console.error("Error en API de confirmación:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
