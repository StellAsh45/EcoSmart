import { Component, NgZone } from '@angular/core';
import { Router } from '@angular/router';
import { App, URLOpenListenerEvent } from '@capacitor/app';
import { IonApp, IonRouterOutlet } from '@ionic/angular/standalone';
import { SupabaseService } from './services/supabase';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  standalone: true,
  imports: [IonApp, IonRouterOutlet],
})
export class AppComponent {
  constructor(
    private router: Router,
    private zone: NgZone,
    private supabase: SupabaseService
  ) {
    this.initializeApp();
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
