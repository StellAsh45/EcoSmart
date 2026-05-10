import { Component, OnInit, OnDestroy, ViewChild, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import {
  IonContent, IonLabel, IonIcon, IonSegment, IonSegmentButton, IonFooter
} from '@ionic/angular/standalone';
import { SupabaseService } from '../services/supabase';
import { addIcons } from 'ionicons';
import {
  sendOutline, chatbubblesOutline, arrowBackOutline, checkmarkCircleOutline,
  closeCircleOutline, personCircleOutline, mailOutline, settingsOutline,
  alertCircleOutline, personOutline, logOutOutline
} from 'ionicons/icons';

import { FondoVisualComponent } from '../components/fondo-visual/fondo-visual.component';
import { EcoSmartLogoComponent } from '../components/eco-smart-logo/eco-smart-logo.component';
import { TarjetaEstadisticaComponent } from '../components/tarjeta-estadistica/tarjeta-estadistica.component';

@Component({
  selector: 'app-soporte-admin',
  templateUrl: './soporte-admin.page.html',
  styleUrls: ['./soporte-admin.page.scss'],
  standalone: true,
  imports: [
    IonContent, IonLabel, IonIcon, IonSegment, IonSegmentButton,
    IonFooter, CommonModule, FormsModule,
    FondoVisualComponent, EcoSmartLogoComponent, TarjetaEstadisticaComponent
  ]
})
export class SoporteAdminPage implements OnInit, OnDestroy {
  @ViewChild('chatContent') chatContent!: IonContent;

  adminId: string = '';
  tickets: any[] = [];
  ticketsFiltrados: any[] = [];
  mensajes: any[] = [];
  ticketSeleccionado: any = null;

  filtroEstado: string = 'Abierto';
  nombreUsuario: string = '';
  nuevoMensaje: string = '';
  cargando: boolean = true;

  private realtimeChannel: any;
  private router = inject(Router);

  constructor(private supabase: SupabaseService) {
    addIcons({
      'send-outline': sendOutline,
      'chatbubbles-outline': chatbubblesOutline,
      'arrow-back-outline': arrowBackOutline,
      'checkmark-circle-outline': checkmarkCircleOutline,
      'close-circle-outline': closeCircleOutline,
      'person-circle-outline': personCircleOutline,
      'mail-outline': mailOutline,
      'settings-outline': settingsOutline,
      'alert-circle-outline': alertCircleOutline,
      'person-outline': personOutline,
      'log-out-outline': logOutOutline
    });
  }

  async ngOnInit() {
    this.cargando = true;
    try {
      const { data: { user } } = await this.supabase.obtenerUsuario();
      if (user) {
        this.adminId = user.id;
        this.nombreUsuario = user.user_metadata?.['full_name'] || user.user_metadata?.['name'] || user.email || 'Admin';
        await this.cargarTodosLosTickets();
        this.suscribirseARealtime();
      }
    } catch (e) {
      console.error(e);
    } finally {
      this.cargando = false;
    }
  }

  volverAlDashboard() {
    this.router.navigate(['/dashboard-admin']);
  }

  async irAPerfil() {
    await this.router.navigate(['/perfil']);
  }

  async cerrarSesion() {
    try {
      await this.supabase.cerrarSesion();
      this.router.navigate(['/ingreso']);
    } catch (err) {
      console.error('Error al cerrar sesión:', err);
    }
  }

  ngOnDestroy() {
    if (this.realtimeChannel) {
      this.supabase.cliente.removeChannel(this.realtimeChannel);
    }
  }

  async cargarTodosLosTickets() {
    const { data } = await this.supabase.cliente
      .from('tickets_soporte')
      .select('*')
      .order('creado_en', { ascending: false });

    if (data) {
      this.tickets = data;
      // Contar no leídos del estudiante (mensajes donde rol_remitente = 'estudiante' y leido = false)
      for (let ticket of this.tickets) {
        const { count } = await this.supabase.cliente
          .from('mensajes_ticket')
          .select('*', { count: 'exact', head: true })
          .eq('ticket_id', ticket.id)
          .eq('rol_remitente', 'estudiante')
          .eq('leido', false);
        ticket.no_leidos = count || 0;
      }
      this.filtrarTickets();
    }
  }

  get totalNoLeidos(): number {
    return this.tickets.reduce((acc, t) => acc + (t.no_leidos || 0), 0);
  }

  get totalCerrados(): number {
    return this.tickets.filter(t => t.estado === 'Cerrado').length;
  }

  get totalAbiertos(): number {
    return this.tickets.filter(t => t.estado === 'Abierto').length;
  }

  filtrarTickets() {
    this.ticketsFiltrados = this.tickets.filter(t => t.estado === this.filtroEstado);
  }

  async abrirChat(ticket: any) {
    this.ticketSeleccionado = ticket;
    await this.cargarMensajes();
    await this.marcarComoLeidos();
    this.scrollChatToBottom();
  }

  cerrarChat() {
    this.ticketSeleccionado = null;
    this.mensajes = [];
    this.cargarTodosLosTickets();
  }

  async cargarMensajes() {
    if (!this.ticketSeleccionado) return;
    const { data } = await this.supabase.cliente
      .from('mensajes_ticket')
      .select('*')
      .eq('ticket_id', this.ticketSeleccionado.id)
      .order('creado_en', { ascending: true });

    if (data) this.mensajes = data;
  }

  async enviarMensaje() {
    if (!this.nuevoMensaje || !this.ticketSeleccionado) return;

    const msgData = {
      ticket_id: this.ticketSeleccionado.id,
      remitente_id: this.adminId,
      rol_remitente: 'admin',
      mensaje: this.nuevoMensaje,
      leido: false
    };

    const { error } = await this.supabase.cliente
      .from('mensajes_ticket')
      .insert([msgData]);

    if (!error) {
      this.nuevoMensaje = '';
      await this.cargarMensajes();
      this.scrollChatToBottom();
    }
  }

  async marcarComoLeidos() {
    if (!this.ticketSeleccionado) return;
    await this.supabase.cliente
      .from('mensajes_ticket')
      .update({ leido: true })
      .eq('ticket_id', this.ticketSeleccionado.id)
      .eq('rol_remitente', 'estudiante')
      .eq('leido', false);
  }

  async cambiarEstado(nuevoEstado: string) {
    if (!this.ticketSeleccionado) return;
    const { error } = await this.supabase.cliente
      .from('tickets_soporte')
      .update({ estado: nuevoEstado, actualizado_en: new Date().toISOString() })
      .eq('id', this.ticketSeleccionado.id);

    if (!error) {
      this.ticketSeleccionado.estado = nuevoEstado;
      this.cargarTodosLosTickets();
    }
  }

  suscribirseARealtime() {
    this.realtimeChannel = this.supabase.cliente.channel('chat-admin')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'mensajes_ticket' }, (payload) => {
        if (this.ticketSeleccionado && payload.new['ticket_id'] === this.ticketSeleccionado.id) {
          this.mensajes.push(payload.new);
          if (payload.new['rol_remitente'] === 'estudiante') {
            this.marcarComoLeidos();
          }
          this.scrollChatToBottom();
        } else {
          this.cargarTodosLosTickets();
        }
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'tickets_soporte' }, () => {
        this.cargarTodosLosTickets();
      })
      .subscribe();
  }

  scrollChatToBottom() {
    setTimeout(() => {
      if (this.chatContent) {
        this.chatContent.scrollToBottom(300);
      }
    }, 100);
  }

  ajustarAltura(event: any) {
    const textarea = event.target;
    textarea.style.height = 'auto';
    textarea.style.height = (textarea.scrollHeight) + 'px';
  }
}
