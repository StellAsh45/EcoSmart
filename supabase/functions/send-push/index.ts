import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0'
import { JWT } from "https://esm.sh/google-auth-library@8.7.0"

// Configuración de CORS para responder a las llamadas preflight del navegador si se requiere
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Manejo de peticiones preflight CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // 1. Inicializar Supabase Client con la llave del rol de servicio
    // Esto es muy importante porque nos permite hacer un "bypass" de las políticas RLS 
    // y poder leer los tokens de los administradores y usuarios de forma segura.
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ""
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ""
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // 2. Parsear el cuerpo de la petición enviada por el Webhook de Supabase
    const payload = await req.json()
    const { table, type, record } = payload

    // Variables base para construir la notificación push
    let titulo = ""
    let cuerpo = ""
    let destinatarioId: string | null = null
    let esMensajeAdmin = false
    let ticketId = ""

    console.log(`[Push Notification Service] Procesando evento para la tabla ${table} (${type})`, record)

    // ESCENARIO 1: El estudiante crea un nuevo ticket
    if (table === 'tickets_soporte' && type === 'INSERT') {
      ticketId = record.id
      const creadorNombre = record.nombre_usuario || "Un estudiante"
      titulo = "🎫 ¡Nueva solicitud de soporte!"
      cuerpo = `${creadorNombre} creó el ticket: "${record.titulo}"`
      
      // null significa que va dirigido a los administradores.
      destinatarioId = null 
    }

    // ESCENARIOS 2 y 3: Se envía un nuevo mensaje en un ticket
    else if (table === 'mensajes_ticket' && type === 'INSERT') {
      ticketId = record.ticket_id
      const remitenteRol = record.rol_remitente
      const mensajeTexto = record.mensaje

      // Consultamos el ticket original para saber a quién pertenece y su título
      const { data: ticket } = await supabase
        .from('tickets_soporte')
        .select('*')
        .eq('id', ticketId)
        .single()

      if (ticket) {
        if (remitenteRol === 'estudiante') {
          // Caso A: El estudiante escribe -> Se notifica al Administrador
          titulo = `💬 Mensaje en ticket: ${ticket.titulo}`
          cuerpo = `${ticket.nombre_usuario}: ${mensajeTexto}`
          destinatarioId = null // Va para el Admin
        } else if (remitenteRol === 'admin') {
          // Caso B: El administrador responde -> Se notifica al estudiante dueño del ticket
          titulo = `🔔 Soporte EcoSmart`
          cuerpo = `Respuesta en "${ticket.titulo}": ${mensajeTexto}`
          destinatarioId = ticket.usuario_id // ID del estudiante dueño del ticket
          esMensajeAdmin = true
        }
      }
    }
    // Si no coincide con ninguna lógica que requiera notificaciones, ignoramos el evento
    if (!titulo || !cuerpo) {
      return new Response(JSON.stringify({ message: "El evento no califica para notificaciones push." }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200
      })
    }

    // 3. Obtener los Tokens FCM correspondientes
    let targetTokens: string[] = []

    if (destinatarioId) {
      // Caso Estudiante: Consultamos tokens únicamente del estudiante correspondiente
      const { data: tokens } = await supabase
        .from('user_push_tokens')
        .select('fcm_token')
        .eq('usuario_id', destinatarioId)

      if (tokens) {
        targetTokens = tokens.map(t => t.fcm_token)
      }
    } else {
      // Caso administrador: buscamos a usuarios con rol "admin"
      const { data: admins } = await supabase
        .from('profiles')
        .select('id')
        .eq('rol', 'admin')

      if (admins && admins.length > 0) {
        const adminIds = admins.map(a => a.id)
        
        // Obtenemos los tokens asociados a todos los administradores activos
        const { data: tokens } = await supabase
          .from('user_push_tokens')
          .select('fcm_token')
          .in('usuario_id', adminIds)

        if (tokens) {
          targetTokens = tokens.map(t => t.fcm_token)
        }
      }
    }

    // Si no hay dispositivos registrados para recibir la notificación, terminamos temprano de forma exitosa
    if (targetTokens.length === 0) {
      console.log("[Push Notification Service] Omitido: No hay tokens FCM registrados para los destinatarios.")
      return new Response(JSON.stringify({ message: "Sin tokens de destino registrados" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200
      })
    }

    
    // 4. Firmar Token de Acceso seguro con Firebase Admin JSON
    const firebaseConfigString = Deno.env.get('FIREBASE_SERVICE_ACCOUNT')
    if (!firebaseConfigString) {
      throw new Error("No se ha configurado la variable de entorno obligatoria 'FIREBASE_SERVICE_ACCOUNT' en Supabase.")
    }
    const firebaseConfig = JSON.parse(firebaseConfigString)

    // Generamos el cliente JWT para firmar nuestras peticiones utilizando OAuth2 ante Google Firebase
    const jwtClient = new JWT({
      email: firebaseConfig.client_email,
      key: firebaseConfig.private_key,
      scopes: ['https://www.googleapis.com/auth/firebase.messaging'],
    })

    const credentials = await jwtClient.authorize()
    const accessToken = credentials.access_token

    if (!accessToken) {
      throw new Error("Fallo al firmar el token de acceso de Google Firebase APIs.")
    }

    // 5. Despachar notificaciones a los dispositivos móviles
    const projectId = firebaseConfig.project_id
    const fcmUrl = `https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`

    console.log(`[Push Notification Service] Despachando notificaciones a ${targetTokens.length} dispositivos...`)

    const envios = targetTokens.map(async (token) => {
      const messagePayload = {
        message: {
          token: token,
          notification: {
            title: titulo,
            body: cuerpo
          },
          data: {
            ticket_id: ticketId,
            pantalla: esMensajeAdmin ? 'soporte-estudiante' : 'soporte-admin',
          },
          android: {
            priority: 'HIGH',
            notification: {
              sound: 'default',
              click_action: 'FCM_PLUGIN_ACTIVITY'
            }
          },
          apns: {
            payload: {
              aps: {
                sound: 'default',
                badge: 1
              }
            }
          }
        }
      }

      const res = await fetch(fcmUrl, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${accessToken}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(messagePayload)
      })

      if (!res.ok) {
        const errText = await res.text()
        console.error(`[Push Notification Service] Error despachando al token ${token}:`, errText)
      } else {
        console.log(`[Push Notification Service] Notificación despachada con éxito al token: ${token.substring(0, 15)}...`)
      }
    })

    // Esperar a que se envíen todas de forma asíncrona
    await Promise.all(envios)

    return new Response(JSON.stringify({ success: true, count: targetTokens.length }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200
    })

  } catch (err) {
    console.error("[Push Notification Service] Excepción crítica atrapada:", err)
    return new Response(JSON.stringify({ error: err.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500
    })
  }
})
