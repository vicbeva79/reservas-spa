# Despliegue en Netlify

## Variables de entorno necesarias

- NEXT_PUBLIC_SUPABASE_URL
- NEXT_PUBLIC_SUPABASE_KEY
- RESEND_API_KEY
- NEXT_PUBLIC_APP_URL

Configúralas en el panel de Netlify (Site settings > Environment variables).

## Pasos para desplegar

1. Sube tu código a un repositorio (GitHub, GitLab, etc).
2. Conecta el repo a Netlify.
3. Netlify detectará Next.js automáticamente.
4. Asegúrate de tener el archivo `netlify.toml` en la raíz.
5. Netlify instalará las dependencias y ejecutará el build.
6. ¡Listo!

## Notas
- Las rutas API funcionan como serverless functions.
- Si usas cron jobs, revisa Netlify Scheduled Functions.
- Si ves errores de types, ejecuta:
  - `npm install --save-dev @types/node`
  - `npm install @supabase/supabase-js dexie` 