import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, ModalController, ToastController } from '@ionic/angular';
import { SupabaseService } from '../../services/supabase';
import { addIcons } from 'ionicons';
import { closeOutline, paperPlaneOutline } from 'ionicons/icons';

@Component({
  selector: 'app-soporte-modal',
  templateUrl: './soporte-modal.component.html',
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule]
})
export class SoporteModalComponent implements OnInit {
  @Input() email: string = '';
  @Input() userId: string = '';

  problema: string = '';
  enviando: boolean = false;

  constructor(
    private modalCtrl: ModalController,
    private supabaseSvc: SupabaseService,
    private toastCtrl: ToastController
  ) {
    addIcons({
      'close-outline': closeOutline,
      'paper-plane-outline': paperPlaneOutline
    });
  }

  ngOnInit() {
    if (!this.email) {
      this.obtenerDatosUsuario();
    }
  }

  async obtenerDatosUsuario() {
    try {
      const { data: { user } } = await this.supabaseSvc.obtenerUsuario();
      if (user) {
        this.email = user.email || '';
        this.userId = user.id;
      }
    } catch (e) {
      console.error(e);
    }
  }

  cerrar() {
    this.modalCtrl.dismiss();
  }

  async enviarSoporte() {
    if (!this.problema || this.problema.trim().length < 10) {
      const toast = await this.toastCtrl.create({
        message: 'Por favor, describe tu problema (mínimo 10 caracteres).',
        duration: 3000,
        color: 'warning',
        position: 'top'
      });
      await toast.present();
      return;
    }

    this.enviando = true;

    try {
      let nombre = 'Usuario';
      try {
        const { data: perfil } = await this.supabaseSvc.obtenerPerfil(this.userId);
        if (perfil && (perfil.full_name || perfil.nombre_completo || perfil.nombre)) {
          nombre = perfil.full_name || perfil.nombre_completo || perfil.nombre;
        }
      } catch (e) {}

      const { error } = await this.supabaseSvc.crearSolicitudSoporte({
        usuario_id: this.userId,
        correo_usuario: this.email,
        contenido: this.problema.trim(),
        titulo: 'Solicitud de soporte',
        nombre_usuario: nombre
      });

      if (error) throw error;

      const toast = await this.toastCtrl.create({
        message: 'Solicitud enviada correctamente. Te responderemos pronto.',
        duration: 3000,
        color: 'success',
        position: 'top'
      });
      await toast.present();
      
      this.modalCtrl.dismiss(true); // true = enviado con éxito
    } catch (error) {
      console.error('Error enviando soporte:', error);
      const toast = await this.toastCtrl.create({
        message: 'Hubo un error al enviar tu solicitud. Intenta más tarde.',
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
