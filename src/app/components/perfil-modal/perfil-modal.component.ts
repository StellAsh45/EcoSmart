import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { IonContent, IonIcon, IonSpinner } from '@ionic/angular/standalone';
import { FormsModule } from '@angular/forms';
import { SupabaseService } from '../../services/supabase';
import { addIcons } from 'ionicons';
import {
  closeOutline,
  personCircleOutline,
  lockClosedOutline,
  mailOutline,
  saveOutline,
  arrowBackOutline
} from 'ionicons/icons';

@Component({
  selector: 'app-perfil-modal',
  templateUrl: './perfil-modal.component.html',
  styleUrls: ['./perfil-modal.component.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonContent, IonIcon, IonSpinner]
})
export class PerfilModalComponent implements OnInit {
  usuario: any = null;

  cargando = true;
  guardando = false;
  mensaje = '';
  error = '';

  nombre = '';
  correo = '';
  biografia = '';

  contrasenaActual = '';
  nuevaContrasena = '';
  confirmarNuevaContrasena = '';

  // Errores individuales
  nombreError = '';
  contrasenaActualError = '';
  nuevaContrasenaError = '';
  confirmarContrasenaError = '';

  constructor(
    private router: Router,
    private supabaseSvc: SupabaseService
  ) {
    addIcons({
      closeOutline,
      personCircleOutline,
      lockClosedOutline,
      mailOutline,
      saveOutline,
      arrowBackOutline
    });
  }

  async ngOnInit(): Promise<void> {
    await this.cargarUsuario();
    await this.cargarPerfil();
  }

  private async cargarUsuario(): Promise<void> {
    try {
      const { data, error } = await this.supabaseSvc.obtenerUsuario();

      if (error) throw error;

      this.usuario = data?.user ?? null;

      if (!this.usuario) {
        this.error = 'No se encontró la sesión del usuario.';
      }
    } catch (err) {
      console.error('Error en carga de usuario de perfil:', err);
      this.error = 'No se pudo obtener la sesión.';
    }
  }

  async cargarPerfil(): Promise<void> {
    this.cargando = true;
    this.error = '';

    try {
      if (!this.usuario?.id) {
        this.error = 'No se encontró la sesión del usuario.';
        return;
      }

      const { data, error } = await this.supabaseSvc.obtenerPerfil(this.usuario.id);

      if (error) throw error;

      this.nombre =
        data?.nombre ||
        this.usuario?.user_metadata?.['full_name'] ||
        this.usuario?.email?.split('@')[0] ||
        '';

      this.correo = this.usuario?.email || '';
      this.biografia = data?.biografia || '';
    } catch (err) {
      console.error('Error cargando perfil:', err);
      this.error = 'No se pudo cargar la información del perfil.';
    } finally {
      this.cargando = false;
    }
  }

  private validarCampos(): boolean {
    this.nombreError = '';
    this.contrasenaActualError = '';
    this.nuevaContrasenaError = '';
    this.confirmarContrasenaError = '';
    this.error = '';

    // Validar nombre
    if (!this.nombre || this.nombre.trim().length < 3) {
      this.nombreError = 'El nombre debe tener mínimo 3 caracteres.';
      this.error = this.nombreError;
      return false;
    }

    // Si hay cambio de contraseña
    if (
      this.nuevaContrasena ||
      this.confirmarNuevaContrasena ||
      this.contrasenaActual
    ) {
      if (!this.contrasenaActual) {
        this.contrasenaActualError = 'Debes ingresar tu contraseña actual.';
        this.error = this.contrasenaActualError;
        return false;
      }

      const regexPassword = /^(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{6,}$/;

      if (!this.nuevaContrasena) {
        this.nuevaContrasenaError = 'La nueva contraseña es requerida.';
        this.error = this.nuevaContrasenaError;
        return false;
      }

      if (!regexPassword.test(this.nuevaContrasena)) {
        this.nuevaContrasenaError =
          'La nueva contraseña debe tener mínimo 6 caracteres, una mayúscula, un número y un símbolo.';
        this.error = this.nuevaContrasenaError;
        return false;
      }

      if (this.nuevaContrasena !== this.confirmarNuevaContrasena) {
        this.confirmarContrasenaError = 'La confirmación de la nueva contraseña no coincide.';
        this.error = this.confirmarContrasenaError;
        return false;
      }
    }

    return true;
  }

  async guardarPerfil(): Promise<void> {
    if (!this.validarCampos()) {
      return;
    }

    this.guardando = true;

    try {
      if (!this.usuario?.id) {
        this.error = 'No se encontró la sesión del usuario.';
        return;
      }

      const { error: updateProfileError } = await this.supabaseSvc.actualizarPerfil(
        this.usuario.id,
        {
          nombre: this.nombre.trim(),
          biografia: this.biografia.trim()
        }
      );

      if (updateProfileError) throw updateProfileError;

      const { error: updateAuthError } = await this.supabaseSvc.actualizarDatosAuth({
        data: { full_name: this.nombre.trim() }
      });

      if (updateAuthError) throw updateAuthError;

      if (this.nuevaContrasena) {
        const { error: signInError } = await this.supabaseSvc.iniciarSesion(
          this.correo,
          this.contrasenaActual
        );

        if (signInError) {
          this.contrasenaActualError = 'La contraseña actual no es correcta.';
          this.error = 'La contraseña actual no es correcta.';
          return;
        }

        const { error: updatePasswordError } =
          await this.supabaseSvc.actualizarDatosAuth({
            password: this.nuevaContrasena
          });

        if (updatePasswordError) throw updatePasswordError;
      }

      this.mensaje = 'Perfil actualizado correctamente.';
      this.contrasenaActual = '';
      this.nuevaContrasena = '';
      this.confirmarNuevaContrasena = '';

      // Limpiar mensaje después de 3 segundos
      setTimeout(() => {
        this.mensaje = '';
      }, 3000);
    } catch (err) {
      console.error('Error actualizando perfil:', err);
      this.error = 'No fue posible actualizar el perfil. Intenta nuevamente.';
    } finally {
      this.guardando = false;
    }
  }

  cerrar(): void {
    this.router.navigate(['/dashboard-estudiante']);
  }
}