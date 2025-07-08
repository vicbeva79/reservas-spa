import { createClient } from "@supabase/supabase-js"
import Dexie, { type EntityTable } from "dexie"

/* ---------- Tipos ---------- */
export interface Reserva {
  id?: number
  fecha: string // YYYY-MM-DD
  hora: string // HH:MM
  nombre_cliente: string
  telefono: string
  numero_personas: number
  fecha_creacion?: string
}

/* ---------- 🔑 TUS CLAVES REALES DE SUPABASE ---------- */
// @ts-ignore
const supabaseUrl = typeof window === 'undefined' && typeof process !== 'undefined' && process.env.NEXT_PUBLIC_SUPABASE_URL ? process.env.NEXT_PUBLIC_SUPABASE_URL : ''
// @ts-ignore
const supabaseKey = typeof window === 'undefined' && typeof process !== 'undefined' && process.env.NEXT_PUBLIC_SUPABASE_KEY ? process.env.NEXT_PUBLIC_SUPABASE_KEY : ''

// Verificación simplificada - solo verificar que las claves existen y tienen formato correcto
const SUPABASE_OK = Boolean(
  supabaseUrl &&
    supabaseKey &&
    supabaseUrl.includes("supabase.co") &&
    supabaseKey.startsWith("eyJ") &&
    supabaseUrl.length > 20 &&
    supabaseKey.length > 100,
)

// 🚨 LOGS DE DIAGNÓSTICO DETALLADO
console.log("=".repeat(50))
console.log("🔍 DIAGNÓSTICO SUPABASE DETALLADO")
console.log("=".repeat(50))
console.log("📍 URL:", supabaseUrl)
console.log("📍 URL length:", supabaseUrl.length)
console.log("📍 URL includes supabase.co:", supabaseUrl.includes("supabase.co"))
console.log("🔑 Key starts with eyJ:", supabaseKey.startsWith("eyJ"))
console.log("🔑 Key length:", supabaseKey.length)
console.log("✅ Todas las verificaciones:")
console.log("   - URL existe:", Boolean(supabaseUrl))
console.log("   - Key existe:", Boolean(supabaseKey))
console.log("   - URL contiene supabase.co:", supabaseUrl.includes("supabase.co"))
console.log("   - Key empieza con eyJ:", supabaseKey.startsWith("eyJ"))
console.log("   - URL > 20 chars:", supabaseUrl.length > 20)
console.log("   - Key > 100 chars:", supabaseKey.length > 100)
console.log("🎯 RESULTADO FINAL - Supabase OK:", SUPABASE_OK)
console.log("🌐 Modo:", SUPABASE_OK ? "NUBE (Supabase)" : "LOCAL (IndexedDB)")
console.log("=".repeat(50))

/* ---------- Cliente Supabase ---------- */
let supabase: ReturnType<typeof createClient> | null = null
const getSupabaseClient = () => {
  if (!SUPABASE_OK) {
    console.error("❌ Supabase no configurado correctamente")
    throw new Error("Supabase no configurado")
  }
  if (!supabase) {
    console.log("🔌 Creando cliente Supabase...")
    supabase = createClient(supabaseUrl, supabaseKey)
    console.log("✅ Cliente Supabase creado exitosamente")
  }
  return supabase
}

/* ---------- Fallback Local ---------- */
type DexieDB = Dexie & { reservas: EntityTable<Reserva, "id"> }

let db: DexieDB | null = null
const getDexie = () => {
  if (db) return db
  console.log("💾 Inicializando IndexedDB local...")
  db = new Dexie("reservas-local") as DexieDB
  db.version(1).stores({
    reservas: "++id, fecha, hora, nombre_cliente, telefono, numero_personas, fecha_creacion",
  })
  return db
}

/* ---------- Servicio ---------- */
export const reservasService = {
  async obtenerTodas(): Promise<Reserva[]> {
    if (SUPABASE_OK) {
      try {
        console.log("🌐 Obteniendo reservas desde Supabase...")
        const { data, error } = await getSupabaseClient()
          .from("reservas")
          .select("*")
          .order("fecha", { ascending: true })
          .order("hora", { ascending: true })

        if (error) {
          console.error("❌ Error Supabase:", error)
          throw error
        }

        console.log("✅ Reservas obtenidas desde Supabase:", data?.length || 0)
        return data ?? []
      } catch (error) {
        console.error("❌ Fallo Supabase, usando local:", error)
        return (await getDexie().reservas.toArray()) as Reserva[]
      }
    }

    console.log("💾 Obteniendo reservas desde IndexedDB local...")
    const localData = await getDexie().reservas.toArray()
    console.log("📱 Reservas locales:", localData.length)
    return localData as Reserva[]
  },

  async crear(reserva: Omit<Reserva, "id" | "fecha_creacion">): Promise<Reserva> {
    if (SUPABASE_OK) {
      try {
        console.log("🌐 Creando reserva en Supabase:", reserva)
        const { data, error } = await getSupabaseClient().from("reservas").insert([reserva]).select().single()

        if (error) {
          console.error("❌ Error al crear en Supabase:", error)
          throw error
        }

        console.log("✅ Reserva creada en Supabase:", data)
        return data as Reserva
      } catch (error) {
        console.error("❌ Fallo al crear en Supabase, usando local:", error)
        const id = await getDexie().reservas.add({
          ...reserva,
          fecha_creacion: new Date().toISOString(),
        })
        return { id, ...reserva }
      }
    }

    console.log("💾 Creando reserva en IndexedDB local:", reserva)
    const id = await getDexie().reservas.add({
      ...reserva,
      fecha_creacion: new Date().toISOString(),
    })
    console.log("📱 Reserva local creada con ID:", id)
    return { id, ...reserva }
  },

  async obtenerPorFecha(fecha: string): Promise<Reserva[]> {
    if (SUPABASE_OK) {
      try {
        const { data, error } = await getSupabaseClient()
          .from("reservas")
          .select("*")
          .eq("fecha", fecha)
          .order("hora", { ascending: true })
        if (error) throw error
        return data ?? []
      } catch (error) {
        return (await getDexie().reservas.where("fecha").equals(fecha).toArray()) as Reserva[]
      }
    }
    return (await getDexie().reservas.where("fecha").equals(fecha).toArray()) as Reserva[]
  },

  async eliminar(id: number) {
    if (SUPABASE_OK) {
      try {
        const { error } = await getSupabaseClient().from("reservas").delete().eq("id", id)
        if (error) throw error
        return
      } catch (error) {
        await getDexie().reservas.delete(id)
      }
    }
    await getDexie().reservas.delete(id)
  },
}

export const origenDatos = SUPABASE_OK ? "supabase" : "local"

// Si ves errores de types, ejecuta:
// npm install --save-dev @types/node
// npm install @supabase/supabase-js dexie
