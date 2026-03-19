import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

@Injectable({
  providedIn: 'root'
})
export class SupabaseService {
  private supabase: SupabaseClient;

  constructor() {
    const supabaseUrl = 'https://qdnivmcnsidcwlbfiuxj.supabase.co'; 
    const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFkbml2bWNuc2lkY3dsYmZpdXhqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI4NDg1NzEsImV4cCI6MjA4ODQyNDU3MX0.NdQuBwAfY1O8fXagcvqTk3U-dSdeptOAqlodtB894jI';
    
    this.supabase = createClient(supabaseUrl, supabaseAnonKey);
  }

  get cliente() {
    return this.supabase;
  }

  async iniciarSesion(email: string, password: string) {
    return this.supabase.auth.signInWithPassword({
      email,
      password,
    });
  }

  async registrarse(email: string, password: string, nombreCompleto: string) {
    return this.supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: nombreCompleto,
        },
      },
    });
  }

  async cerrarSesion() {
    return this.supabase.auth.signOut();
  }

  obtenerUsuario() {
    return this.supabase.auth.getUser();
  }

  async obtenerPerfil(id: string) {
    return this.supabase
      .from('profiles')
      .select('*')
      .eq('id', id)
      .single();
  }

  // Esta es la parte encargada de gestionar los cursos por el admin
  async crearCurso(curso: any) {
    return this.supabase.from('cursos').insert([curso]).select().single();
  }

  async obtenerCursosAdmin() {
    return this.supabase.from('cursos').select('*').order('created_at', { ascending: false });
  }

  async obtenerCursoPorId(id: string) {
    return this.supabase.from('cursos').select('*').eq('id', id).single();
  }

  async eliminarCurso(id: string) {
    return this.supabase.from('cursos').delete().eq('id', id);
  }

  // Aqui se gestionan los modulos
  async obtenerModulosCurso(cursoId: string) {
    return this.supabase.from('modulos').select('*').eq('curso_id', cursoId).order('orden', { ascending: true });
  }

  async crearModulo(modulo: any) {
    return this.supabase.from('modulos').insert([modulo]).select().single();
  }

  // Aqui se gestionan las lecciones
  async obtenerLeccionesModulo(moduloId: string) {
    return this.supabase.from('lecciones').select('*').eq('modulo_id', moduloId).order('orden', { ascending: true });
  }

  async crearLeccion(leccion: any) {
    return this.supabase.from('lecciones').insert([leccion]).select().single();
  }

  // Aqui se gestionan los examenes de curso
  async obtenerExamenModulo(moduloId: string) {
    return this.supabase.from('examenes').select('*').eq('modulo_id', moduloId).single();
  }

  async crearExamen(examen: any) {
    return this.supabase.from('examenes').insert([examen]).select().single();
  }

  async obtenerPreguntasExamen(examenId: string) {
    return this.supabase.from('preguntas').select('*').eq('examen_id', examenId).order('id', { ascending: true });
  }

  async guardarPreguntas(preguntas: any[]) {
    return this.supabase.from('preguntas').insert(preguntas).select();
  }

  // Metodo para eliminar modulos, lecciones y examen
  async eliminarModulo(id: string) {
    return this.supabase.from('modulos').delete().eq('id', id);
  }

  async eliminarLeccion(id: string) {
    return this.supabase.from('lecciones').delete().eq('id', id);
  }

  async eliminarExamen(id: string) {
    return this.supabase.from('examenes').delete().eq('id', id);
  }

  // Guardado de imagenes en supabase
  async subirImagenCurso(file: File, ruta: string) {
    return this.supabase.storage
      .from('cursos')
      .upload(ruta, file, { cacheControl: '3600', upsert: true });
  }

  obtenerUrlPublica(ruta: string) {
    return this.supabase.storage.from('cursos').getPublicUrl(ruta).data.publicUrl;
  }

  async eliminarImagenCurso(ruta: string) {
    return this.supabase.storage.from('cursos').remove([ruta]);
  }
}
