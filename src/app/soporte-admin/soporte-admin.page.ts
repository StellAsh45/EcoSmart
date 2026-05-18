import { Component, OnInit, OnDestroy, ViewChild, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import {
  IonContent, IonLabel, IonIcon, IonSegment, IonSegmentButton,
  IonModal, AlertController
} from '@ionic/angular/standalone';
import { SupabaseService } from '../services/supabase';
import { addIcons } from 'ionicons';
import {
  sendOutline, chatbubblesOutline, arrowBackOutline, checkmarkCircleOutline,
  closeCircleOutline, personCircleOutline, mailOutline, settingsOutline,
  alertCircleOutline, personOutline, logOutOutline, trashOutline
} from 'ionicons/icons';

import { FondoVisualComponent } from '../components/fondo-visual/fondo-visual.component';
import { EcoSmartLogoComponent } from '../components/eco-smart-logo/eco-smart-logo.component';
import { TarjetaEstadisticaComponent } from '../components/tarjeta-estadistica/tarjeta-estadistica.component';
import { OverlayConfirmacionComponent } from '../components/overlay-confirmacion/overlay-confirmacion.component';

@Component({
  selector: 'app-soporte-admin',
  templateUrl: './soporte-admin.page.html',
  styleUrls: ['./soporte-admin.page.scss'],
  standalone: true,
  imports: [
    IonContent, IonLabel, IonIcon, IonSegment, IonSegmentButton,
    IonModal, CommonModule, FormsModule,
    FondoVisualComponent, EcoSmartLogoComponent, TarjetaEstadisticaComponent, OverlayConfirmacionComponent
  ]
})
export class SoporteAdminPage implements OnInit, OnDestroy {
  @ViewChild('chatContent') chatContent!: IonContent;

  adminId: string = '';
  tickets: any[] = [];
  ticketsFiltrados: any[] = [];
  mensajes: any[] = [];
  ticketSeleccionado: any = null;
  chatAbierto: boolean = false;

  mostrarOverlayEliminar: boolean = false;
  ticketAEliminar: any = null;

  filtroEstado: string = 'Abierto';
  nombreUsuario: string = '';
  nuevoMensaje: string = '';
  cargando: boolean = true;
  bloquearClicks: boolean = false;

  private realtimeChannel: any;
  private limpiezaInterval: any;
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);

  private alertController = inject(AlertController);

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
      'log-out-outline': logOutOutline,
      'trash-outline': trashOutline
    });
  }

  async ngOnInit() {
    try {
      const { data: { user } } = await this.supabase.obtenerUsuario();
      if (user) {
        this.adminId = user.id;
        this.nombreUsuario = user.user_metadata?.['full_name'] || user.user_metadata?.['name'] || user.email || 'Admin';
      }
    } catch (e) {
      console.error(e);
    }
  }

  async ionViewWillEnter() {
    this.cargando = true;
    try {
      await this.limpiarTicketsAntiguos();
      await this.cargarTodosLosTickets();
      this.suscribirseARealtime();

      // Comprobar y limpiar tickets antiguos en tiempo real cada 30 segundos
      this.limpiezaInterval = setInterval(async () => {
        await this.limpiarTicketsAntiguos();
      }, 30000);
    } catch (e) {
      console.error(e);
    } finally {
      this.cargando = false;
    }
  }

  ionViewDidLeave() {
    if (this.realtimeChannel) {
      this.supabase.cliente.removeChannel(this.realtimeChannel);
      this.realtimeChannel = null;
    }
    if (this.limpiezaInterval) {
      clearInterval(this.limpiezaInterval);
      this.limpiezaInterval = null;
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
    if (this.limpiezaInterval) {
      clearInterval(this.limpiezaInterval);
    }
  }

  async cargarTodosLosTickets() {
    const { data } = await this.supabase.cliente
      .from('tickets_soporte')
      .select('*')
      .order('creado_en', { ascending: false });

    if (data) {
      this.tickets = data;
      
      // Optimizador: Traer todos los no leídos de estudiantes con 1 sola consulta agrupada en memoria
      const { data: noLeidosData } = await this.supabase.cliente
        .from('mensajes_ticket')
        .select('ticket_id')
        .eq('rol_remitente', 'estudiante')
        .eq('leido', false);

      const counts: { [key: string]: number } = {};
      if (noLeidosData) {
        for (const msg of noLeidosData) {
          counts[msg.ticket_id] = (counts[msg.ticket_id] || 0) + 1;
        }
      }

      for (let ticket of this.tickets) {
        ticket.no_leidos = counts[ticket.id] || 0;
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
    
    // Evitar click fantasma (bleed-through) y spam del deslizador (cooldown de 500ms)
    this.bloquearClicks = true;
    setTimeout(() => {
      this.bloquearClicks = false;
    }, 500);
  }

  async abrirChat(ticket: any) {
    if (this.bloquearClicks) return;
    this.ticketSeleccionado = ticket;
    this.chatAbierto = true;
    await this.cargarMensajes();
    await this.marcarComoLeidos();
    this.scrollChatToBottom();
  }

  cerrarChat() {
    this.chatAbierto = false;
  }

  onChatDismissed() {
    this.chatAbierto = false;
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

    if (data) {
      this.mensajes = data;
      this.procesarMensajes();
    }
  }

  procesarMensajes() {
    for (let i = 0; i < this.mensajes.length; i++) {
      const msg = this.mensajes[i];
      const prevMsg = i > 0 ? this.mensajes[i - 1] : null;
      
      if (!prevMsg) {
        msg.mostrarFechaHeader = true;
      } else {
        const anterior = new Date(prevMsg.creado_en);
        const actual = new Date(msg.creado_en);
        msg.mostrarFechaHeader = anterior.toDateString() !== actual.toDateString();
      }
      
      if (msg.mostrarFechaHeader) {
        msg.etiquetaDia = this.obtenerEtiquetaDia(msg.creado_en);
      }
    }
  }

  async enviarMensaje() {
    if (!this.nuevoMensaje || !this.ticketSeleccionado) return;

    const textoMensaje = this.nuevoMensaje;
    this.nuevoMensaje = '';

    const tempId = 'temp-' + Date.now();
    const msgData = {
      ticket_id: this.ticketSeleccionado.id,
      remitente_id: this.adminId,
      rol_remitente: 'admin',
      mensaje: textoMensaje,
      leido: false
    };

    const msgOptimista = {
      ...msgData,
      id: tempId,
      creado_en: new Date().toISOString()
    };

    this.mensajes.push(msgOptimista);
    this.procesarMensajes();
    this.scrollChatToBottom();

    const { error, data } = await this.supabase.cliente
      .from('mensajes_ticket')
      .insert([msgData])
      .select()
      .single();

    if (!error && data) {
      const index = this.mensajes.findIndex(m => m.id === tempId);
      if (index !== -1) {
        this.mensajes[index] = data;
        this.procesarMensajes();
      }
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
    const now = new Date().toISOString();
    const { error } = await this.supabase.cliente
      .from('tickets_soporte')
      .update({ estado: nuevoEstado, actualizado_en: now })
      .eq('id', this.ticketSeleccionado.id);

    if (!error) {
      this.ticketSeleccionado.estado = nuevoEstado;
      this.ticketSeleccionado.actualizado_en = now;
      this.cargarTodosLosTickets();
    }
  }

  suscribirseARealtime() {
    if (this.realtimeChannel) {
      this.supabase.cliente.removeChannel(this.realtimeChannel);
    }
    this.realtimeChannel = this.supabase.cliente.channel('chat-admin')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'mensajes_ticket' }, (payload) => {
        if (this.ticketSeleccionado && payload.new['ticket_id'] === this.ticketSeleccionado.id) {
          const existe = this.mensajes.some(m => m.id === payload.new['id'] || (m.mensaje === payload.new['mensaje'] && typeof m.id === 'string' && m.id.startsWith('temp-')));
          if (!existe) {
            this.mensajes.push(payload.new);
            this.procesarMensajes();
            if (payload.new['rol_remitente'] === 'estudiante') {
              this.marcarComoLeidos();
            }
            this.scrollChatToBottom();
          }
          this.cdr.detectChanges();
        } else {
          this.cargarTodosLosTickets();
        }
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'tickets_soporte' }, () => {
        this.cargarTodosLosTickets();
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'tickets_soporte' }, (payload) => {
        if (this.ticketSeleccionado && payload.new['id'] === this.ticketSeleccionado.id) {
          this.ticketSeleccionado.estado = payload.new['estado'];
          this.ticketSeleccionado.actualizado_en = payload.new['actualizado_en'];
          this.cdr.detectChanges();
        }
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

  esNuevoDia(fechaAnterior: string | null, fechaActual: string): boolean {
    if (!fechaAnterior) return true;
    const anterior = new Date(fechaAnterior);
    const actual = new Date(fechaActual);
    return anterior.toDateString() !== actual.toDateString();
  }

  obtenerEtiquetaDia(fechaStr: string): string {
    const fecha = new Date(fechaStr);
    const hoy = new Date();
    const ayer = new Date();
    ayer.setDate(hoy.getDate() - 1);

    if (fecha.toDateString() === hoy.toDateString()) {
      return 'Hoy';
    } else if (fecha.toDateString() === ayer.toDateString()) {
      return 'Ayer';
    } else {
      const opciones: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'long', year: 'numeric' };
      return fecha.toLocaleDateString('es-ES', opciones);
    }
  }

  ajustarAltura(event: any) {
    const textarea = event.target;
    textarea.style.height = 'auto';
    textarea.style.height = (textarea.scrollHeight) + 'px';
  }

  async limpiarTicketsAntiguos() {
    const tresDiasAtras = new Date();
    tresDiasAtras.setDate(tresDiasAtras.getDate() - 3);

    const { data: ticketsViejos, error: errFiltro } = await this.supabase.cliente
      .from('tickets_soporte')
      .select('id')
      .eq('estado', 'Cerrado')
      .lt('actualizado_en', tresDiasAtras.toISOString());

    if (errFiltro) {
      console.error('Error al filtrar tickets viejos:', errFiltro);
    }

    if (ticketsViejos && ticketsViejos.length > 0) {
      const ids = ticketsViejos.map(t => t.id);
      
      const { error: errDelMsg } = await this.supabase.cliente
        .from('mensajes_ticket')
        .delete()
        .in('ticket_id', ids);
      if (errDelMsg) console.error('Error al eliminar mensajes:', errDelMsg);

      const { error: errDelTicket } = await this.supabase.cliente
        .from('tickets_soporte')
        .delete()
        .in('id', ids);
      if (errDelTicket) console.error('Error al eliminar tickets:', errDelTicket);

      // Eliminar del estado local para que desaparezcan en tiempo real de la pantalla
      this.tickets = this.tickets.filter(t => !ids.includes(t.id));
      this.filtrarTickets();
      this.cdr.detectChanges();
    }
  }

  eliminarTicket(ticket: any, event: Event) {
    event.stopPropagation();
    this.ticketAEliminar = ticket;
    this.mostrarOverlayEliminar = true;
  }

  async confirmarEliminarTicket() {
    if (!this.ticketAEliminar) return;
    this.mostrarOverlayEliminar = false;

    this.tickets = this.tickets.filter(t => t.id !== this.ticketAEliminar.id);
    this.filtrarTickets();

    const ticketId = this.ticketAEliminar.id;
    this.ticketAEliminar = null;

    await this.supabase.cliente.from('mensajes_ticket').delete().eq('ticket_id', ticketId);
    await this.supabase.cliente.from('tickets_soporte').delete().eq('id', ticketId);

    await this.cargarTodosLosTickets();
  }

  cancelarEliminarTicket() {
    this.mostrarOverlayEliminar = false;
    this.ticketAEliminar = null;
  }

  trackByTicketId(index: number, ticket: any): string {
    return ticket.id;
  }

  trackByMessageId(index: number, msg: any): string {
    return msg.id;
  }
}
