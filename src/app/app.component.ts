import { Component, NgZone, OnInit } from '@angular/core';
import { Router, NavigationEnd, NavigationStart } from '@angular/router';
import { App, URLOpenListenerEvent } from '@capacitor/app';
import { IonApp, IonRouterOutlet } from '@ionic/angular/standalone';
import { SupabaseService } from './services/supabase';
import { SoporteFlotanteComponent } from './components/soporte-flotante/soporte-flotante.component';
import { CommonModule } from '@angular/common';
import { filter } from 'rxjs/operators';
import { PushNotificationService } from './services/push-notification.service';

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
    private supabase: SupabaseService,
    private pushNotifications: PushNotificationService
  ) {
    this.initializeApp();
  }

  private timeoutId: any;

  ngOnInit() {
    this.router.events.subscribe((event: any) => {
      if (event instanceof NavigationStart) {
        // Si vamos hacia una ruta oculta, escondemos el botón INMEDIATAMENTE
        // para que no se quede rezagado durante la transición
        if (this.esRutaOculta(event.url)) {
          clearTimeout(this.timeoutId);
          this.mostrarBotonSoporte = false;
        }
      } else if (event instanceof NavigationEnd) {
        const url = event.urlAfterRedirects || event.url;
        
        clearTimeout(this.timeoutId);
        
        if (this.esRutaOculta(url)) {
          this.mostrarBotonSoporte = false;
        } else {
          // Si vamos a una ruta donde sí se muestra (ej. dashboard),
          // esperamos 400ms a que termine la animación de transición de Ionic
          // para que el botón no aparezca flotando en medio de la pantalla antigua.
          this.timeoutId = setTimeout(() => {
            this.mostrarBotonSoporte = true;
          }, 400);
        }
      }
    });
  }

  esRutaOculta(url: string): boolean {
    const rutasOcultas = [
      '/home',
      '/ingreso',
      '/registro',
      '/recuperacion',
      '/restablecer-contrasena',
      '/gremios',
      '/dashboard-admin',
      '/constructor-curso',
      '/soporte-admin',
      '/soporte-estudiante'
    ];
    return rutasOcultas.some(ruta => url.startsWith(ruta)) || url === '/';
  }

  initializeApp() {
    // Para WEB: Supabase dispara este evento cuando el usuario llega desde el link del correo
    this.supabase.cliente.auth.onAuthStateChange((event, session) => {
      this.zone.run(() => {
        if (event === 'PASSWORD_RECOVERY') {
          // Guardar en sessionStorage que el usuario llegó desde el correo de recuperación
          sessionStorage.setItem('modo_recuperacion', 'true');
          this.router.navigate(['/restablecer-contrasena']);
        } else if (event === 'SIGNED_IN') {
          // Usuario inició sesión -> Inicializar permisos y registrar token FCM
          this.pushNotifications.inicializar();
        } else if (event === 'SIGNED_OUT') {
          // Usuario cerró sesión -> Remover token FCM de la base de datos
          this.pushNotifications.removerTokenFCMAlCerrarSesion();
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
