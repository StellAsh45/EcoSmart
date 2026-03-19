import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { SupabaseService } from '../services/supabase';

@Injectable({
  providedIn: 'root'
})
export class AdminGuard implements CanActivate {
  constructor(private supabaseSvc: SupabaseService, private router: Router) {}

  async canActivate(): Promise<boolean> {
    const { data: { user } } = await this.supabaseSvc.obtenerUsuario();
    
    if (!user) {
      this.router.navigate(['/ingreso']);
      return false;
    }

    const { data: perfil } = await this.supabaseSvc.obtenerPerfil(user.id);
    
    if (perfil?.rol === 'admin') {
      return true;
    }

    // Si no es admin, mandarlo a su dashboard de estudiante
    this.router.navigate(['/dashboard-estudiante']);
    return false;
  }
}
