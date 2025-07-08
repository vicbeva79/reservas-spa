"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Mail, CheckCircle, AlertCircle, Loader2 } from "lucide-react"

export function TestEmailButton() {
  const [enviando, setEnviando] = useState(false)
  const [resultado, setResultado] = useState<{ tipo: "exito" | "error"; mensaje: string } | null>(null)

  const enviarEmailPrueba = async () => {
    setEnviando(true)
    setResultado(null)

    try {
      const response = await fetch("/api/test-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      })

      const data = await response.json()

      if (response.ok) {
        setResultado({
          tipo: "exito",
          mensaje: "¡Email de prueba enviado! Revisa tu bandeja de entrada (y spam).",
        })
      } else {
        setResultado({
          tipo: "error",
          mensaje: `Error: ${data.error || "No se pudo enviar el email"}`,
        })
      }
    } catch (error) {
      setResultado({
        tipo: "error",
        mensaje: "Error de conexión. Verifica tu internet e inténtalo de nuevo.",
      })
    } finally {
      setEnviando(false)
    }
  }

  return (
    <Card className="border-blue-200 bg-blue-50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="h-5 w-5" />
          Probar Notificaciones
        </CardTitle>
        <CardDescription>
          Envía un email de prueba a acuaria.carralero@gmail.com para verificar que las notificaciones funcionan
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button onClick={enviarEmailPrueba} disabled={enviando} className="w-full">
          {enviando ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Enviando...
            </>
          ) : (
            <>
              <Mail className="mr-2 h-4 w-4" />
              Enviar Email de Prueba
            </>
          )}
        </Button>

        {resultado && (
          <div
            className={`flex items-center gap-2 p-3 rounded-lg ${
              resultado.tipo === "exito"
                ? "bg-green-50 text-green-800 border border-green-200"
                : "bg-red-50 text-red-800 border border-red-200"
            }`}
          >
            {resultado.tipo === "exito" ? <CheckCircle className="h-5 w-5" /> : <AlertCircle className="h-5 w-5" />}
            <span className="text-sm">{resultado.mensaje}</span>
          </div>
        )}

        <div className="text-xs text-gray-600 space-y-1">
          <p>
            <strong>📧 Email configurado:</strong> acuaria.carralero@gmail.com
          </p>
          <p>
            <strong>🔑 API Key:</strong> re_71qisyV5_GqaKPS8bPTHr7fkgNGm8mzqgy
          </p>
          <p>
            <strong>💡 Tip:</strong> Si no recibes el email, revisa la carpeta de spam
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
