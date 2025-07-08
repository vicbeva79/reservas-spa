-- Crear tabla de reservas en Supabase
CREATE TABLE IF NOT EXISTS reservas (
  id BIGSERIAL PRIMARY KEY,
  fecha DATE NOT NULL,
  hora TIME NOT NULL,
  nombre_cliente TEXT NOT NULL,
  telefono TEXT NOT NULL,
  numero_personas INTEGER NOT NULL DEFAULT 1,
  fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_reservas_fecha ON reservas(fecha);
CREATE INDEX IF NOT EXISTS idx_reservas_hora ON reservas(hora);

-- Habilitar Row Level Security (RLS) - opcional para mayor seguridad
ALTER TABLE reservas ENABLE ROW LEVEL SECURITY;

-- Política para permitir todas las operaciones (puedes ajustar según necesites)
CREATE POLICY "Permitir todas las operaciones en reservas" ON reservas
FOR ALL USING (true);
