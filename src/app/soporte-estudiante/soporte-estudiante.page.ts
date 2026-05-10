import { Component, OnInit, OnDestroy, ViewChild, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormControl, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import {
  IonContent, IonLabel, IonIcon, IonSegment, IonSegmentButton, IonSpinner, IonFooter,
  IonInput, IonTextarea
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
    IonSegment, IonSegmentButton, IonSpinner, IonFooter, CommonModule, FormsModule,
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

  nuevoTicket = { titulo: '', contenido: '' };
  nuevoMensaje: string = '';
  cargando: boolean = false;

  mostrarOverlayRestriccion: boolean = false;
  mensajeRestriccion: string = '';
  tituloRestriccion: string = '';
  mostrarOverlayExito: boolean = false;

  iconos = {
    titulo: textOutline,
    contenido: documentTextOutline
  };

  private realtimeChannel: any;
  private router = inject(Router);

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
    this.cargando = true;
    try {
      const { data: { user } } = await this.supabase.obtenerUsuario();
      if (user) {
        this.usuarioId = user.id;
        this.correoUsuario = user.email || '';

        const { data: perfil } = await this.supabase.obtenerPerfil(user.id);
        this.nombreUsuario = perfil?.nombre || user.user_metadata?.['full_name'] || 'Usuario';

        await this.cargarTickets();
        this.suscribirseARealtime();
      }
    } catch (e) {
      console.error(e);
    } finally {
      this.cargando = false;
    }
  }

  ngOnDestroy() {
    if (this.realtimeChannel) {
      this.supabase.cliente.removeChannel(this.realtimeChannel);
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
      // Para cada ticket, contar mensajes no leídos del admin
      for (let ticket of this.tickets) {
        const { count } = await this.supabase.cliente
          .from('mensajes_ticket')
          .select('*', { count: 'exact', head: true })
          .eq('ticket_id', ticket.id)
          .eq('rol_remitente', 'admin')
          .eq('leido', false);
        ticket.no_leidos = count || 0;
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
    this.ticketSeleccionado = ticket;
    await this.cargarMensajes();
    await this.marcarComoLeidos();
    this.scrollChatToBottom();
  }

  cerrarChat() {
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

    if (data) this.mensajes = data;
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

    const msgData = {
      ticket_id: this.ticketSeleccionado.id,
      remitente_id: this.usuarioId,
      rol_remitente: 'estudiante',
      mensaje: this.nuevoMensaje,
      leido: false
    };

    const { error } = await this.supabase.cliente
      .from('mensajes_ticket')
      .insert([msgData]);

    if (!error) {
      this.nuevoMensaje = '';
      this.scrollChatToBottom();
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
    this.realtimeChannel = this.supabase.cliente.channel('chat-estudiante')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'mensajes_ticket' }, (payload) => {
        if (this.ticketSeleccionado && payload.new['ticket_id'] === this.ticketSeleccionado.id) {
          // Evitar duplicados
          const existe = this.mensajes.some(m => m.id === payload.new['id']);
          if (!existe) {
            this.mensajes.push(payload.new);
            if (payload.new['rol_remitente'] === 'admin') {
              this.marcarComoLeidos();
            }
            this.scrollChatToBottom();
          }
        } else {
          this.cargarTickets();
        }
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'tickets_soporte' }, (payload) => {
        if (this.ticketSeleccionado && payload.new['id'] === this.ticketSeleccionado.id) {
          this.ticketSeleccionado.estado = payload.new['estado'];
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

  async cambiarVista(event: any) {
    const vista = event.detail.value;
    this.vistaActual = vista;
    
    if (vista === 'lista') {
      this.cargando = true;
      try {
        await this.cargarTickets();
        // Delay artificial para que el usuario aprecie el feedback visual premium
        await new Promise(resolve => setTimeout(resolve, 800));
      } finally {
        this.cargando = false;
      }
    }
  }

  volverAlDashboard() {
    this.router.navigate(['/dashboard-estudiante']);
  }
}
