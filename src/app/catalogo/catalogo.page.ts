import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { IonContent, IonIcon } from '@ionic/angular/standalone';
import { SupabaseService } from '../services/supabase';
import { addIcons } from 'ionicons';
import {
  arrowBackOutline,
  personOutline,
  logOutOutline
} from 'ionicons/icons';

@Component({
  selector: 'app-catalogo',
  templateUrl: './catalogo.page.html',
  styleUrls: ['./catalogo.page.scss'],
  standalone: true,
  imports: [CommonModule, IonContent, IonIcon],
})
export class CatalogoPage implements OnInit {

  usuario: any = null;
  nombreUsuario: string = 'Estudiante';

  constructor(
    private router: Router,
    private supabaseSvc: SupabaseService
  ) {
    addIcons({
      arrowBackOutline,
      personOutline,
      logOutOutline
    });
  }

  async ngOnInit(): Promise<void> {
    await this.cargarUsuario();
  }

  private async cargarUsuario(): Promise<void> {
    try {

      const { data, error } = await this.supabaseSvc.obtenerUsuario();

      if (error) {
        throw error;
      }

      this.usuario = data?.user ?? null;

      if (!this.usuario) {
        this.nombreUsuario = 'Estudiante';
        return;
      }

      this.nombreUsuario =
        this.usuario.user_metadata?.['full_name'] ||
        this.usuario.user_metadata?.['name'] ||
        this.usuario.user_metadata?.['nombre'] ||
        this.usuario.email?.split('@')[0] ||
        'Estudiante';

    } catch (err) {
      console.error('Error cargando usuario en catálogo:', err);
      this.nombreUsuario = 'Estudiante';
    }
  }

  volverAlDashboard(): void {
    this.router.navigate(['/dashboard-estudiante']);
  }

  async cerrarSesion(): Promise<void> {
    try {
      await this.supabaseSvc.cerrarSesion();
      this.router.navigate(['/ingreso']);
    } catch (err) {
      console.error('Error al cerrar sesión:', err);
    }
  }
}