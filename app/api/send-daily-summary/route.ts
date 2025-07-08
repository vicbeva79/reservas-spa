import { type NextRequest, NextResponse } from "next/server"
import { Resend } from "resend"
import { reservasService } from "@/lib/supabase"
import { RESEND_API_KEY } from "@/lib/email-service"
import { getResendClient } from "@/lib/resend-client"

const resend = new Resend(RESEND_API_KEY)

export async function POST(request: NextRequest) {
  try {
    const { fecha } = await request.json()

    // Obtener reservas del día
    const reservasDelDia = await reservasService.obtenerPorFecha(fecha)

    if (reservasDelDia.length === 0) {
      return NextResponse.json({ message: "No hay reservas para este día" })
    }

    // Generar HTML con las reservas
    const reservasHTML = reservasDelDia
      .sort((a, b) => a.hora.localeCompare(b.hora))
      .map(
        (reserva) => `
        <div style="background: white; padding: 12px; margin: 8px 0; border-radius: 6px; border-left: 3px solid #667eea;">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <div>
              <strong>${reserva.hora.substring(0, 5)}</strong> - ${reserva.nombre_cliente}
            </div>
            <div style="font-size: 12px; color: #666;">
              📞 ${reserva.telefono} | 👥 ${reserva.numero_personas}
            </div>
          </div>
        </div>
      `,
      )
      .join("")

    // Enviar resumen diario
    const { data, error } = await getResendClient().emails.send({
      from: "Acuaria Spa <onboarding@resend.dev>",
      to: ["acuaria.carralero@gmail.com"], // Tu email
      subject: `📅 Resumen del día - ${new Date(fecha).toLocaleDateString("es-ES")} (${reservasDelDia.length} citas)`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; text-align: center;">
            <h1 style="color: white; margin: 0;">📅 Agenda del Día</h1>
            <p style="color: #e3f2fd; margin: 5px 0 0 0;">
              ${new Date(fecha).toLocaleDateString("es-ES", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
          </div>
          
          <div style="padding: 20px; background: #f8f9fa;">
            <div style="background: #e8f5e8; padding: 15px; border-radius: 8px; margin-bottom: 20px; text-align: center;">
              <h2 style="margin: 0; color: #2e7d32;">
                ${reservasDelDia.length} ${reservasDelDia.length === 1 ? "Cita Programada" : "Citas Programadas"}
              </h2>
            </div>
            
            <h3 style="color: #333; margin-bottom: 15px;">🕐 Horarios de Hoy</h3>
            ${reservasHTML}
            
            <div style="background: #fff3e0; padding: 15px; border-radius: 8px; margin-top: 20px;">
              <h4 style="margin-top: 0; color: #f57c00;">💡 Recordatorios</h4>
              <ul style="margin: 0; padding-left: 20px; color: #666;">
                <li>Preparar las instalaciones 15 min antes</li>
                <li>Verificar que todo esté listo para cada sesión</li>
                <li>Contactar clientes si hay algún cambio</li>
              </ul>
            </div>
          </div>
          
          <div style="background: #e9ecef; padding: 15px; text-align: center; font-size: 12px; color: #666;">
            <p>Acuaria Wellness & Spa - Sistema de Reservas</p>
            <p>Este resumen se envía automáticamente cada día con citas programadas</p>
          </div>
        </div>
      `,
    })

    if (error) {
      console.error("Error enviando resumen diario:", error)
      return NextResponse.json({ error: "Error enviando resumen" }, { status: 500 })
    }

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error("Error en API de resumen diario:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
