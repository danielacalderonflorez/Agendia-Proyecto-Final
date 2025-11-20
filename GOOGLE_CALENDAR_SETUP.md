# 🗓️ Guía de Configuración: Integración con Google Calendar

## 📋 Resumen
Esta guía te explica paso a paso cómo configurar las credenciales de Google Calendar en tu proyecto para que los eventos se creen automáticamente cuando un profesional acepte una cita.

---

## 🔑 Paso 1: Agregar las Credenciales a Lovable Cloud

Tienes **3 credenciales** que debes agregar como **Secrets** en Lovable Cloud:

1. **GOOGLE_CLIENT_ID**: Tu Client ID de Google Cloud Console
2. **GOOGLE_CLIENT_SECRET**: Tu Client Secret de Google Cloud Console  
3. **GOOGLE_REFRESH_TOKEN**: Tu Refresh Token de Google

### ¿Cómo agregar los Secrets?

1. **Abre el panel de Backend de Lovable**:
   - En tu proyecto, haz clic en el botón "View Backend" o "Cloud"
   
2. **Ve a la sección "Secrets"**:
   - Encontrarás una sección para gestionar variables de entorno seguras
   
3. **Agrega cada secret uno por uno**:
   
   **Secret #1:**
   - Nombre: `GOOGLE_CLIENT_ID`
   - Valor: Pega aquí tu Client ID (ejemplo: `123456789.apps.googleusercontent.com`)
   
   **Secret #2:**
   - Nombre: `GOOGLE_CLIENT_SECRET`
   - Valor: Pega aquí tu Client Secret (ejemplo: `GOCSPX-abc123def456`)
   
   **Secret #3:**
   - Nombre: `GOOGLE_REFRESH_TOKEN`
   - Valor: Pega aquí tu Refresh Token (ejemplo: `1//0abc123def456...`)

4. **Guarda cada secret** haciendo clic en el botón correspondiente

---

## ✅ Paso 2: Verificar la Instalación

Una vez agregados los 3 secrets:

1. **Despliega el proyecto** (si no se desplegó automáticamente)
2. **Prueba la funcionalidad**:
   - Crea una cita como cliente
   - Inicia sesión como profesional
   - Acepta la cita desde "Mis Citas"
   - Verifica que aparezca el mensaje: "La cita ha sido aceptada y agregada a Google Calendar"
   - Revisa tu Google Calendar - ¡debería aparecer el evento!

---

## 🔧 ¿Cómo funciona?

1. **Edge Function**: `supabase/functions/google-calendar-integration/index.ts`
   - Esta función se ejecuta automáticamente cuando un profesional acepta una cita
   - Usa las credenciales de los secrets para autenticarse con Google
   - Crea un evento en Google Calendar con los detalles de la cita
   - Invita automáticamente al cliente y al profesional

2. **Código de Frontend**: `src/pages/MyAppointments.tsx`
   - La función `handleAcceptAppointment` llama al edge function
   - Si Google Calendar falla, la cita se acepta de todas formas
   - No afecta el flujo normal de la aplicación

---

## 🛡️ Seguridad

✅ **Las credenciales están seguras**:
- Se almacenan como Secrets encriptados en Lovable Cloud
- Nunca se exponen en el código del frontend
- Solo el edge function puede acceder a ellas
- No se suben a Git ni se comparten públicamente

---

## ❓ Solución de Problemas

### Problema: "Missing Google Calendar credentials"
**Solución**: Verifica que los 3 secrets estén configurados correctamente con los nombres exactos:
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `GOOGLE_REFRESH_TOKEN`

### Problema: "Failed to get access token"
**Solución**: Tu Refresh Token puede estar expirado o mal configurado. Genera uno nuevo en Google Cloud Console.

### Problema: "Failed to create calendar event"
**Solución**: Verifica que:
- Tu cuenta de Google tenga permisos de Calendar API activados
- El Refresh Token tenga los scopes correctos (`calendar.events`)

---

## 📝 Notas Importantes

- **Zona horaria**: El código usa `America/Mexico_City`. Si necesitas otra zona, edita el archivo `supabase/functions/google-calendar-integration/index.ts` en las líneas 78 y 83.

- **Duración de la cita**: Por defecto, las citas duran **1 hora**. Puedes cambiar esto en la línea 76 del edge function.

- **Recordatorios**: Se envían automáticamente:
  - Email: 1 día antes
  - Popup: 1 hora antes

---

## 🚀 ¡Listo!

Una vez completados estos pasos, cada vez que un profesional acepte una cita, se creará automáticamente un evento en Google Calendar con invitaciones para ambas partes.

Si tienes dudas, revisa los logs del edge function en el panel de Cloud → Functions → google-calendar-integration.
