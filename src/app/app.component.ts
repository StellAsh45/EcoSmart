import { Component, NgZone, OnInit } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { App, URLOpenListenerEvent } from '@capacitor/app';
import { IonApp, IonRouterOutlet } from '@ionic/angular/standalone';
import { SupabaseService } from './services/supabase';
import { SoporteFlotanteComponent } from './components/soporte-flotante/soporte-flotante.component';
import { CommonModule } from '@angular/common';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  standalone: true,
  imports: [IonApp, IonRouterOutlet, SoporteFlotanteComponent, CommonModule],
})
export class AppComponent implements OnInit {
  mostrarBotonSoporte: boolean = false;

  constructor(
    private router: Router,
    private zone: NgZone,
    private supabase: SupabaseService
  ) {
    this.initializeApp();
  }

  ngOnInit() {
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: any) => {
      const url = event.urlAfterRedirects || event.url;
      this.validarVisibilidadSoporte(url);
    });
  }

  validarVisibilidadSoporte(url: string) {
    // Rutas donde NO se debe mostrar
    const rutasOcultas = [
      '/home',
      '/ingreso',
      '/registro',
      '/recuperacion',
      '/restablecer-contrasena',
      '/clicker',
      '/dashboard-admin',
      '/soporte-admin',
      '/soporte-estudiante'
    ];

    // Si la URL empieza con alguna de las rutas ocultas, no lo mostramos
    this.mostrarBotonSoporte = !rutasOcultas.some(ruta => url.startsWith(ruta)) && url !== '/';
  }

  initializeApp() {
    // Para WEB: Supabase dispara este evento cuando el usuario llega desde el link del correo
    this.supabase.cliente.auth.onAuthStateChange((event, session) => {
      this.zone.run(() => {
        if (event === 'PASSWORD_RECOVERY') {
          // Guardar en sessionStorage que el usuario llegó desde el correo de recuperación
          sessionStorage.setItem('modo_recuperacion', 'true');
          this.router.navigate(['/restablecer-contrasena']);
        }
      });
    });

    // Para ANDROID/iOS: Captura el link cuando la App se abre desde el correo
    App.addListener('appUrlOpen', (event: URLOpenListenerEvent) => {
      this.zone.run(async () => {
        try {
          const url = new URL(event.url);

          if (url.host === 'confirmar' || url.host === 'restablecer-contrasena') {
            const hashParams = new URLSearchParams(url.hash.substring(1));
            const accessToken = hashParams.get('access_token');
            const refreshToken = hashParams.get('refresh_token');
            const tipo = hashParams.get('type');

            if (accessToken && refreshToken) {
              const { data, error } = await this.supabase.cliente.auth.setSession({
                access_token: accessToken,
                refresh_token: refreshToken
              });

              if (error) {
                console.error('Error estableciendo sesión:', error.message);
                return;
              }

              if (data?.session) {
                if (url.host === 'restablecer-contrasena') {
                  // Guardar en sessionStorage que el usuario llegó desde el correo de recuperación
                  sessionStorage.setItem('modo_recuperacion', 'true');
                  this.router.navigate(['/restablecer-contrasena']);
                } else {
                  this.router.navigate(['/perfil']);
                }
              }
            }
          }
        } catch (err) {
          console.error('Error procesando el link:', err);
        }
      });
    });
  }
}
