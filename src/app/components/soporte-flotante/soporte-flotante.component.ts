import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { chatbubblesOutline } from 'ionicons/icons';
import { SupabaseService } from '../../services/supabase';
import { Subscription } from 'rxjs';
import { LocalNotifications } from '@capacitor/local-notifications';

@Component({
  selector: 'app-soporte-flotante',
  standalone: true,
  imports: [IonIcon, CommonModule],
  template: `
    <div class="fixed bottom-6 right-6 z-[9999] cursor-pointer group animate-[slideUp_0.5s_ease-out_both]" (click)="abrirSoporte()">
      
      <!-- Glow trasero animado -->
      <div class="absolute inset-0 bg-primary-500 rounded-full blur-xl opacity-30 group-hover:opacity-70 group-hover:scale-125 transition-all duration-500 animate-pulse"></div>

      <!-- Botón principal -->
      <div class="relative w-[60px] h-[60px] rounded-[2rem] bg-slate-900/90 backdrop-blur-xl border border-primary-500/30 shadow-[0_10px_30px_rgba(16,249,129,0.3)] flex items-center justify-center transition-all duration-500 group-hover:scale-110 group-hover:bg-primary-500/20 group-active:scale-95 group-hover:border-primary-400 group-hover:rounded-2xl">
        <ion-icon name="chatbubbles-outline" class="text-3xl text-primary-400 group-hover:text-primary-300 drop-shadow-[0_0_8px_rgba(16,249,129,0.5)] transition-colors duration-300"></ion-icon>
      </div>

      <!-- Badge de Notificaciones -->
      <div *ngIf="notificacionesPendientes > 0" 
           class="absolute -top-2 -right-2 bg-red-500 text-white text-[11px] font-black min-w-[24px] h-[24px] px-1.5 flex items-center justify-center rounded-full border-2 border-slate-900 shadow-[0_0_15px_rgba(239,68,68,0.8)] animate-bounce z-10">
        {{ notificacionesPendientes > 9 ? '+9' : notificacionesPendientes }}
      </div>
    </div>
  `,
  styles: []
})
export class SoporteFlotanteComponent implements OnInit, OnDestroy {
  notificacionesPendientes: number = 0;
  private realtimeChannel: any;
  usuarioId: string | null = null;

  constructor(private supabase: SupabaseService, private router: Router) {
    addIcons({ 'chatbubbles-outline': chatbubblesOutline });
  }

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
