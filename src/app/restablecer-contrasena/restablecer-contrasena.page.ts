import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { IonContent, IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { SupabaseService } from '../services/supabase';
import { lockClosedOutline, arrowForwardOutline, syncOutline, lockOpenOutline } from 'ionicons/icons';
import { CampoEntradaComponent } from '../components/campo-entrada/campo-entrada.component';
import { ContenedorAutenticacionComponent } from '../components/contenedor-autenticacion/contenedor-autenticacion.component';

@Component({
  selector: 'app-restablecer-contrasena',
  templateUrl: './restablecer-contrasena.page.html',
  standalone: true,
  imports: [
    IonContent,
    IonIcon,
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    CampoEntradaComponent,
    ContenedorAutenticacionComponent
  ]
})
export class RestablecerContrasenaPage implements OnInit {
  formularioReset: FormGroup;
  cargando = false;
  exito = false;
  errorMensaje = '';

  iconos = {
    contrasena: lockClosedOutline
  };

  constructor(
    private fb: FormBuilder,
    private supabase: SupabaseService,
    private router: Router
  ) {
    addIcons({ lockClosedOutline, arrowForwardOutline, syncOutline, lockOpenOutline });

    this.formularioReset = this.fb.group({
      contrasena: ['', [
        Validators.required,
        Validators.minLength(6),
        Validators.pattern(/^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{6,}$/)
      ]],
      confirmarContrasena: ['', [Validators.required]]
    }, {
      validators: this.validarSemejanza
    });
  }

  ngOnInit() { }

  validarSemejanza(group: FormGroup) {
    const pass = group.get('contrasena')?.value;
    const confirmPass = group.get('confirmarContrasena')?.value;
    return pass === confirmPass ? null : { noCoincide: true };
  }

  async actualizarPassword() {
    if (this.formularioReset.invalid) {
      if (this.formularioReset.hasError('noCoincide')) {
        this.errorMensaje = 'Las contraseñas no coinciden.';
      } else {
        this.errorMensaje = 'Por favor, cumple con los requisitos de seguridad.';
      }
      return;
    }

    try {
      this.cargando = true;
      this.errorMensaje = '';

      const { contrasena } = this.formularioReset.value;

      // Verificar si el usuario está activo
      const { data: { user } } = await this.supabase.obtenerUsuario();
      if (user) {
        const { data: profile } = await this.supabase.obtenerPerfil(user.id);
        if (profile && !profile.activo) {
          this.errorMensaje = 'Tu cuenta está inactiva. No puedes restablecer la contraseña.';
          return;
        }
      }

      const { data, error } = await this.supabase.actualizarDatosAuth({ password: contrasena });

      if (error) throw error;

      this.exito = true;
    } catch (err: any) {
      this.errorMensaje = this.traducirError(err.message);
    } finally {
      this.cargando = false;
    }
  }

  private traducirError(mensaje: string): string {
    if (!mensaje) return 'Error al actualizar la contraseña.';
    const msg = mensaje.toLowerCase();

    if (msg.includes('new password should be different') || msg.includes('same password') || msg.includes('different from the old'))
      return 'La nueva contraseña debe ser diferente a la contraseña actual.';
    if (msg.includes('password should be at least'))
      return 'La contraseña debe tener al menos 6 caracteres.';
    if (msg.includes('auth session missing') || msg.includes('session'))
      return 'Tu sesión ha expirado. Por favor, solicita un nuevo enlace de recuperación.';
    if (msg.includes('network') || msg.includes('fetch'))
      return 'Error de conexión. Verifica tu internet e intenta de nuevo.';

    return 'Error al actualizar la contraseña. Por favor, intenta de nuevo.';
  }
}
