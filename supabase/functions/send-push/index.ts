import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0"
import { JWT } from "https://esm.sh/google-auth-library@8.7.0"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
}

type NotificationTarget = "admins" | "user" | "gremio_miembros"

function esJuevesBogota() {
  const dia = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Bogota",
    weekday: "short",
  }).format(new Date())

  return dia === "Thu"
}

function normalizarEvento(payload: any) {
  return String(payload?.event || payload?.evento || payload?.notification_event || "").trim()
}

function tokensUnicos(tokens: string[]) {
  return Array.from(new Set(tokens.filter(Boolean)))
}

async function obtenerTokensUsuario(supabase: any, usuarioId: string) {
  const { data } = await supabase
    .from("user_push_tokens")
    .select("fcm_token")
    .eq("usuario_id", usuarioId)

  return tokensUnicos((data || []).map((t: any) => t.fcm_token))
}

async function obtenerTokensAdmins(supabase: any) {
  const { data: admins } = await supabase
    .from("profiles")
    .select("id")
    .eq("rol", "admin")

  const adminIds = (admins || []).map((a: any) => a.id)
  if (adminIds.length === 0) return []

  const { data: tokens } = await supabase
    .from("user_push_tokens")
    .select("fcm_token")
    .in("usuario_id", adminIds)

  return tokensUnicos((tokens || []).map((t: any) => t.fcm_token))
}

async function obtenerTokensMiembrosGremios(supabase: any) {
  const { data: miembros } = await supabase
    .from("gremio_miembros")
    .select("usuario_id")

  const usuarioIds = tokensUnicos((miembros || []).map((m: any) => m.usuario_id))
  if (usuarioIds.length === 0) return []

  const { data: tokens } = await supabase
    .from("user_push_tokens")
    .select("fcm_token")
    .in("usuario_id", usuarioIds)

  return tokensUnicos((tokens || []).map((t: any) => t.fcm_token))
}

