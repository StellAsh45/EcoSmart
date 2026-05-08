import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, ModalController } from '@ionic/angular';
import { Router, NavigationEnd, Event } from '@angular/router';
import { SupabaseService } from '../../services/supabase';
import { BuzonModalComponent } from '../buzon-modal/buzon-modal.component';
import { Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';
import { addIcons } from 'ionicons';
import { mailUnreadOutline, mailOpenOutline } from 'ionicons/icons';

@Component({
  selector: 'app-buzon-boton',
  templateUrl: './buzon-boton.component.html',
  standalone: true,
  imports: [CommonModule, IonicModule]
})
export class BuzonBotonComponent implements OnInit, OnDestroy {
  mensajesNoLeidos: number = 0;
  private routerSub: Subscription | undefined;
  private pollInterval: any;

  constructor(
    private supabaseSvc: SupabaseService,
    private modalCtrl: ModalController,
    private router: Router
  ) {
    addIcons({
      'mail-unread-outline': mailUnreadOutline,
      'mail-open-outline': mailOpenOutline
    });
  }

  ngOnInit() {
    this.verificarMensajes();

    // Actualizar al navegar
    this.routerSub = this.router.events.pipe(
      filter((event: Event): event is NavigationEnd => event instanceof NavigationEnd)
    ).subscribe(() => {
      this.verificarMensajes();
    });

    // Polling cada minuto
    this.pollInterval = setInterval(() => {
      this.verificarMensajes();
    }, 60000);
  }

  ngOnDestroy() {
    if (this.routerSub) this.routerSub.unsubscribe();
    if (this.pollInterval) clearInterval(this.pollInterval);
  }

  async verificarMensajes() {
    try {
      const { data: { user } } = await this.supabaseSvc.obtenerUsuario();
      if (!user) return;

      const { data, error } = await this.supabaseSvc.obtenerMensajesNoLeidosUsuario(user.id);
      if (!error && data) {
        this.mensajesNoLeidos = data.length;
      }
    } catch (e) {
      console.error('Error al verificar buzón:', e);
    }
  }

  async abrirBuzon() {
    const modal = await this.modalCtrl.create({
      component: BuzonModalComponent,
      cssClass: 'soporte-modal'
    });

    await modal.present();
    await modal.onDidDismiss();
    
    // Al cerrar el buzón, volvemos a verificar porque los mensajes se marcaron como leídos
    this.verificarMensajes();
  }
}
