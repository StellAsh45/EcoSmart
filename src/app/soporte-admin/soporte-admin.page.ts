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

  private realtimeChannel: any;
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
    this.cargando = true;
    try {
      const { data: { user } } = await this.supabase.obtenerUsuario();
      if (user) {
        this.adminId = user.id;
        this.nombreUsuario = user.user_metadata?.['full_name'] || user.user_metadata?.['name'] || user.email || 'Admin';
        await this.limpiarTicketsAntiguos();
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
    this.chatAbierto = true;
    await this.cargarMensajes();
    await this.marcarComoLeidos();
    this.scrollChatToBottom();
  }

  cerrarChat() {
    this.chatAbierto = false;
  }

  onChatDismissed() {
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
    this.realtimeChannel = this.supabase.cliente.channel('chat-admin')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'mensajes_ticket' }, (payload) => {
        if (this.ticketSeleccionado && payload.new['ticket_id'] === this.ticketSeleccionado.id) {
          const existe = this.mensajes.some(m => m.id === payload.new['id'] || (m.mensaje === payload.new['mensaje'] && typeof m.id === 'string' && m.id.startsWith('temp-')));
          if (!existe) {
            this.mensajes.push(payload.new);
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

    const { data: ticketsViejos } = await this.supabase.cliente
      .from('tickets_soporte')
      .select('id')
      .eq('estado', 'Cerrado')
      .lt('actualizado_en', tresDiasAtras.toISOString());

    if (ticketsViejos && ticketsViejos.length > 0) {
      const ids = ticketsViejos.map(t => t.id);
      await this.supabase.cliente.from('mensajes_ticket').delete().in('ticket_id', ids);
      await this.supabase.cliente.from('tickets_soporte').delete().in('id', ids);
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
    
    // Eliminación Optimista en la Interfaz (sin saltos visuales)
    this.tickets = this.tickets.filter(t => t.id !== this.ticketAEliminar.id);
    this.filtrarTickets();
    
    // Eliminación en base de datos en segundo plano
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
}
