import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from 'src/environments/environment';
import { Capacitor } from '@capacitor/core';

@Injectable({
  providedIn: 'root'
})
export class SupabaseService {
  private supabase: SupabaseClient;

  constructor() {
    const supabaseUrl = environment.SUPABASE_URL;
    const supabaseAnonKey = environment.SUPABASE_KEY;

    this.supabase = createClient(supabaseUrl, supabaseAnonKey);
  }

  get cliente(): SupabaseClient {
    return this.supabase;
  }

  // AUTH

  async iniciarSesion(email: string, password: string) {
    return this.supabase.auth.signInWithPassword({
      email,
      password,
    });
  }

  async registrarse(email: string, password: string, nombreCompleto: string) {
    const isNative = Capacitor.isNativePlatform();
    // Esto lo añadí para que en PC use localhost y en celular use el esquema de la app
    const redirectUrl = isNative
      ? 'com.ecosmart.app://confirmar'
      : 'http://localhost:8100/ingreso';

    return this.supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          full_name: nombreCompleto,
        },
      },
    });
  }

  async verificarCorreoRegistrado(email: string) {
    const { data, error } = await this.supabase
      .from('profiles')
      .select('id, activo')
      .eq('email', email)
      .maybeSingle();

    return {
      existe: !!data && !error,
      activo: data?.activo ?? false
    };
  }

  async recuperarContrase(email: string) {
    const isNative = Capacitor.isNativePlatform();
    const redirectUrl = isNative
      ? 'com.ecosmart.app://restablecer-contrasena'
      : 'http://localhost:8100/restablecer-contrasena';

    return this.supabase.auth.resetPasswordForEmail(email, {
      redirectTo: redirectUrl,
    });
  }

  async cerrarSesion() {
    return this.supabase.auth.signOut();
  }

  obtenerUsuario() {
    return this.supabase.auth.getUser();
  }

  // =========================
  // PERFILES
  // =========================

  async obtenerPerfil(id: string) {
    return this.supabase
      .from('profiles')
      .select('*')
      .eq('id', id)
      .single();
  }

  async actualizarPerfil(id: string, datos: { nombre?: string; rol?: string; eco_tokens?: number }) {
    return this.supabase
      .from('profiles')
      .upsert({
        id,
        ...datos
      });
  }

  async actualizarDatosAuth(datos: { data?: any; password?: string }) {
    return this.supabase.auth.updateUser(datos);
  }

  // =========================
  // CURSOS
  // =========================

  async crearCurso(curso: any) {
    return this.supabase
      .from('cursos')
      .insert([curso])
      .select()
      .single();
  }

  async obtenerCursosAdmin() {
    return this.supabase
      .from('cursos')
      .select('*')
      .order('created_at', { ascending: false });
  }

  async obtenerCursosPublicos() {
    return this.supabase
      .from('cursos')
      .select('*')
      .eq('estado', 'publicado')
      .order('created_at', { ascending: false });
  }

  async obtenerCursoPorId(id: string) {
    return this.supabase
      .from('cursos')
      .select('*')
      .eq('id', id)
      .single();
  }

  async eliminarCurso(id: string) {
    return this.supabase
      .from('cursos')
      .delete()
      .eq('id', id);
  }

  // =========================
  // MODULOS
  // =========================

  async obtenerModulosCurso(cursoId: string) {
    return this.supabase
      .from('modulos')
      .select('*')
      .eq('curso_id', cursoId)
      .order('orden', { ascending: true });
  }

  async crearModulo(modulo: any) {
    return this.supabase
      .from('modulos')
      .insert([modulo])
      .select()
      .single();
  }

  async eliminarModulo(id: string) {
    return this.supabase
      .from('modulos')
      .delete()
      .eq('id', id);
  }

  // =========================
  // LECCIONES
  // =========================

  async obtenerLeccionesModulo(moduloId: string) {
    return this.supabase
      .from('lecciones')
      .select('*')
      .eq('modulo_id', moduloId)
      .order('orden', { ascending: true });
  }

  async crearLeccion(leccion: any) {
    return this.supabase
      .from('lecciones')
      .insert([leccion])
      .select()
      .single();
  }

  async eliminarLeccion(id: string) {
    return this.supabase
      .from('lecciones')
      .delete()
      .eq('id', id);
  }

  // =========================
  // EXAMENES
  // =========================

  async obtenerExamenModulo(moduloId: string) {
    return this.supabase
      .from('examenes')
      .select('*')
      .eq('modulo_id', moduloId)
      .single();
  }

  async crearExamen(examen: any) {
    return this.supabase
      .from('examenes')
      .insert([examen])
      .select()
      .single();
  }

  async eliminarExamen(id: string) {
    return this.supabase
      .from('examenes')
      .delete()
      .eq('id', id);
  }

  async obtenerPreguntasExamen(examenId: string) {
    return this.supabase
      .from('preguntas')
      .select('*')
      .eq('examen_id', examenId)
      .order('id', { ascending: true });
  }

  async guardarPreguntas(preguntas: any[]) {
    return this.supabase
      .from('preguntas')
      .insert(preguntas)
      .select();
  }

  // =========================
  // STORAGE IMAGENES
  // =========================

  async subirImagenCurso(file: File, ruta: string) {
    return this.supabase.storage
      .from('cursos')
      .upload(ruta, file, { cacheControl: '3600', upsert: true });
  }

  obtenerUrlPublica(ruta: string) {
    return this.supabase.storage
      .from('cursos')
      .getPublicUrl(ruta).data.publicUrl;
  }

  async eliminarImagenCurso(ruta: string) {
    return this.supabase.storage
      .from('cursos')
      .remove([ruta]);
  }

  // =========================
  // INSCRIPCIONES
  // =========================

  async obtenerInscripcion(usuarioId: string, cursoId: string) {
    return this.supabase
      .from('inscripciones')
      .select('*')
      .eq('usuario_id', usuarioId)
      .eq('curso_id', cursoId)
      .maybeSingle();
  }

  async inscribirUsuarioEnCurso(usuarioId: string, cursoId: string) {
    return this.supabase
      .from('inscripciones')
      .insert([
        {
          usuario_id: usuarioId,
          curso_id: cursoId,
          progreso: 0
        }
      ])
      .select()
      .single();
  }

  async obtenerInscripcionesUsuario(usuarioId: string) {
    return this.supabase
      .from('inscripciones')
      .select('*')
      .eq('usuario_id', usuarioId);
  }

  async actualizarProgresoInscripcion(
    usuarioId: string,
    cursoId: string,
    progreso: number
  ) {
    return this.supabase
      .from('inscripciones')
      .update({ progreso })
      .eq('usuario_id', usuarioId)
      .eq('curso_id', cursoId);
  }

  // PROGRESO LECCIONES

  async obtenerProgresoLecciones(usuarioId: string, cursoId: string) {
    return this.supabase
      .from('progreso_lecciones')
      .select('*')
      .eq('usuario_id', usuarioId)
      .eq('curso_id', cursoId);
  }

  // --- MÉTODOS PARA LECCIONES COMPLETADAS ---
  async obtenerLeccionesCompletadas(inscripcionId: string) {
    return this.supabase
      .from('lecciones_completadas')
      .select('leccion_id')
      .eq('inscripcion_id', inscripcionId);
  }

  async guardarLeccionCompletada(inscripcionId: string, leccionId: string) {
    return this.supabase
      .from('lecciones_completadas')
      .upsert({
        inscripcion_id: inscripcionId,
        leccion_id: leccionId
      }, { onConflict: 'inscripcion_id,leccion_id' });
  }

  async guardarProgresoLeccion(data: {
    usuario_id: string;
    curso_id: string;
    modulo_id: string;
    leccion_id: string;
    completada?: boolean;
    ultima_vista?: boolean;
  }) {
    return this.supabase
      .from('progreso_lecciones')
      .upsert([data], { onConflict: 'usuario_id,leccion_id' })
      .select();
  }

  async marcarUltimaLeccionVista(
    usuarioId: string,
    cursoId: string,
    leccionId: string
  ) {
    await this.supabase
      .from('progreso_lecciones')
      .update({ ultima_vista: false })
      .eq('usuario_id', usuarioId)
      .eq('curso_id', cursoId);

    return this.supabase
      .from('progreso_lecciones')
      .update({ ultima_vista: true })
      .eq('usuario_id', usuarioId)
      .eq('curso_id', cursoId)
      .eq('leccion_id', leccionId);
  }

  // RESULTADOS EXAMEN

  async guardarResultadoExamen(resultado: {
    usuario_id: string;
    examen_id: string;
    curso_id: string;
    modulo_id: string;
    correctas: number;
    incorrectas: number;
    porcentaje: number;
    respuestas?: any;
  }) {
    return this.supabase
      .from('resultados_examen')
      .insert([resultado])
      .select()
      .single();
  }

  async obtenerResultadosExamenUsuario(usuarioId: string, examenId: string) {
    return this.supabase
      .from('resultados_examen')
      .select('*')
      .eq('usuario_id', usuarioId)
      .eq('examen_id', examenId)
      .order('created_at', { ascending: false });
  }

  async eliminarResultadoExamen(usuarioId: string, examenId: string) {
    return this.supabase
      .from('resultados_examen')
      .delete()
      .eq('usuario_id', usuarioId)
      .eq('examen_id', examenId);
  }

  // RATE LIMITING (Reseteo Contraseña)

  verificarLimiteReseteo(email: string): { permitido: boolean; minutosRestantes: number } {
    if (!email) return { permitido: true, minutosRestantes: 0 };

    const key = `password_resets_${email.toLowerCase().trim()}`;
    const resetsRaw = localStorage.getItem(key);
    let resets: number[] = resetsRaw ? JSON.parse(resetsRaw) : [];

    const ahora = Date.now();
    const unaHoraEnMs = 60 * 60 * 1000;

    resets = resets.filter(timestamp => ahora - timestamp < unaHoraEnMs);

    localStorage.setItem(key, JSON.stringify(resets));

    if (resets.length >= 2) {
      const elMasAntiguo = resets[0];
      const tiempoTranscurrido = ahora - elMasAntiguo;
      const msRestantes = unaHoraEnMs - tiempoTranscurrido;
      const minutosRestantes = Math.ceil(msRestantes / (60 * 1000));

      return { permitido: false, minutosRestantes };
    }

    return { permitido: true, minutosRestantes: 0 };
  }

  registrarIntentoReseteo(email: string) {
    if (!email) return;

    const key = `password_resets_${email.toLowerCase().trim()}`;
    const resetsRaw = localStorage.getItem(key);
    let resets: number[] = resetsRaw ? JSON.parse(resetsRaw) : [];

    resets.push(Date.now());
    localStorage.setItem(key, JSON.stringify(resets));
  }

  // =========================
  // GREMIO BOOSTS
  // =========================

  async verificarYOtorgarBoost(usuarioId: string, tipo: string, referenciaId: string, valorBoost: number) {
    const ahora = new Date();
    if (ahora.getDay() === 4) {
      console.log('Día de descanso/reclutamiento detectado (jueves). No se otorgan boosts para el gremio.');
      return;
    }

    // 1. Verificar si el usuario está en un gremio
    const { data: miembro } = await this.supabase
      .from('gremio_miembros')
      .select('gremio_id')
      .eq('usuario_id', usuarioId)
      .maybeSingle();

    if (!miembro) return; // No está en gremio

    // 1b. Asegurar que referenciaId tenga un formato de UUID válido
    const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    let refId = referenciaId;
    if (!UUID_REGEX.test(referenciaId)) {
      if (!isNaN(Number(referenciaId))) {
        // Si es un número entero, rellenamos a formato UUID determinista
        refId = `00000000-0000-4000-8000-${String(referenciaId).padStart(12, '0')}`;
      } else {
        // Si es cualquier otro texto, generamos un hash determinista a formato UUID
        let hash = 0;
        for (let i = 0; i < referenciaId.length; i++) {
          hash = (hash << 5) - hash + referenciaId.charCodeAt(i);
          hash |= 0;
        }
        const hex = Math.abs(hash).toString(16).padStart(12, '0');
        refId = `00000000-0000-4000-8000-${hex}`;
      }
    }

    // 2. Verificar si ya existe este boost para evitar abusos
    const { data: existente } = await this.supabase
      .from('gremio_boosts')
      .select('id')
      .eq('usuario_id', usuarioId)
      .eq('tipo', tipo)
      .eq('referencia_id', refId)
      .maybeSingle();

    if (existente) return; // Ya se le otorgó este boost

    // 3. Insertar el boost
    const { error } = await this.supabase
      .from('gremio_boosts')
      .insert({
        gremio_id: miembro.gremio_id,
        usuario_id: usuarioId,
        tipo: tipo,
        referencia_id: refId,
        valor_boost: valorBoost
      });

    if (error) {
      console.error('Error al insertar boost del gremio:', error);
    }
  }

  // =========================
  // SOPORTE
  // =========================

  async crearSolicitudSoporte(solicitud: { usuario_id: string; correo_usuario: string; contenido: string; titulo: string; nombre_usuario: string }) {
    return this.supabase
      .from('tickets_soporte')
      .insert([solicitud])
      .select()
      .single();
  }

  async obtenerSolicitudesActivasUsuario(usuarioId: string) {
    return this.supabase
      .from('tickets_soporte')
      .select('*')
      .eq('usuario_id', usuarioId)
      .eq('estado', 'pendiente');
  }

  async obtenerTodasSolicitudesSoporte() {
    return this.supabase
      .from('tickets_soporte')
      .select('*')
      .order('creado_en', { ascending: false });
  }

  async actualizarEstadoSolicitudSoporte(id: string, estado: string) {
    return this.supabase
      .from('tickets_soporte')
      .update({ estado })
      .eq('id', id);
  }

  // MENSAJERÍA TICKETS

  async enviarMensajeTicket(mensaje: { ticket_id: string; remitente_id: string; rol_remitente: string; mensaje: string }) {
    return this.supabase
      .from('mensajes_ticket')
      .insert([mensaje])
      .select()
      .single();
  }

  async obtenerMensajesPorTicket(ticketId: string) {
    return this.supabase
      .from('mensajes_ticket')
      .select('*')
      .eq('ticket_id', ticketId)
      .order('creado_en', { ascending: true });
  }

  async obtenerMensajesNoLeidosUsuario(usuarioId: string) {
    // Busca los tickets del usuario
    const { data: tickets } = await this.supabase
      .from('tickets_soporte')
      .select('id')
      .eq('usuario_id', usuarioId);

    if (!tickets || tickets.length === 0) return { data: [], error: null };

    const ticketIds = tickets.map(t => t.id);

    // Busca mensajes no leídos del admin para esos tickets
    return this.supabase
      .from('mensajes_ticket')
      .select('*')
      .in('ticket_id', ticketIds)
      .eq('rol_remitente', 'admin')
      .eq('leido', false);
  }

  async marcarMensajesComoLeidos(ticketId: string) {
    return this.supabase
      .from('mensajes_ticket')
      .update({ leido: true })
      .eq('ticket_id', ticketId)
      .eq('rol_remitente', 'admin')
      .eq('leido', false);
  }
}