"use client"

import { useState, useEffect } from "react"
import { Calendar } from "@/components/ui/calendar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Clock, User, CalendarIcon, CheckCircle, Loader2, AlertTriangle, Edit, Trash2, X, Save } from "lucide-react"
import { format, addMinutes } from "date-fns"
import { es } from "date-fns/locale"
import { reservasService, type Reserva } from "@/lib/supabase"
import { emailService } from "@/lib/email-service"
import { TestEmailButton } from "@/components/test-email-button"

// Generar horarios: Mañana 10:00-12:30, Tarde 15:00-17:30
const generarHorarios = () => {
  const horarios = []

  // Horarios de mañana: 10:00 a 12:30 (última cita)
  const inicioMañana = new Date()
  inicioMañana.setHours(10, 0, 0, 0)

  for (let i = 0; i <= 10; i++) {
    // 10 slots de 15 min = 2.5 horas
    const hora = addMinutes(inicioMañana, i * 15)
    horarios.push(format(hora, "HH:mm"))
  }

  // Horarios de tarde: 15:00 a 17:30 (última cita)
  const inicioTarde = new Date()
  inicioTarde.setHours(15, 0, 0, 0)

  for (let i = 0; i <= 10; i++) {
    // 10 slots de 15 min = 2.5 horas
    const hora = addMinutes(inicioTarde, i * 15)
    horarios.push(format(hora, "HH:mm"))
  }

  return horarios
}

const HORARIOS_DISPONIBLES = generarHorarios()

