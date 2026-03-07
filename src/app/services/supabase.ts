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

  get client() {
    return this.supabase;
  }

  async signIn(email: string, password: string) {
    return this.supabase.auth.signInWithPassword({
      email,
      password,
    });
  }

  async signUp(email: string, password: string, fullName: string) {
    return this.supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
      },
    });
  }

  async signOut() {
    return this.supabase.auth.signOut();
  }

  getUser() {
    return this.supabase.auth.getUser();
  }
}
