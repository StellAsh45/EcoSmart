import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { IonContent, IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { SupabaseService } from '../services/supabase';
import { mailOutline, lockClosedOutline, personOutline, arrowForwardOutline, syncOutline } from 'ionicons/icons';
import { FondoVisualComponent } from '../components/fondo-visual/fondo-visual.component';
import { EcoSmartLogoComponent } from '../components/eco-smart-logo/eco-smart-logo.component';

@Component({
  selector: 'app-registro',
  templateUrl: './registro.page.html',
  styleUrls: ['./registro.page.scss'],
  standalone: true,
  imports: [IonContent, IonIcon, CommonModule, ReactiveFormsModule, FondoVisualComponent, EcoSmartLogoComponent]
})
export class RegistroPage implements OnInit {
  registerForm: FormGroup;
  loading = false;
  registrationSuccess = false;
  error = '';

  constructor(
    private fb: FormBuilder,
    private supabase: SupabaseService,
    private router: Router
  ) {
    addIcons({ mailOutline, lockClosedOutline, personOutline, arrowForwardOutline, syncOutline });
    
    this.registerForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      acceptedTerms: [false, Validators.requiredTrue]
    });
  }

  ngOnInit() {}

  async handleRegister() {
    if (this.registerForm.invalid) {
      if (this.registerForm.get('acceptedTerms')?.errors?.['required']) {
        this.error = 'Debes aceptar los términos y condiciones.';
      } else {
        this.error = 'Por favor, completa todos los campos correctamente.';
      }
      return;
    }

    try {
      this.loading = true;
      this.error = '';

      const { name, email, password } = this.registerForm.value;
      const { error } = await this.supabase.signUp(email, password, name);

      if (error) throw error;

      this.registrationSuccess = true;
    } catch (err: any) {
      this.error = err.message || 'Error al registrar la cuenta.';
    } finally {
      this.loading = false;
    }
  }
}