export default function ReservasApp() {
  const [fechaSeleccionada, setFechaSeleccionada] = useState<Date>()
  const [reservas, setReservas] = useState<Reserva[]>([])
  const [horarioSeleccionado, setHorarioSeleccionado] = useState<string>("")
  const [nombreCliente, setNombreCliente] = useState("")
  const [mostrandoFormulario, setMostrandoFormulario] = useState(false)
  const [reservaExitosa, setReservaExitosa] = useState(false)
  const [telefono, setTelefono] = useState("")
  const [numeroPersonas, setNumeroPersonas] = useState(1)
  const [cargando, setCargando] = useState(false)
  const [cargandoReservas, setCargandoReservas] = useState(true)
  const [emailCliente, setEmailCliente] = useState("")

  const [modoAdministrador, setModoAdministrador] = useState(false)
  const [mostrandoLogin, setMostrandoLogin] = useState(false)
  const [contraseñaAdmin, setContraseñaAdmin] = useState("")

  // Estados para edición de reservas
  const [editandoReserva, setEditandoReserva] = useState<number | null>(null)
  const [datosEdicion, setDatosEdicion] = useState<Partial<Reserva>>({})

  // Cargar reservas al iniciar
  useEffect(() => {
    cargarReservas()
  }, [])

  const cargarReservas = async () => {
    try {
      setCargandoReservas(true)
      const todasLasReservas = await reservasService.obtenerTodas()
      setReservas(todasLasReservas)
    } catch (error) {
      console.error("Error al cargar reservas:", error)
      alert("Error al cargar las reservas. Por favor, recarga la página.")
    } finally {
      setCargandoReservas(false)
    }
  }

  // Función para calcular horarios ocupados (MEJORADA)
  const calcularHorariosOcupados = (fecha: Date): string[] => {
    const fechaStr = format(fecha, "yyyy-MM-dd")
    const reservasDelDia = reservas.filter((reserva) => reserva.fecha === fechaStr)

    const horariosOcupados: string[] = []

    reservasDelDia.forEach((reserva) => {
      const horaInicio = reserva.hora
      // Normalizar formato de hora (quitar segundos si los tiene)
      const horaNormalizada = horaInicio.substring(0, 5) // "11:00:00" -> "11:00"
      const indexInicio = HORARIOS_DISPONIBLES.indexOf(horaNormalizada)

      if (indexInicio !== -1) {
        // 🔧 NUEVO: Bloquear 3 slots ANTERIORES (preparación/limpieza)
        for (let i = -3; i < 4; i++) {
          const indexBloqueado = indexInicio + i
          if (indexBloqueado >= 0 && indexBloqueado < HORARIOS_DISPONIBLES.length) {
            const horaBloqueada = HORARIOS_DISPONIBLES[indexBloqueado]
            horariosOcupados.push(horaBloqueada)
          }
        }
      }
    })

    return [...new Set(horariosOcupados)].sort()
  }

  // Calcular horarios disponibles para la fecha seleccionada
  const obtenerHorariosDisponibles = (): string[] => {
    if (!fechaSeleccionada) {
      return HORARIOS_DISPONIBLES
    }

    const ocupados = calcularHorariosOcupados(fechaSeleccionada)
    const disponibles = HORARIOS_DISPONIBLES.filter((hora) => !ocupados.includes(hora))
    return disponibles
  }

  const realizarReserva = async () => {
    if (!fechaSeleccionada || !horarioSeleccionado || !nombreCliente.trim() || !telefono.trim()) {
      return
    }

    try {
      setCargando(true)

      const nuevaReserva = {
        fecha: format(fechaSeleccionada, "yyyy-MM-dd"),
        hora: horarioSeleccionado,
        nombre_cliente: nombreCliente.trim(),
        telefono: telefono.trim(),
        numero_personas: numeroPersonas,
      }

      const reservaCreada = await reservasService.crear(nuevaReserva)

      // 📧 Enviar notificaciones por email
      try {
        // Notificar al administrador
        await emailService.notificarNuevaReserva(nuevaReserva)

        // Enviar confirmación al cliente si proporcionó email
        if (emailCliente.trim()) {
          await emailService.enviarConfirmacionCliente(emailCliente.trim(), nuevaReserva)
        }
      } catch (emailError) {
        console.error("Error enviando emails:", emailError)
        // No bloquear la reserva si falla el email
      }

      // Actualizar el estado inmediatamente
      setReservas((prevReservas) => [...prevReservas, reservaCreada])

      // Resetear formulario
      setNombreCliente("")
      setTelefono("")
      setEmailCliente("")
      setNumeroPersonas(1)
      setHorarioSeleccionado("")
      setMostrandoFormulario(false)
      setReservaExitosa(true)

      setTimeout(() => setReservaExitosa(false), 3000)
    } catch (error) {
      console.error("Error al realizar reserva:", error)
      alert("Error al realizar la reserva. Por favor, inténtalo de nuevo.")
    } finally {
      setCargando(false)
    }
  }

  const eliminarReserva = async (id: number) => {
    if (!confirm("¿Estás seguro de que quieres eliminar esta reserva?")) {
      return
    }

    try {
      await reservasService.eliminar(id)
      setReservas((prev) => prev.filter((r) => r.id !== id))
      alert("Reserva eliminada exitosamente")
    } catch (error) {
      console.error("Error al eliminar reserva:", error)
      alert("Error al eliminar la reserva")
    }
  }

  const iniciarEdicion = (reserva: Reserva) => {
    setEditandoReserva(reserva.id!)
    setDatosEdicion({
      nombre_cliente: reserva.nombre_cliente,
      telefono: reserva.telefono,
      numero_personas: reserva.numero_personas,
    })
  }

  const cancelarEdicion = () => {
    setEditandoReserva(null)
    setDatosEdicion({})
  }

  const guardarEdicion = async () => {
    if (!editandoReserva || !datosEdicion.nombre_cliente?.trim() || !datosEdicion.telefono?.trim()) {
      return
    }

    try {
      // Aquí necesitarías implementar la función de actualización en el servicio
      // Por ahora, actualizamos localmente
      setReservas((prev) =>
        prev.map((r) =>
          r.id === editandoReserva
            ? {
                ...r,
                nombre_cliente: datosEdicion.nombre_cliente!,
                telefono: datosEdicion.telefono!,
                numero_personas: datosEdicion.numero_personas!,
              }
            : r,
        ),
      )
      setEditandoReserva(null)
      setDatosEdicion({})
      alert("Reserva actualizada exitosamente")
    } catch (error) {
      console.error("Error al actualizar reserva:", error)
      alert("Error al actualizar la reserva")
    }
  }

  const loginAdministrador = () => {
    if (contraseñaAdmin === "Carralero1112") {
      setModoAdministrador(true)
      setMostrandoLogin(false)
      setContraseñaAdmin("")
    } else {
      alert("Contraseña incorrecta")
    }
  }

  const cerrarSesionAdmin = () => {
    setModoAdministrador(false)
    setEditandoReserva(null)
    setDatosEdicion({})
  }

  // Obtener horarios disponibles y reservas del día
  const horariosDisponibles = obtenerHorariosDisponibles()
  const reservasDelDia = fechaSeleccionada
    ? reservas.filter((r) => r.fecha === format(fechaSeleccionada, "yyyy-MM-dd"))
    : []

  if (cargandoReservas) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <Card className="p-6">
          <CardContent className="flex items-center gap-3">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span>Cargando reservas...</span>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-2 sm:p-4">
      <div className="max-w-4xl mx-auto space-y-4 sm:space-y-6">
        {/* Header con logos reorganizado */}
        <div className="text-center space-y-4 px-2">
          {/* Logo principal de Acuaria - DESTACADO */}
          <div className="flex justify-center mb-8">
            <div className="flex flex-col items-center">
              <img
                src="/images/acuaria-spa.webp"
                alt="Acuaria Wellness & Spa"
                className="h-20 sm:h-28 lg:h-32 w-auto object-contain drop-shadow-lg"
              />
            </div>
          </div>

          {/* Título con logo de la falla en menor tamaño */}
          <div className="space-y-4">
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">
              Reservas Spa para equipos fútbol sala
            </h1>

            <div className="flex items-center justify-center gap-3">
              <img
                src="/images/logo-falla.jpg"
                alt="Falla Plaça Espanyoleto"
                className="h-10 w-10 object-contain rounded-full shadow-sm"
              />
              <span className="text-sm text-gray-600 font-medium">Falla Plaça Espanyoleto</span>
            </div>
          </div>

          <p className="text-sm sm:text-base text-gray-600 mt-4">
            Selecciona una fecha y horario para tu cita de relajación
          </p>

          <div className="flex items-center justify-center gap-2 text-xs text-green-600">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span>Conectado a la nube - Sincronización automática</span>
          </div>
        </div>

        <div className="flex flex-col items-center gap-4">
          <div className="flex justify-center">
            {!modoAdministrador ? (
              <Button variant="outline" size="sm" onClick={() => setMostrandoLogin(true)} className="text-xs">
                🔐 Panel Administrador
              </Button>
            ) : (
              <div className="flex items-center gap-2">
                <Badge variant="default" className="bg-green-600">
                  👨‍💼 Modo Administrador
                </Badge>
                <Button variant="outline" size="sm" onClick={cerrarSesionAdmin} className="text-xs bg-transparent">
                  Cerrar Sesión
                </Button>
              </div>
            )}
          </div>

          {/* Botón de prueba de email - solo para admin */}
          {modoAdministrador && (
            <div className="w-full max-w-md">
              <TestEmailButton />
            </div>
          )}
        </div>

        {/* Mensaje de éxito */}
        {reservaExitosa && (
          <Card className="border-green-200 bg-green-50">
            <CardContent className="flex items-center gap-2 p-4">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <span className="text-green-800 font-medium">
                ¡Reserva realizada con éxito! Los horarios se han actualizado.
              </span>
            </CardContent>
          </Card>
        )}

        {/* Modal de login administrador */}
        {mostrandoLogin && (
          <Card className="border-blue-200 bg-blue-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">🔐 Acceso Administrador</CardTitle>
              <CardDescription>Ingresa la contraseña para ver información completa de reservas</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password">Contraseña</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Ingresa la contraseña"
                  value={contraseñaAdmin}
                  onChange={(e) => setContraseñaAdmin(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && loginAdministrador()}
                />
              </div>
              <div className="flex gap-2">
                <Button onClick={loginAdministrador} className="flex-1">
                  Acceder
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setMostrandoLogin(false)
                    setContraseñaAdmin("")
                  }}
                >
                  Cancelar
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Calendario */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CalendarIcon className="h-5 w-5" />
                Seleccionar Fecha
              </CardTitle>
              <CardDescription>Elige el día para tu cita</CardDescription>
            </CardHeader>
            <CardContent>
              <Calendar
                mode="single"
                selected={fechaSeleccionada}
                onSelect={(date) => {
                  setFechaSeleccionada(date)
                  setHorarioSeleccionado("")
                  setMostrandoFormulario(false)
                }}
                disabled={(date) => date < new Date() || date.getDay() === 0 || date.getDay() === 6}
                locale={es}
                className="rounded-md border"
              />
            </CardContent>
          </Card>

          {/* Horarios disponibles */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Horarios Disponibles
              </CardTitle>
              <CardDescription>
                {fechaSeleccionada
                  ? `${format(fechaSeleccionada, "EEEE, d MMMM yyyy", { locale: es })} - ${horariosDisponibles.length} disponibles`
                  : "Selecciona una fecha primero"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!fechaSeleccionada ? (
                <p className="text-gray-500 text-center py-8">👆 Selecciona una fecha en el calendario</p>
              ) : horariosDisponibles.length === 0 ? (
                <div className="text-center py-8">
                  <AlertTriangle className="h-8 w-8 text-amber-500 mx-auto mb-2" />
                  <p className="text-gray-500">No hay horarios disponibles para esta fecha</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-64 overflow-y-auto">
                  {horariosDisponibles.map((hora) => (
                    <Button
                      key={hora}
                      variant={horarioSeleccionado === hora ? "default" : "outline"}
                      size="sm"
                      onClick={() => {
                        setHorarioSeleccionado(hora)
                        setMostrandoFormulario(true)
                      }}
                      className="text-sm min-h-[40px] touch-manipulation"
                    >
                      {hora}
                    </Button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Formulario de reserva */}
        {mostrandoFormulario && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Confirmar Reserva
              </CardTitle>
              <CardDescription>Completa los datos para confirmar tu cita de 60 minutos</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-2 p-3 bg-blue-50 rounded-lg">
                <Badge variant="secondary" className="text-xs sm:text-sm">
                  {fechaSeleccionada && format(fechaSeleccionada, "dd/MM/yyyy")}
                </Badge>
                <Badge variant="secondary" className="text-xs sm:text-sm">
                  {horarioSeleccionado} -{" "}
                  {format(addMinutes(new Date(`2000-01-01T${horarioSeleccionado}`), 60), "HH:mm")}
                </Badge>
                <Badge variant="outline" className="text-xs sm:text-sm">
                  ⏱️ Duración: 60 minutos
                </Badge>
              </div>

              <div className="space-y-2">
                <Label htmlFor="nombre">Nombre completo *</Label>
                <Input
                  id="nombre"
                  placeholder="Ingresa tu nombre completo"
                  value={nombreCliente}
                  onChange={(e) => setNombreCliente(e.target.value)}
                  disabled={cargando}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="telefono">Número de teléfono *</Label>
                <Input
                  id="telefono"
                  type="tel"
                  placeholder="Ej: 123 456 789"
                  value={telefono}
                  onChange={(e) => setTelefono(e.target.value)}
                  disabled={cargando}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email (opcional)</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="tu@email.com (para confirmación)"
                  value={emailCliente}
                  onChange={(e) => setEmailCliente(e.target.value)}
                  disabled={cargando}
                />
                <p className="text-xs text-gray-500">
                  📧 Recibirás una confirmación por email si proporcionas tu dirección
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="personas">Número de personas</Label>
                <select
                  id="personas"
                  value={numeroPersonas}
                  onChange={(e) => setNumeroPersonas(Number.parseInt(e.target.value))}
                  disabled={cargando}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                >
                  {[1, 2, 3, 4].map((num) => (
                    <option key={num} value={num}>
                      {num} {num === 1 ? "persona" : "personas"}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col sm:flex-row gap-2">
                <Button
                  onClick={realizarReserva}
                  disabled={!nombreCliente.trim() || !telefono.trim() || cargando}
                  className="flex-1 min-h-[44px]"
                >
                  {cargando ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Guardando...
                    </>
                  ) : (
                    "Confirmar Reserva"
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setMostrandoFormulario(false)
                    setHorarioSeleccionado("")
                    setNombreCliente("")
                    setTelefono("")
                    setEmailCliente("")
                    setNumeroPersonas(1)
                  }}
                  disabled={cargando}
                  className="min-h-[44px]"
                >
                  Cancelar
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Resumen de reservas del día */}
        {fechaSeleccionada && reservasDelDia.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>{modoAdministrador ? "Gestión de Reservas del Día" : "Horarios Ocupados"}</CardTitle>
              <CardDescription>
                {modoAdministrador
                  ? `Gestiona las citas para ${format(fechaSeleccionada, "dd/MM/yyyy")}`
                  : `Horarios no disponibles para ${format(fechaSeleccionada, "dd/MM/yyyy")}`}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {reservasDelDia
                  .sort((a, b) => a.hora.localeCompare(b.hora))
                  .map((reserva) => (
                    <div
                      key={reserva.id}
                      className="flex flex-col sm:flex-row sm:items-center justify-between p-3 bg-gray-50 rounded-lg gap-2"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 flex-1">
                        <Badge variant="outline" className="self-start">
                          {reserva.hora.substring(0, 5)} -{" "}
                          {format(addMinutes(new Date(`2000-01-01T${reserva.hora}`), 60), "HH:mm")}
                        </Badge>
                        <div className="flex flex-col flex-1">
                          {modoAdministrador ? (
                            editandoReserva === reserva.id ? (
                              // Modo edición
                              <div className="space-y-2">
                                <Input
                                  value={datosEdicion.nombre_cliente || ""}
                                  onChange={(e) =>
                                    setDatosEdicion((prev) => ({ ...prev, nombre_cliente: e.target.value }))
                                  }
                                  placeholder="Nombre completo"
                                  className="text-sm"
                                />
                                <Input
                                  value={datosEdicion.telefono || ""}
                                  onChange={(e) => setDatosEdicion((prev) => ({ ...prev, telefono: e.target.value }))}
                                  placeholder="Teléfono"
                                  className="text-sm"
                                />
                                <select
                                  value={datosEdicion.numero_personas || 1}
                                  onChange={(e) =>
                                    setDatosEdicion((prev) => ({
                                      ...prev,
                                      numero_personas: Number.parseInt(e.target.value),
                                    }))
                                  }
                                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                                >
                                  {[1, 2, 3, 4].map((num) => (
                                    <option key={num} value={num}>
                                      {num} {num === 1 ? "persona" : "personas"}
                                    </option>
                                  ))}
                                </select>
                              </div>
                            ) : (
                              // Modo vista
                              <>
                                <span className="font-medium">{reserva.nombre_cliente}</span>
                                <span className="text-sm text-gray-600">
                                  📞 {reserva.telefono} • 👥 {reserva.numero_personas}{" "}
                                  {reserva.numero_personas === 1 ? "persona" : "personas"}
                                </span>
                              </>
                            )
                          ) : (
                            <span className="font-medium text-gray-600">🔒 Horario Ocupado (60 min)</span>
                          )}
                        </div>
                      </div>

                      {/* Botones de administrador */}
                      {modoAdministrador && (
                        <div className="flex gap-2">
                          {editandoReserva === reserva.id ? (
                            <>
                              <Button size="sm" onClick={guardarEdicion} className="h-8 w-8 p-0">
                                <Save className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={cancelarEdicion}
                                className="h-8 w-8 p-0 bg-transparent"
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </>
                          ) : (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => iniciarEdicion(reserva)}
                                className="h-8 w-8 p-0"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => eliminarReserva(reserva.id!)}
                                className="h-8 w-8 p-0"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
              </div>
              {!modoAdministrador && (
                <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-700">
                    💡 <strong>Información privada:</strong> Los datos personales están ocultos por privacidad. Solo se
                    muestran los horarios ocupados.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Información sobre el bloqueo mejorado */}
        {fechaSeleccionada && (
          <Card className="border-amber-200 bg-amber-50">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5" />
                <div className="text-sm text-amber-800">
                  <p className="font-medium mb-1">ℹ️ Sistema de Reservas Inteligente</p>
                  <p>
                    Cada cita bloquea <strong>7 slots</strong> (1h 45min total): 45min antes para preparación/limpieza +
                    60min de sesión. Esto garantiza la máxima higiene y calidad del servicio.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
