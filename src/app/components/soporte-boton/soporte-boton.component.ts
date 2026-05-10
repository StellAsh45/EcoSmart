import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, ModalController, ToastController } from '@ionic/angular';
import { Router, NavigationEnd, Event } from '@angular/router';
import { SupabaseService } from '../../services/supabase';
import { SoporteModalComponent } from '../soporte-modal/soporte-modal.component';
import { Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';
import { addIcons } from 'ionicons';
import { chatbubblesOutline, alertCircleOutline } from 'ionicons/icons';

@Component({
  selector: 'app-soporte-boton',
  templateUrl: './soporte-boton.component.html',
  standalone: true,
  imports: [CommonModule, IonicModule]
})
export class SoporteBotonComponent implements OnInit, OnDestroy {
  mostrarBoton = false;
  private routerSub: Subscription | undefined;
  
  // Rutas donde no queremos mostrar el botón
  private rutasExcluidas = [
    '/ingreso',
    '/registro',
    '/restablecer-contrasena',
    '/recuperacion',
    '/dashboard-admin',
    '/constructor-curso'
  ];

  constructor(
    private router: Router,
    private supabaseSvc: SupabaseService,
    private modalCtrl: ModalController,
    private toastCtrl: ToastController
  ) {
    addIcons({
      'chatbubbles-outline': chatbubblesOutline,
      'alert-circle-outline': alertCircleOutline
    });
  }

  ngOnInit() {
    // Verificar estado inicial
    this.verificarVisibilidad(this.router.url);

    // Suscribirse a cambios de ruta
    this.routerSub = this.router.events.pipe(
      filter((event: Event): event is NavigationEnd => event instanceof NavigationEnd)
    ).subscribe((event: NavigationEnd) => {
      this.verificarVisibilidad(event.urlAfterRedirects);
    });
  }

  ngOnDestroy() {
    if (this.routerSub) {
      this.routerSub.unsubscribe();
    }
  }

  async verificarVisibilidad(url: string) {
    // 1. Ocultar si está en ruta excluida
    const estaEnRutaExcluida = this.rutasExcluidas.some(ruta => url.includes(ruta));
    if (estaEnRutaExcluida) {
      this.mostrarBoton = false;
      return;
    }

    // 2. Verificar usuario autenticado y rol
    try {
      const { data: { user } } = await this.supabaseSvc.obtenerUsuario();
      if (!user) {
        this.mostrarBoton = false;
        return;
      }

      const { data: perfil } = await this.supabaseSvc.obtenerPerfil(user.id);
      
      // Mostrar solo si no es admin
      this.mostrarBoton = perfil?.rol !== 'admin';
    } catch (error) {
      this.mostrarBoton = false;
    }
  }

  async abrirSoporte() {
    try {
      const { data: { user } } = await this.supabaseSvc.obtenerUsuario();
      if (!user) return;

      // Verificar solicitudes activas
      const { data: activas, error } = await this.supabaseSvc.obtenerSolicitudesActivasUsuario(user.id);
      
      if (error) throw error;

      if (activas && activas.length >= 2) {
        // Mostrar alerta de límite alcanzado
        const toast = await this.toastCtrl.create({
          message: 'Tienes 2 solicitudes activas. Por favor, espera a que sean respondidas antes de enviar otra.',
          duration: 4000,
          color: 'warning',
          icon: 'alert-circle-outline',
          position: 'top'
        });
        await toast.present();
        return;
      }

      // Si tiene menos de 2, abrir modal
      const modal = await this.modalCtrl.create({
        component: SoporteModalComponent,
        componentProps: {
          email: user.email,
          userId: user.id
        },
        cssClass: 'soporte-modal'
      });

      await modal.present();
    } catch (error) {
      console.error('Error al abrir soporte:', error);
      const toast = await this.toastCtrl.create({
        message: 'Hubo un error al verificar tu estado. Intenta de nuevo.',
        duration: 3000,
        color: 'danger',
        position: 'top'
      });
      await toast.present();
    }
  }
}
