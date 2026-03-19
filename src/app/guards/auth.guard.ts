import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { SupabaseService } from '../services/supabase';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  constructor(private supabaseSvc: SupabaseService, private router: Router) {}

  async canActivate(): Promise<boolean> {
    const { data: { user } } = await this.supabaseSvc.obtenerUsuario();
    
    if (!user) {
      this.router.navigate(['/ingreso']);
      return false;
    }

    // Verificar si el usuario es admin para evitar que entre al dashboard de estudiante
    const { data: perfil } = await this.supabaseSvc.obtenerPerfil(user.id);
    
    if (perfil?.rol === 'admin') {
      this.router.navigate(['/dashboard-admin']);
      return false;
    }

    return true;
  }
}
