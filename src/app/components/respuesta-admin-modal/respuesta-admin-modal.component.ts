import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, ModalController, ToastController } from '@ionic/angular';
import { SupabaseService } from '../../services/supabase';
import { addIcons } from 'ionicons';
import { closeOutline, paperPlaneOutline, mailOutline } from 'ionicons/icons';

@Component({
  selector: 'app-respuesta-admin-modal',
  templateUrl: './respuesta-admin-modal.component.html',
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule]
})
export class RespuestaAdminModalComponent {
  @Input() ticketId: string = '';
  @Input() adminId: string = '';
  @Input() correoEstudiante: string = '';
  @Input() problema: string = '';

  respuesta: string = '';
  enviando: boolean = false;

  constructor(
    private modalCtrl: ModalController,
    private supabaseSvc: SupabaseService,
    private toastCtrl: ToastController
  ) {
    addIcons({
      'close-outline': closeOutline,
      'paper-plane-outline': paperPlaneOutline,
      'mail-outline': mailOutline
    });
  }

  cerrar() {
    this.modalCtrl.dismiss();
  }

  async enviarRespuesta() {
    if (!this.respuesta || this.respuesta.trim().length < 5) {
      const toast = await this.toastCtrl.create({
        message: 'Por favor, escribe una respuesta más detallada.',
        duration: 3000,
        color: 'warning',
        position: 'top'
      });
      await toast.present();
      return;
    }

    this.enviando = true;

    try {
      const { error } = await this.supabaseSvc.enviarMensajeTicket({
        ticket_id: this.ticketId,
        remitente_id: this.adminId,
        rol_remitente: 'admin',
        mensaje: this.respuesta.trim()
      });

      if (error) throw error;

      // Opcional: Marcar el ticket como "respondido" si existiera ese estado, 
      // pero usaremos 'resuelto' manualmente según el flujo anterior.

      const toast = await this.toastCtrl.create({
        message: 'Respuesta enviada correctamente.',
        duration: 3000,
        color: 'success',
        position: 'top'
      });
      await toast.present();
      
      this.modalCtrl.dismiss(true);
    } catch (error) {
      console.error('Error enviando respuesta:', error);
      const toast = await this.toastCtrl.create({
        message: 'Hubo un error al enviar la respuesta.',
        duration: 3000,
        color: 'danger',
        position: 'top'
      });
      await toast.present();
    } finally {
      this.enviando = false;
    }
  }
}
