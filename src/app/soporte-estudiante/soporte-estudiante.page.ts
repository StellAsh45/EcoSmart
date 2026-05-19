import { Component, OnInit, OnDestroy, ViewChild, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormControl, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import {
  IonContent, IonLabel, IonIcon, IonSegment, IonSegmentButton, IonSpinner,
  IonInput, IonTextarea, IonModal
} from '@ionic/angular/standalone';
import { SupabaseService } from '../services/supabase';
import { addIcons } from 'ionicons';
import {
  sendOutline, chatbubblesOutline, addOutline, arrowBackOutline,
  timeOutline, checkmarkDoneOutline, closeCircleOutline, personOutline,
  arrowForwardOutline, personCircleOutline, mailOutline, textOutline,
  documentTextOutline, alertCircleOutline, checkmarkCircleOutline, calendarOutline
} from 'ionicons/icons';

import { FondoVisualComponent } from '../components/fondo-visual/fondo-visual.component';
import { EcoSmartLogoComponent } from '../components/eco-smart-logo/eco-smart-logo.component';
import { OverlayConfirmacionComponent } from '../components/overlay-confirmacion/overlay-confirmacion.component';

@Component({
  selector: 'app-soporte-estudiante',
  templateUrl: './soporte-estudiante.page.html',
  styleUrls: ['./soporte-estudiante.page.scss'],
  standalone: true,
  imports: [
    IonContent, IonIcon, IonLabel, IonInput, IonTextarea,
    IonSegment, IonSegmentButton, IonSpinner, IonModal, CommonModule, FormsModule,
    FondoVisualComponent, EcoSmartLogoComponent, OverlayConfirmacionComponent
  ]
})
export class SoporteEstudiantePage implements OnInit, OnDestroy {
  @ViewChild('chatContent') chatContent!: IonContent;

  usuarioId: string = '';
  nombreUsuario: string = '';
  correoUsuario: string = '';

  vistaActual: string = 'nuevo';
  tickets: any[] = [];
  mensajes: any[] = [];
  ticketSeleccionado: any = null;
  chatAbierto: boolean = false;

  nuevoTicket = { titulo: '', contenido: '' };
  nuevoMensaje: string = '';
  cargando: boolean = false;
  bloquearClicks: boolean = false;

  mostrarOverlayRestriccion: boolean = false;
  mensajeRestriccion: string = '';
  tituloRestriccion: string = '';
  mostrarOverlayExito: boolean = false;

  iconos = {
    titulo: textOutline,
    contenido: documentTextOutline
  };

  private realtimeChannel: any;
  private limpiezaInterval: any;
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);

  constructor(private supabase: SupabaseService) {
    addIcons({
      'send-outline': sendOutline,
      'chatbubbles-outline': chatbubblesOutline,
      'add-outline': addOutline,
      'arrow-back-outline': arrowBackOutline,
      'time-outline': timeOutline,
      'checkmark-done-outline': checkmarkDoneOutline,
      'close-circle-outline': closeCircleOutline,
      'person-outline': personOutline,
      'arrow-forward-outline': arrowForwardOutline,
      'person-circle-outline': personCircleOutline,
      'mail-outline': mailOutline,
      'text-outline': textOutline,
      'document-text-outline': documentTextOutline,
      'alert-circle-outline': alertCircleOutline,
      'checkmark-circle-outline': checkmarkCircleOutline,
      'calendar-outline': calendarOutline
    });
  }

  async ngOnInit() {
    try {
      const { data: { user } } = await this.supabase.obtenerUsuario();
      if (user) {
        this.usuarioId = user.id;
        this.correoUsuario = user.email || '';

        const { data: perfil } = await this.supabase.obtenerPerfil(user.id);
        this.nombreUsuario = perfil?.nombre || user.user_metadata?.['full_name'] || 'Usuario';
      }
    } catch (e) {
      console.error(e);
    }
  }

  async ionViewWillEnter() {
    this.cargando = true;
    try {
      await this.limpiarTicketsAntiguos();
      await this.cargarTickets();
      this.suscribirseARealtime();

      // Temporizador para comprobar y limpiar tickets antiguos en tiempo real cada 30 segundos
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

  ngOnDestroy() {
    if (this.realtimeChannel) {
      this.supabase.cliente.removeChannel(this.realtimeChannel);
    }
    if (this.limpiezaInterval) {
      clearInterval(this.limpiezaInterval);
    }
  }

  async cargarTickets() {
    const { data, error } = await this.supabase.cliente
      .from('tickets_soporte')
      .select('*')
      .eq('usuario_id', this.usuarioId)
      .order('creado_en', { ascending: false });

    if (data) {
      this.tickets = data;

      const { data: noLeidosData } = await this.supabase.cliente
        .from('mensajes_ticket')
        .select('ticket_id')
        .eq('rol_remitente', 'admin')
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
    }
  }

  async crearTicket() {
    if (!this.nuevoTicket.titulo || !this.nuevoTicket.contenido) {
      this.tituloRestriccion = 'Campos Incompletos';
      this.mensajeRestriccion = 'Por favor, completa tanto el título como la descripción para poder procesar tu solicitud.';
      this.mostrarOverlayRestriccion = true;
      setTimeout(() => {
        this.mostrarOverlayRestriccion = false;
      }, 2000);
      return;
    }

    // Máximo 2 solicitudes activas
    const solicitudesActivas = this.tickets.filter(t => t.estado !== 'Cerrado');
    if (solicitudesActivas.length >= 2) {
      this.tituloRestriccion = 'Límite Alcanzado';
      this.mensajeRestriccion = 'Lo sentimos, solo puedes tener un máximo de 2 solicitudes activas simultáneamente. Por favor, espera a que una de tus solicitudes actuales sea resuelta y cerrada.';
      this.mostrarOverlayRestriccion = true;
      setTimeout(() => {
        this.mostrarOverlayRestriccion = false;
      }, 2000);
      return;
    }

    this.cargando = true;
    const ticketData = {
      usuario_id: this.usuarioId,
      nombre_usuario: this.nombreUsuario,
      correo_usuario: this.correoUsuario,
      titulo: this.nuevoTicket.titulo,
      contenido: this.nuevoTicket.contenido,
      estado: 'Abierto'
    };

    const { data, error } = await this.supabase.cliente
      .from('tickets_soporte')
      .insert([ticketData])
      .select()
      .single();

    if (!error && data) {
      this.nuevoTicket = { titulo: '', contenido: '' };
      await this.cargarTickets();
      this.mensajeRestriccion = '¡Solicitud enviada! Puedes ver el estado y chatear con nosotros en la pestaña "Mis Solicitudes".';
      this.mostrarOverlayExito = true;
      setTimeout(() => {
        this.mostrarOverlayExito = false;
        this.vistaActual = 'lista';
      }, 3000);
    }
    this.cargando = false;
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
    this.cargarTickets(); // Recargar para limpiar notificaciones
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

  ajustarAltura(event: any) {
    const element = event.target;
    element.style.height = 'auto';
    const newHeight = element.scrollHeight;
    element.style.height = newHeight + 'px';

    // Solo mostramos scroll si superamos los 150px
    if (newHeight > 100) {
      element.style.overflowY = 'auto';
    } else {
      element.style.overflowY = 'hidden';
    }
  }

  async enviarMensaje() {
    if (!this.nuevoMensaje || !this.ticketSeleccionado) return;

    const textoMensaje = this.nuevoMensaje;
    this.nuevoMensaje = '';

    const tempId = 'temp-' + Date.now();
    const msgData = {
      ticket_id: this.ticketSeleccionado.id,
      remitente_id: this.usuarioId,
      rol_remitente: 'estudiante',
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
      .eq('rol_remitente', 'admin')
      .eq('leido', false);
  }

  suscribirseARealtime() {
    if (this.realtimeChannel) {
      this.supabase.cliente.removeChannel(this.realtimeChannel);
    }
    this.realtimeChannel = this.supabase.cliente.channel('chat-estudiante')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'mensajes_ticket' }, (payload) => {
        if (this.ticketSeleccionado && payload.new['ticket_id'] === this.ticketSeleccionado.id) {
          // Evitar duplicados
          const existe = this.mensajes.some(m => m.id === payload.new['id'] || (m.mensaje === payload.new['mensaje'] && typeof m.id === 'string' && m.id.startsWith('temp-')));
          if (!existe) {
            this.mensajes.push(payload.new);
            this.procesarMensajes();
            if (payload.new['rol_remitente'] === 'admin') {
              this.marcarComoLeidos();
            }
            this.scrollChatToBottom();
          }
          this.cdr.detectChanges();
        } else {
          this.cargarTickets();
        }
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'tickets_soporte' }, (payload) => {
        if (this.ticketSeleccionado && payload.new['id'] === this.ticketSeleccionado.id) {
          this.ticketSeleccionado.estado = payload.new['estado'];
          this.ticketSeleccionado.actualizado_en = payload.new['actualizado_en'];
          this.cdr.detectChanges();
        }
        this.cargarTickets();
      })
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'tickets_soporte' }, (payload) => {
        if (this.ticketSeleccionado && payload.old['id'] === this.ticketSeleccionado.id) {
          this.cerrarChat();
        }
        this.cargarTickets();
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

  async cambiarVista(event: any) {
    const vista = event.detail.value;
    this.vistaActual = vista;

    this.bloquearClicks = true;
    setTimeout(() => {
      this.bloquearClicks = false;
    }, 500);

    if (vista === 'lista') {
      this.cargando = true;
      try {
        await this.cargarTickets();
        await new Promise(resolve => setTimeout(resolve, 800));
      } finally {
        this.cargando = false;
      }
    }
  }

  async limpiarTicketsAntiguos() {
    const tresDiasAtras = new Date();
    tresDiasAtras.setDate(tresDiasAtras.getDate() - 3);

    const { data: ticketsViejos, error: errFiltro } = await this.supabase.cliente
      .from('tickets_soporte')
      .select('id')
      .eq('usuario_id', this.usuarioId)
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

      this.tickets = this.tickets.filter(t => !ids.includes(t.id));
      this.cdr.detectChanges();
    }
  }

  volverAlDashboard() {
    this.router.navigate(['/dashboard-estudiante']);
  }

  trackByTicketId(index: number, ticket: any): string {
    return ticket.id;
  }

  trackByMessageId(index: number, msg: any): string {
    return msg.id;
  }
}
