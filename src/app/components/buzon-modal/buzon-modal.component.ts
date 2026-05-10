import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, ModalController } from '@ionic/angular';
import { SupabaseService } from '../../services/supabase';
import { addIcons } from 'ionicons';
import { closeOutline, timeOutline, checkmarkDoneOutline } from 'ionicons/icons';

@Component({
  selector: 'app-buzon-modal',
  templateUrl: './buzon-modal.component.html',
  standalone: true,
  imports: [CommonModule, IonicModule]
})
export class BuzonModalComponent implements OnInit {
  ticketsConMensajes: any[] = [];
  cargando: boolean = true;
  usuarioId: string = '';

  constructor(
    private modalCtrl: ModalController,
    private supabaseSvc: SupabaseService
  ) {
    addIcons({
      'close-outline': closeOutline,
      'time-outline': timeOutline,
      'checkmark-done-outline': checkmarkDoneOutline
    });
  }

  async ngOnInit() {
    await this.cargarBuzon();
  }

  cerrar() {
    this.modalCtrl.dismiss();
  }

  async cargarBuzon() {
    this.cargando = true;
    try {
      const { data: { user } } = await this.supabaseSvc.obtenerUsuario();
      if (!user) return;
      this.usuarioId = user.id;

      // Obtener tickets del usuario
      const { data: tickets, error: errorTickets } = await this.supabaseSvc.cliente
        .from('tickets_soporte')
        .select('*')
        .eq('usuario_id', this.usuarioId)
        .order('creado_en', { ascending: false });

      if (errorTickets) throw errorTickets;

      if (!tickets || tickets.length === 0) {
        this.ticketsConMensajes = [];
        this.cargando = false;
        return;
      }

      // Obtener mensajes de esos tickets
      const ticketIds = tickets.map((t: any) => t.id);
      const { data: mensajes, error: errorMensajes } = await this.supabaseSvc.cliente
        .from('mensajes_ticket')
        .select('*')
        .in('ticket_id', ticketIds)
        .order('creado_en', { ascending: true });

      if (errorMensajes) throw errorMensajes;

      // Agrupar mensajes por ticket
      this.ticketsConMensajes = tickets.map((t: any) => {
        const msjs = mensajes?.filter((m: any) => m.ticket_id === t.id) || [];
        return {
          ...t,
          mensajes: msjs,
          tieneNuevos: msjs.some((m: any) => m.rol_remitente === 'admin' && !m.leido)
        };
      });

      // Marcar como leídos los mensajes del admin
      for (const ticket of this.ticketsConMensajes) {
        if (ticket.tieneNuevos) {
          await this.supabaseSvc.marcarMensajesComoLeidos(ticket.id);
          ticket.tieneNuevos = false;
        }
      }

    } catch (error) {
      console.error('Error al cargar buzón:', error);
    } finally {
      this.cargando = false;
    }
  }
}
