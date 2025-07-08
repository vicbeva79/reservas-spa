import { type NextRequest, NextResponse } from "next/server"

// 🔑 NUEVA API KEY DIRECTAMENTE EN EL CÓDIGO
const RESEND_API_KEY = "re_NbaWWpQC_LPgTDPujxXrGpurYzjtGozF7"

export async function POST(request: NextRequest) {
  try {
    console.log("🧪 Iniciando test de email con nueva API key...")
    console.log("🔑 API Key configurada:", RESEND_API_KEY.substring(0, 10) + "...")

    // Usar fetch directo con la nueva API key
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Acuaria Spa <onboarding@resend.dev>",
        to: ["acuaria.carralero@gmail.com"],
        subject: "🎉 ¡FUNCIONA! - Sistema de Notificaciones Acuaria Spa",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; text-align: center;">
              <h1 style="color: white; margin: 0;">🎉 ¡SISTEMA FUNCIONANDO!</h1>
            </div>
            
            <div style="padding: 20px; background: #f8f9fa;">
              <h2 style="color: #333;">✅ ¡API Key Actualizada Correctamente!</h2>
              
              <div style="background: white; padding: 15px; border-radius: 8px; margin: 10px 0;">
                <p>¡Excelente! Tu sistema de notificaciones de Acuaria Spa ya está funcionando perfectamente.</p>
                
                <div style="background: #e8f5e8; padding: 15px; border-radius: 8px; margin: 15px 0;">
                  <h3 style="margin-top: 0; color: #2e7d32;">🚀 Sistema Completamente Operativo</h3>
                  <ul style="margin: 0; padding-left: 20px;">
                    <li><strong>✅ Nueva Reserva:</strong> Email inmediato cuando alguien reserve</li>
                    <li><strong>✅ Confirmación Cliente:</strong> Email automático al cliente</li>
                    <li><strong>✅ Resumen Diario:</strong> Lista de citas cada mañana</li>
                    <li><strong>✅ Panel Admin:</strong> Gestión completa de reservas</li>
                  </ul>
                </div>
                
                <div style="background: #fff3e0; padding: 10px; border-radius: 6px; margin: 15px 0;">
                  <p style="margin: 0; color: #f57c00;"><strong>🎯 Próximo Paso:</strong> ¡Haz una reserva de prueba para verificar todo el flujo!</p>
                </div>
              </div>
              
              <div style="text-align: center; margin-top: 20px;">
                <p><strong>Tu aplicación está lista para recibir clientes</strong></p>
                <p><small>API Key actualizada: ${RESEND_API_KEY.substring(0, 10)}... - ${new Date().toISOString()}</small></p>
              </div>
            </div>
            
            <div style="background: #e9ecef; padding: 15px; text-align: center; font-size: 12px; color: #666;">
              <p>Acuaria Wellness & Spa - Sistema de Reservas</p>
              <p>🔥 Sistema completamente funcional y listo para usar</p>
            </div>
          </div>
        `,
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

    if (!response.ok) {
      console.error("❌ Error de Resend:", parsedData)
      return NextResponse.json(
        {
          error: "Error enviando email",
          details: parsedData,
          status: response.status,
          message: "Revisa los logs de Vercel para más detalles",
        },
        { status: 500 },
      )
    }

    console.log("✅ ¡EMAIL ENVIADO EXITOSAMENTE!", parsedData)
    return NextResponse.json({
      success: true,
      message: "¡Email de prueba enviado exitosamente con la nueva API key!",
      data: parsedData,
      timestamp: new Date().toISOString(),
      apiKeyUsed: RESEND_API_KEY.substring(0, 10) + "...",
    })
  } catch (error) {
    console.error("💥 Error crítico en API de prueba:", error)
    return NextResponse.json(
      {
        error: "Error interno del servidor",
        details: error instanceof Error ? error.message : "Error desconocido",
        stack: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 },
    )
  }
}
