import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { IonContent, IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { SupabaseService } from '../services/supabase';
import { mailOutline, lockClosedOutline, personOutline, arrowForwardOutline, syncOutline, eyeOutline, eyeOffOutline } from 'ionicons/icons';
import { CampoEntradaComponent } from '../components/campo-entrada/campo-entrada.component';
import { ContenedorAutenticacionComponent } from '../components/contenedor-autenticacion/contenedor-autenticacion.component';

@Component({
  selector: 'app-registro',
  templateUrl: './registro.page.html',
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
export class RegistroPage implements OnInit {
  formularioRegistro: FormGroup;
  cargando = false;
  registroExitoso = false;
  mostrarContrasena = false;
  errorMensaje = '';

  // Iconos para los campos
  iconos = {
    nombre: personOutline,
    correo: mailOutline,
    contrasena: lockClosedOutline
  };

  constructor(
    private fb: FormBuilder,
    private supabase: SupabaseService,
    private router: Router
  ) {
    addIcons({ mailOutline, lockClosedOutline, personOutline, arrowForwardOutline, syncOutline, eyeOutline, eyeOffOutline });

    this.formularioRegistro = this.fb.group({
      nombre: ['', [Validators.required, Validators.minLength(3)]],
      correo: ['', [Validators.required, Validators.email]],
      contrasena: ['', [
        Validators.required,
        Validators.minLength(6),
        Validators.pattern(/^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{6,}$/)
      ]],
      terminosAceptados: [false, Validators.requiredTrue]
    });
  }

  ngOnInit() { }

  toggleMostrarContrasena() {
    this.mostrarContrasena = !this.mostrarContrasena;
  }

  async manejarRegistro() {
    if (this.formularioRegistro.invalid) {
      if (this.formularioRegistro.get('terminosAceptados')?.errors?.['required']) {
        this.errorMensaje = 'Debes aceptar los términos y condiciones.';
      } else {
        this.errorMensaje = 'Por favor, completa todos los campos correctamente.';
      }
      return;
    }

    try {
      this.cargando = true;
      this.errorMensaje = '';

      const { nombre, correo, contrasena } = this.formularioRegistro.value;
      const { data, error } = await this.supabase.registrarse(correo, contrasena, nombre);

      if (error) {
        if (error.message.includes('already registered') || error.message.includes('User already exists')) {
          this.errorMensaje = 'Este correo electrónico ya está registrado. Por favor, intenta iniciar sesión.';
        } else {
          throw error;
        }
        return;
      }

      // Supabase por seguridad no devuelve error si el correo ya existe,
      // pero devuelve una lista de identidades vacía si el usuario ya está registrado.
      if (data?.user && data.user.identities && data.user.identities.length === 0) {
        this.errorMensaje = 'Este correo electrónico ya está registrado. Por favor, intenta iniciar sesión.';
        return;
      }

      this.registroExitoso = true;
    } catch (err: any) {
      this.errorMensaje = err.message || 'Error al registrar la cuenta.';
    } finally {
      this.cargando = false;
    }
  }
}
