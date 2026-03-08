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
}
