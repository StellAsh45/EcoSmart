import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonContent, IonIcon } from '@ionic/angular/standalone';
import { Router, RouterLink } from '@angular/router';
import { SupabaseService } from '../services/supabase';
import { FondoVisualComponent } from '../components/fondo-visual/fondo-visual.component';
import { EcoSmartLogoComponent } from '../components/eco-smart-logo/eco-smart-logo.component';
import { addIcons } from 'ionicons';
import { 
  atOutline, 
  personOutline, 
  logOutOutline, 
  arrowForwardOutline, 
  bookOutline, 
  ribbonOutline, 
  timeOutline,
  playCircleOutline
} from 'ionicons/icons';

@Component({
  selector: 'app-dashboard-estudiante',
  templateUrl: './dashboard-estudiante.page.html',
  styleUrls: ['./dashboard-estudiante.page.scss'],
  standalone: true,
  imports: [CommonModule,IonContent,IonIcon,RouterLink,FondoVisualComponent,EcoSmartLogoComponent]
})
export class DashboardEstudiantePage implements OnInit {
usuario: any = null;
  nombreUsuario: string = 'Estudiante';

  constructor(
    private supabaseSvc: SupabaseService,
    private router: Router
  ) {
    addIcons({
      'at-outline': atOutline,
      'person-outline': personOutline,
      'log-out-outline': logOutOutline,
      'arrow-forward-outline': arrowForwardOutline,
      'book-outline': bookOutline,
      'ribbon-outline': ribbonOutline,
      'time-outline': timeOutline,
      'play-circle-outline': playCircleOutline
    });
  }

  async ngOnInit() {
    try {
      const { data, error } = await this.supabaseSvc.obtenerUsuario();
      if (error) throw error;
      this.usuario = data?.user;
      if (this.usuario) {
        this.nombreUsuario = this.usuario.user_metadata?.['full_name'] || this.usuario.email?.split('@')[0] || 'Estudiante';
      }
    } catch (err) {
      console.error('Error dashboard:', err);
    }
  }

  async cerrarSesion() {
    await this.supabaseSvc.cerrarSesion();
    this.router.navigate(['/ingreso']);
  }
}
