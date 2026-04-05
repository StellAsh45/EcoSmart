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

      // 1. Verificar si el correo está registrado antes de enviar nada
      const { existe } = await this.supabase.verificarCorreoRegistrado(correo);
      if (!existe) {
        this.errorMensaje = 'No encontramos una cuenta asociada a ese correo electrónico.';
        return;
      }

      // 2. Si existe, enviar el correo de recuperación
      const { error } = await this.supabase.recuperarContrase(correo);
      if (error) throw error;

      this.enviado = true;
    } catch (err: any) {
      console.error('Error al enviar enlace:', err);
      this.errorMensaje = 'No se pudo enviar el correo. Por favor, intenta de nuevo.';
    } finally {
      this.cargando = false;
    }
  }
}
