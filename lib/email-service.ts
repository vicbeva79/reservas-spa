// -------- 🔑 NUEVA API KEY DE RESEND --------
// @ts-ignore
export const RESEND_API_KEY = typeof window === 'undefined' && typeof process !== 'undefined' && process.env.RESEND_API_KEY ? process.env.RESEND_API_KEY : ''

console.log("🔑 RESEND API KEY configurada:", RESEND_API_KEY.substring(0, 10) + "...")

// Servicio de notificaciones por email usando Resend
interface EmailNotification {
  to: string
  subject: string
  html: string
}

interface ReservaEmail {
  nombre_cliente: string
  telefono: string
  fecha: string
  hora: string
  numero_personas: number
}

export const emailService = {
  // Enviar notificación de nueva reserva al administrador
  async notificarNuevaReserva(reserva: ReservaEmail): Promise<boolean> {
    try {
      const response = await fetch("/api/send-notification", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type: "nueva_reserva",
          reserva,
        }),
      })

      return response.ok
    } catch (error) {
      console.error("Error enviando notificación:", error)
      return false
    }
  },

  // Enviar confirmación al cliente
  async enviarConfirmacionCliente(email: string, reserva: ReservaEmail): Promise<boolean> {
    try {
      const response = await fetch("/api/send-confirmation", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          reserva,
        }),
      })

      return response.ok
    } catch (error) {
      console.error("Error enviando confirmación:", error)
      return false
    }
  },

  // Enviar recordatorio diario de citas
  async enviarResumenDiario(fecha: string): Promise<boolean> {
    try {
      const response = await fetch("/api/send-daily-summary", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fecha,
        }),
      })

      return response.ok
    } catch (error) {
      console.error("Error enviando resumen diario:", error)
      return false
    }
  },
}
