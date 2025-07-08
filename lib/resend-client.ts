/**
 * Helper para obtener (y reutilizar) el cliente de Resend.
 * Se crea únicamente cuando la API key está disponible.
 */
import { Resend } from "resend"

let resendClient: Resend | null = null

export function getResendClient() {
  try {
    const key = process.env.RESEND_API_KEY

    console.log("🔍 Verificando API key...")
    console.log("- Key existe:", !!key)
    console.log("- Key length:", key?.length || 0)
    console.log("- Key starts with re_:", key?.startsWith("re_") || false)

    if (!key || !key.startsWith("re_")) {
      throw new Error(`RESEND_API_KEY no definida o inválida. Key: ${key ? "presente pero inválida" : "no presente"}`)
    }

    if (!resendClient) {
      console.log("🔌 Creando nuevo cliente Resend...")
      resendClient = new Resend(key)
      console.log("✅ Cliente Resend creado exitosamente")
    }

    return resendClient
  } catch (error) {
    console.error("💥 Error creando cliente Resend:", error)
    throw error
  }
}