async function enviarNotificacionesFCM(targetTokens: string[], titulo: string, cuerpo: string, data: Record<string, string>) {
  const firebaseConfigString = Deno.env.get("FIREBASE_SERVICE_ACCOUNT")
  if (!firebaseConfigString) {
    throw new Error("No se ha configurado la variable de entorno obligatoria FIREBASE_SERVICE_ACCOUNT en Supabase.")
  }

  const firebaseConfig = JSON.parse(firebaseConfigString)
  const jwtClient = new JWT({
    email: firebaseConfig.client_email,
    key: firebaseConfig.private_key,
    scopes: ["https://www.googleapis.com/auth/firebase.messaging"],
  })

  const credentials = await jwtClient.authorize()
  const accessToken = credentials.access_token
  if (!accessToken) {
    throw new Error("Fallo al firmar el token de acceso de Google Firebase APIs.")
  }

  const fcmUrl = `https://fcm.googleapis.com/v1/projects/${firebaseConfig.project_id}/messages:send`

  const envios = targetTokens.map(async (token) => {
    const messagePayload = {
      message: {
        token,
        notification: {
          title: titulo,
          body: cuerpo,
        },
        data,
        android: {
          priority: "HIGH",
          notification: {
            sound: "default",
            click_action: "FCM_PLUGIN_ACTIVITY",
          },
        },
        apns: {
          payload: {
            aps: {
              sound: "default",
              badge: 1,
            },
          },
        },
      },
    }

    const res = await fetch(fcmUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(messagePayload),
    })

    if (!res.ok) {
      const errText = await res.text()
      console.error(`[Push Notification Service] Error despachando al token ${token}:`, errText)
    }
  })

  await Promise.all(envios)
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? ""
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const payload = await req.json()
    const { table, type, record } = payload
    const evento = normalizarEvento(payload)

    let titulo = ""
    let cuerpo = ""
    let destinatarioId: string | null = null
    let target: NotificationTarget = "admins"
    let data: Record<string, string> = {
      pantalla: "soporte-admin",
      tipo: "soporte",
    }

    console.log("[Push Notification Service] Procesando evento:", payload)

    if (table === "tickets_soporte" && type === "INSERT") {
      const creadorNombre = record.nombre_usuario || "Un estudiante"
      titulo = "Nueva solicitud de soporte"
      cuerpo = `${creadorNombre} creo el ticket: "${record.titulo}"`
      target = "admins"
      data = {
        ticket_id: String(record.id || ""),
        pantalla: "soporte-admin",
        tipo: "soporte_ticket",
      }
    } else if (table === "mensajes_ticket" && type === "INSERT") {
      const ticketId = record.ticket_id
      const remitenteRol = record.rol_remitente
      const mensajeTexto = record.mensaje

      const { data: ticket } = await supabase
        .from("tickets_soporte")
        .select("*")
        .eq("id", ticketId)
        .single()

      if (ticket && remitenteRol === "estudiante") {
        titulo = `Mensaje en ticket: ${ticket.titulo}`
        cuerpo = `${ticket.nombre_usuario}: ${mensajeTexto}`
        target = "admins"
        data = {
          ticket_id: String(ticketId || ""),
          pantalla: "soporte-admin",
          tipo: "soporte_mensaje",
        }
      } else if (ticket && remitenteRol === "admin") {
        titulo = "Soporte EcoSmart"
        cuerpo = `Respuesta en "${ticket.titulo}": ${mensajeTexto}`
        destinatarioId = ticket.usuario_id
        target = "user"
        data = {
          ticket_id: String(ticketId || ""),
          pantalla: "soporte-estudiante",
          tipo: "soporte_respuesta",
        }
      }
    } else if (evento === "competencia_inicio") {
      titulo = "La competencia de gremios comenzo"
      cuerpo = "El arbol cooperativo esta activo. Entra a EcoSmart y aporta hojas para tu gremio."
      target = "gremio_miembros"
      data = {
        pantalla: "gremios",
        tipo: "competencia_inicio",
      }
    } else if (evento === "competencia_fin") {
      titulo = "La competencia de gremios termino"
      cuerpo = "Ya se cerraron los aportes. Revisa el podio y tus EcoTokens en EcoSmart."
      target = "gremio_miembros"
      data = {
        pantalla: "gremios",
        tipo: "competencia_fin",
      }
    } else if (evento === "pregunta_repaso_disponible") {
      if (esJuevesBogota()) {
        return new Response(JSON.stringify({ message: "Omitido: los jueves no hay pregunta de repaso." }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        })
      }

      titulo = "Pregunta de repaso disponible"
      cuerpo = "Ya puedes responder la pregunta de repaso y ganar EcoTokens para tu cuenta."
      target = "gremio_miembros"
      data = {
        pantalla: "gremios",
        vista: "pregunta",
        tipo: "pregunta_repaso_disponible",
      }
    }

    if (!titulo || !cuerpo) {
      return new Response(JSON.stringify({ message: "El evento no califica para notificaciones push." }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      })
    }

    let targetTokens: string[] = []
    if (target === "user" && destinatarioId) {
      targetTokens = await obtenerTokensUsuario(supabase, destinatarioId)
    } else if (target === "gremio_miembros") {
      targetTokens = await obtenerTokensMiembrosGremios(supabase)
    } else {
      targetTokens = await obtenerTokensAdmins(supabase)
    }

    if (targetTokens.length === 0) {
      console.log("[Push Notification Service] Omitido: no hay tokens FCM registrados para los destinatarios.")
      return new Response(JSON.stringify({ message: "Sin tokens de destino registrados" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      })
    }

    console.log(`[Push Notification Service] Despachando ${targetTokens.length} notificaciones...`)
    await enviarNotificacionesFCM(targetTokens, titulo, cuerpo, data)

    return new Response(JSON.stringify({ success: true, count: targetTokens.length, event: evento || table }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    })
  } catch (err) {
    console.error("[Push Notification Service] Excepcion critica atrapada:", err)
    return new Response(JSON.stringify({ error: err.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    })
  }
})
