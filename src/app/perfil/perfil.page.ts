import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { IonContent, IonIcon, IonSpinner } from '@ionic/angular/standalone';
import { ReactiveFormsModule, FormGroup, FormControl, Validators } from '@angular/forms';
import { SupabaseService } from '../services/supabase';
import { addIcons } from 'ionicons';
import { FondoVisualComponent } from '../components/fondo-visual/fondo-visual.component';
import { EcoSmartLogoComponent } from '../components/eco-smart-logo/eco-smart-logo.component';
import { CampoEntradaComponent } from '../components/campo-entrada/campo-entrada.component';
import {
  personCircleOutline,
  lockClosedOutline,
  mailOutline,
  saveOutline,
  arrowBackOutline,
  logOutOutline,
  shieldCheckmarkOutline,
  personOutline,
  alertCircleOutline,
  eyeOutline,
  eyeOffOutline,
  syncOutline,
  shieldOutline,
  keyOutline,
  checkmarkCircleOutline,
  shieldCheckmark
} from 'ionicons/icons';

@Component({
  selector: 'app-perfil',
  templateUrl: './perfil.page.html',
  styleUrls: ['./perfil.page.scss'],
  standalone: true,
  imports: [
    CommonModule, 
    ReactiveFormsModule, 
    IonContent, 
    IonIcon, 
    IonSpinner,
    FondoVisualComponent,
    EcoSmartLogoComponent,
    CampoEntradaComponent
  ]
})
export class PerfilPage implements OnInit {
  usuario: any = null;
  perfilForm!: FormGroup;

  cargando = true;
  guardando = false;
  mensaje = '';
  error = '';

  nombre = '';
  correo = '';

  // Iconos para los campos
  iconos = {
    nombre: personOutline,
    correo: mailOutline,
    clave: lockClosedOutline,
    claveNueva: keyOutline,
    confirmarClave: checkmarkCircleOutline
  };

  constructor(
    private router: Router,
    private supabaseSvc: SupabaseService
  ) {
    this.inicializarFormulario();
    addIcons({
      personCircleOutline,
      lockClosedOutline,
      mailOutline,
      saveOutline,
      arrowBackOutline,
      logOutOutline,
      shieldCheckmarkOutline,
      personOutline,
      alertCircleOutline,
      eyeOutline,
      eyeOffOutline,
      syncOutline,
      shieldOutline,
      keyOutline,
      checkmarkCircleOutline,
      shieldCheckmark
    });
  }

  private inicializarFormulario() {
    this.perfilForm = new FormGroup({
      nombre: new FormControl('', [Validators.required, Validators.minLength(3)]),
      correo: new FormControl({ value: '', disabled: true }),
      contrasenaActual: new FormControl(''),
      nuevaContrasena: new FormControl(''),
      confirmarNuevaContrasena: new FormControl('')
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
        this.router.navigate(['/ingreso']);
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

      const nombreCargado =
        data?.nombre ||
        this.usuario?.user_metadata?.['full_name'] ||
        this.usuario?.email?.split('@')[0] ||
        '';

      this.nombre = nombreCargado; // Para el header
      this.correo = this.usuario?.email || '';

      this.perfilForm.patchValue({
        nombre: nombreCargado,
        correo: this.correo
      });

    } catch (err) {
      console.error('Error cargando perfil:', err);
      this.error = 'No se pudo cargar la información del perfil.';
    } finally {
      this.cargando = false;
    }
  }

  get f() { return this.perfilForm.controls; }

  private validarCampos(): boolean {
    this.error = '';

    if (this.perfilForm.get('nombre')?.invalid) {
      this.error = 'El nombre es inválido (mínimo 3 caracteres).';
      return false;
    }

    const val = this.perfilForm.value;

    // La contraseña actual es obligatoria para confirmar identidad
    if (!val.contrasenaActual) {
      this.error = 'Debes ingresar tu contraseña actual para guardar cualquier cambio.';
      return false;
    }

    // Validaciones extra si hay cambio de clave
    if (val.nuevaContrasena || val.confirmarNuevaContrasena) {
      if (val.nuevaContrasena === val.contrasenaActual) {
        this.error = 'La nueva contraseña no puede ser igual a la actual.';
        return false;
      }

      const regexPassword = /^(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{6,}$/;

      if (!val.nuevaContrasena) {
        this.error = 'La nueva contraseña es requerida.';
        return false;
      }

      if (!regexPassword.test(val.nuevaContrasena)) {
        this.error = 'La nueva contraseña debe tener mínimo 6 caracteres, una mayúscula, un número y un símbolo.';
        return false;
      }

      if (val.nuevaContrasena !== val.confirmarNuevaContrasena) {
        this.error = 'La confirmación de la nueva contraseña no coincide.';
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
    this.error = '';
    this.mensaje = '';

    const { nombre, nuevaContrasena, contrasenaActual } = this.perfilForm.value;

    try {
      if (!this.usuario?.id) {
        this.error = 'No se encontró la sesión del usuario.';
        return;
      }

      // 1. Siempre verificar contraseña actual por seguridad
      const { error: signInError } = await this.supabaseSvc.iniciarSesion(
        this.correo,
        contrasenaActual
      );

      if (signInError) {
        this.error = 'La contraseña actual no es correcta.';
        this.guardando = false;
        return;
      }

      // 2. Actualizar perfil en la base de datos (Nombre)
      const { error: updateProfileError } = await this.supabaseSvc.actualizarPerfil(
        this.usuario.id,
        { nombre: nombre.trim() }
      );
      if (updateProfileError) throw updateProfileError;

      // 3. Actualizar metadatos de usuario
      const { error: updateAuthError } = await this.supabaseSvc.actualizarDatosAuth({
        data: { full_name: nombre.trim() }
      });
      if (updateAuthError) throw updateAuthError;

      // 4. Actualizar contraseña solo si se solicita
      if (nuevaContrasena) {
        const { error: updatePasswordError } = await this.supabaseSvc.actualizarDatosAuth({
          password: nuevaContrasena
        });
        if (updatePasswordError) throw updatePasswordError;
        this.mensaje = '¡Perfil y contraseña actualizados correctamente!';
      } else {
        this.mensaje = 'Perfil actualizado correctamente.';
      }

      this.nombre = nombre.trim();

      this.perfilForm.patchValue({
        contrasenaActual: '',
        nuevaContrasena: '',
        confirmarNuevaContrasena: ''
      });

      setTimeout(() => this.mensaje = '', 5000);
    } catch (err) {
      console.error('Error actualizando perfil:', err);
      this.error = 'No fue posible actualizar el perfil. Intenta nuevamente.';
    } finally {
      this.guardando = false;
    }
  }

  async cerrarSesion() {
    await this.supabaseSvc.cerrarSesion();
    this.router.navigate(['/ingreso']);
  }

  volver(): void {
    this.router.navigate(['/dashboard-estudiante']);
  }
}
