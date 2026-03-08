import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { IonContent, IonIcon } from '@ionic/angular/standalone';
import { Router, RouterLink } from '@angular/router';
import { addIcons } from 'ionicons';
import { mailOutline, lockClosedOutline, arrowForwardOutline, logoGoogle, syncOutline } from 'ionicons/icons';

import { SupabaseService } from '../services/supabase';
import { ContenedorAutenticacionComponent } from '../components/contenedor-autenticacion/contenedor-autenticacion.component';
import { CampoEntradaComponent } from '../components/campo-entrada/campo-entrada.component';

@Component({
  selector: 'app-ingreso',
  templateUrl: './ingreso.page.html',
  styleUrls: ['./ingreso.page.scss'],
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
export class IngresoPage implements OnInit {
  formularioIngreso: FormGroup;
  cargando = false;
  errorMensaje = '';

  iconos = {
    correo: 'mail-outline',
    contrasena: 'lock-closed-outline'
  };

  constructor(
    private fb: FormBuilder,
    private supabaseSvc: SupabaseService,
    private router: Router
  ) {
    this.formularioIngreso = this.fb.group({
      correo: ['', [Validators.required, Validators.email]],
      contrasena: ['', [Validators.required, Validators.minLength(6)]]
    });

    addIcons({
      'mail-outline': mailOutline,
      'lock-closed-outline': lockClosedOutline,
      'arrow-forward-outline': arrowForwardOutline,
      'logo-google': logoGoogle,
      'sync-outline': syncOutline
    });
  }

  ngOnInit() { }

  async manejarIngreso() {
    if (this.formularioIngreso.invalid) {
      this.formularioIngreso.markAllAsTouched();
      return;
    }

    this.cargando = true;
    this.errorMensaje = '';

    try {
      const { correo, contrasena } = this.formularioIngreso.value;
      const { data, error } = await this.supabaseSvc.iniciarSesion(correo, contrasena);

      if (error) throw error;

      // Redirigir al dashboard
      this.router.navigate(['/dashboard-estudiante']);
    } catch (error: any) {
      console.error('Error en el ingreso:', error);
      this.errorMensaje = error.message === 'Invalid login credentials'
        ? 'Correo o contraseña incorrectos.'
        : 'Ocurrió un error al intentar iniciar sesión.';
    } finally {
      this.cargando = false;
    }
  }
}
