import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { SupabaseService } from '../../services/supabase';
import { Subscription } from 'rxjs';
import { LocalNotifications } from '@capacitor/local-notifications';

@Component({
  selector: 'app-soporte-flotante',
  standalone: true,
  imports: [IonicModule, CommonModule],
  template: `
    <div class="soporte-fab-container" (click)="abrirSoporte()">
      <div class="soporte-fab">
        <ion-icon name="chatbubbles-outline"></ion-icon>
      </div>
      <div class="soporte-badge" *ngIf="notificacionesPendientes > 0">
        {{ notificacionesPendientes }}
      </div>
    </div>
  `,
  styles: [`
    .soporte-fab-container {
      position: fixed;
      bottom: 20px;
      right: 20px;
      z-index: 9999;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    }
    .soporte-fab-container:hover {
      transform: scale(1.1);
    }
    .soporte-fab-container:active {
      transform: scale(0.95);
    }
    .soporte-fab {
      width: 60px;
      height: 60px;
      border-radius: 50%;
      background: linear-gradient(135deg, var(--ion-color-primary, #3880ff), var(--ion-color-secondary, #3dc2ff));
      box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .soporte-fab ion-icon {
      color: white;
      font-size: 32px;
    }
    .soporte-badge {
      position: absolute;
      top: -5px;
      right: -5px;
      background-color: var(--ion-color-danger, #eb445a);
      color: white;
      font-size: 12px;
      font-weight: bold;
      border-radius: 50%;
      min-width: 22px;
      height: 22px;
      display: flex;
      align-items: center;
      justify-content: center;
      border: 2px solid white;
      box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
      animation: pulse 2s infinite;
    }
    @keyframes pulse {
      0% { box-shadow: 0 0 0 0 rgba(235, 68, 90, 0.7); }
      70% { box-shadow: 0 0 0 10px rgba(235, 68, 90, 0); }
      100% { box-shadow: 0 0 0 0 rgba(235, 68, 90, 0); }
    }
  `]
})
export class SoporteFlotanteComponent implements OnInit, OnDestroy {
  notificacionesPendientes: number = 0;
  private realtimeChannel: any;
  usuarioId: string | null = null;

  constructor(private supabase: SupabaseService, private router: Router) {}

  async ngOnInit() {
    const { data: { user } } = await this.supabase.obtenerUsuario();
    if (user) {
      this.usuarioId = user.id;
      await this.cargarNotificaciones();
      this.suscribirseARealtime();

      // Solicitar permisos de notificación en Android/iOS
      try {
        await LocalNotifications.requestPermissions();
      } catch (e) {
        console.error('Error solicitando permisos de notificaciones locales', e);
      }
    }
  }

  ngOnDestroy() {
    if (this.realtimeChannel) {
      this.supabase.cliente.removeChannel(this.realtimeChannel);
    }
  }

  async cargarNotificaciones() {
    if (!this.usuarioId) return;

    try {
      const { data: tickets, error: errorTickets } = await this.supabase.cliente
        .from('tickets_soporte')
        .select('id')
        .eq('usuario_id', this.usuarioId);

      if (errorTickets || !tickets || tickets.length === 0) return;

      const ticketIds = tickets.map(t => t.id);

      const { data, error } = await this.supabase.cliente
        .from('mensajes_ticket')
        .select('id')
        .in('ticket_id', ticketIds)
        .neq('remitente_id', this.usuarioId)
        .eq('leido', false);

      if (!error && data) {
        this.notificacionesPendientes = data.length;
      }
    } catch (e) {
      console.error('Error cargando notificaciones de soporte', e);
    }
  }

  suscribirseARealtime() {
    if (!this.usuarioId) return;

    this.realtimeChannel = this.supabase.cliente.channel('notificaciones-soporte')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'mensajes_ticket'
        },
        (payload: any) => {
          this.cargarNotificaciones();
          
          if (payload.new && payload.new['remitente_id'] !== this.usuarioId) {
            try {
              LocalNotifications.schedule({
                notifications: [
                  {
                    title: 'Soporte EcoSmart',
                    body: 'El administrador ha respondido a tu consulta.',
                    id: new Date().getTime(),
                    schedule: { at: new Date(Date.now() + 100) },
                    smallIcon: 'ic_stat_icon_config_sample',
                  }
                ]
              });
            } catch (e) {
              console.error('Error enviando notificación local', e);
            }
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'mensajes_ticket',
          filter: 'leido=eq.true'
        },
        (payload) => {
          this.cargarNotificaciones();
        }
      )
      .subscribe();
  }

  abrirSoporte() {
    this.router.navigate(['/soporte-estudiante']);
  }
}
