import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { IonContent, IonIcon } from '@ionic/angular/standalone';
import { Router, RouterLink } from '@angular/router';
import { addIcons } from 'ionicons';
import { mailOutline, arrowForwardOutline, syncOutline } from 'ionicons/icons';

import { SupabaseService } from '../services/supabase';
import { ContenedorAutenticacionComponent } from '../components/contenedor-autenticacion/contenedor-autenticacion.component';
import { CampoEntradaComponent } from '../components/campo-entrada/campo-entrada.component';

@Component({
  selector: 'app-recuperacion',
  templateUrl: './recuperacion.page.html',
  standalone: true,
  imports: [
    IonContent,
    IonIcon,
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    ContenedorAutenticacionComponent,
    CampoEntradaComponent
  ]
})
export class RecuperacionPage implements OnInit {
  formularioRecuperacion: FormGroup;
  cargando = false;
  enviado = false;
  errorMensaje = '';

  iconos = {
    correo: mailOutline
  };

  constructor(
    private fb: FormBuilder,
    private supabase: SupabaseService,
    private router: Router
  ) {
    addIcons({ mailOutline, arrowForwardOutline, syncOutline });

    this.formularioRecuperacion = this.fb.group({
      correo: ['', [Validators.required, Validators.email]]
    });
  }

  ngOnInit() { }

  async enviarEnlace() {
    if (this.formularioRecuperacion.invalid) {
      this.errorMensaje = 'Por favor, introduce un correo electrónico válido.';
      return;
    }

    try {
      this.cargando = true;
      this.errorMensaje = '';

      const correo = this.formularioRecuperacion.get('correo')?.value;

      // 1. Verificar Rate Limit (Max 2 por hora)
      const { permitido, minutosRestantes } = this.supabase.verificarLimiteReseteo(correo);
      if (!permitido) {
        this.errorMensaje = `Has excedido el máximo de 2 reseteos por hora. Debes esperar ${minutosRestantes} minutos para volver a solicitar un enlace.`;
        return;
      }

      // 2. Verificar si el correo está registrado y si la cuenta está activa
      const { existe, activo } = await this.supabase.verificarCorreoRegistrado(correo);
      if (!existe) {
        this.errorMensaje = 'No encontramos una cuenta asociada a ese correo electrónico.';
        return;
      }

      if (!activo) {
        this.errorMensaje = 'Tu cuenta ha sido desactivada. Por favor, contacta con el administrador.';
        return;
      }

      // 3. Si existe, enviar el correo de recuperación
      const { error } = await this.supabase.recuperarContrase(correo);
      if (error) throw error;

      // 4. Registrar el intento exitoso
      this.supabase.registrarIntentoReseteo(correo);
      this.enviado = true;
    } catch (err: any) {
      console.error('Error al enviar enlace:', err);
      this.errorMensaje = 'No se pudo enviar el correo. Por favor, intenta de nuevo.';
    } finally {
      this.cargando = false;
    }
  }
}
