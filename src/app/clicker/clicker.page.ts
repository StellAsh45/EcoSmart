import { Component, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonIcon } from '@ionic/angular/standalone';
import { Router } from '@angular/router';
import { FondoVisualComponent } from '../components/fondo-visual/fondo-visual.component';
import { EcoSmartLogoComponent } from '../components/eco-smart-logo/eco-smart-logo.component';
import { addIcons } from 'ionicons';
import { leafOutline, leaf, sparklesOutline, arrowBackOutline, flaskOutline, waterOutline, planetOutline, cutOutline, storefrontOutline, closeOutline, thermometerOutline, bonfireOutline, pawOutline, sunnyOutline, timeOutline } from 'ionicons/icons';
import { SupabaseService } from '../services/supabase';

@Component({
  selector: 'app-clicker',
  templateUrl: './clicker.page.html',
  styleUrls: ['./clicker.page.scss'],
  standalone: true,
  imports: [IonContent, CommonModule, FormsModule, IonIcon, FondoVisualComponent, EcoSmartLogoComponent]
})
export class ClickerPage implements OnDestroy {
  mostrarCinematica = false;
  hojas = 0;
  ecoTokens = 0;
  animacionArbolJuego = false;
  usuarioId: string | null = null;
  cargando = true;
  mostrarTienda = false;

  // Hojas cayendo
  hojasAnimadas: any[] = [];
  hojaIdCounter = 0;

  // ==============================================================================
  // CONFIGURACIÓN Y BALANCE DEL JUEGO (Valores base de cada upgrade)
  // ==============================================================================

  // Precios iniciales (Nivel 0)
  readonly PRECIOS_BASE = {
    fertilizante: 50,   // Mejora clic
    regadera: 200,       // Pasivo Nivel 1
    ecosistema: 1000,    // Pasivo Nivel 2
    podaMaestra: 500,    // Probabilidad Crítico
    invernadero: 2500,   // Multiplicador Pasivo
    abono: 3000,          // Potencia Crítico
    santuario: 5000,     // Pasivo Nivel 3
    fotosintesis: 7500   // Sinergia Pasivo -> Clic
  };

  // Crecimiento de costos: 1.5 significa que cada nivel cuesta un 50% más que el anterior
  readonly FACTOR_CRECIMIENTO = 1.5;

  // Valores de los Bonos
  readonly BALANCE = {
    fertilizantePorNivel: 2,   // Hojas extra por clic por cada nivel
    regaderaPasivo: 1,         // Hojas por segundo base por nivel
    ecosistemaPasivo: 5,       // Hojas por segundo base por nivel
    invernaderoBonus: 0.1,     // +10% de producción pasiva extra por nivel
    abonoBonusCritico: 1,      // Aumenta el multiplicador x5 base (+1 por nivel)
    criticoBaseChance: 0.05,   // 5% de probabilidad base de crítico
    criticoChancePorNivel: 0.03, // +3% de probabilidad por cada nivel de Poda Maestra
    santuarioPasivo: 10,       // Hojas por segundo base por nivel
    fotosintesisBonus: 0.05    // Cada nivel añade 5% de tu LPS al valor del clic
  };

  // ==============================================================================
  // ESTADO DEL JUEGO
  // ==============================================================================

  nivelArbol = 1;
  mejoras: any = {
    fertilizante: 0,
    regadera: 0,
    ecosistema: 0,
    podaMaestra: 0,
    invernadero: 0,
    abono: 0,
    santuario: 0,
    fotosintesis: 0
  };

  constructor(
    private router: Router,
    private supabase: SupabaseService
  ) {
    addIcons({
      leafOutline,
      leaf,
      sparklesOutline,
      arrowBackOutline,
      flaskOutline,
      waterOutline,
      planetOutline,
      cutOutline,
      storefrontOutline,
      closeOutline,
      thermometerOutline,
      bonfireOutline,
      pawOutline,
      sunnyOutline,
      timeOutline
    });
  }

  async ionViewWillEnter() {
    this.mostrarCinematica = true;
    this.hojasAnimadas = [];
    this.cargando = true;

    // Obtenemos el usuario actual
    const { data: { user } } = await this.supabase.obtenerUsuario();
    if (user) {
      this.usuarioId = user.id;

      // 1. Carga de EcoTokens
      const { data: profile } = await this.supabase.obtenerPerfil(this.usuarioId);
      if (profile) {
        this.ecoTokens = profile.eco_tokens || 0;
      }

      // 2. Carga de hojas y mejoras del juego
      const { data: clickerData } = await this.supabase.obtenerPertenenciasClicker(this.usuarioId);
      if (clickerData) {
        this.hojas = clickerData.hojas || 0;
        this.nivelArbol = clickerData.nivel_arbol || 1;
        if (clickerData.mejoras) {
          this.mejoras = { ...this.mejoras, ...clickerData.mejoras };
        }

        // Generación pasiva (inactiva)
        if (clickerData.ultima_recoleccion) {
          const ultima = new Date(clickerData.ultima_recoleccion).getTime();
          const ahora = new Date().getTime();
          const segundosTranscurridos = Math.floor((ahora - ultima) / 1000);

          if (segundosTranscurridos > 0) {
            const lps = this.calcularLPS();

            // Calculamos el valor esperado promedio incluyendo críticos
            const chanceCritico = this.BALANCE.criticoBaseChance + (this.mejoras.podaMaestra * this.BALANCE.criticoChancePorNivel);
            const multiCritico = 5 + (this.mejoras.abono * this.BALANCE.abonoBonusCritico);

            // Factor promedio: (1 + chance * (multi - 1))
            const factorPromedio = 1 + (chanceCritico * (multiCritico - 1));
            const hojasGanadas = segundosTranscurridos * lps * factorPromedio;

            if (hojasGanadas > 0) {
              this.hojas = Number((this.hojas + hojasGanadas).toFixed(1));

              // Actualizamos inmediatamente para evitar doble cobro por refresco
              this.supabase.actualizarPertenenciasClicker(this.usuarioId, {
                hojas: this.hojas,
                ultima_recoleccion: new Date().toISOString()
              });
            }
          }
        }
      }
    }

    this.cargando = false;

    // Bucle de generación pasiva mientras el usuario está en la página
    this.iniciarGeneracionPasiva();

    // La animación de apertura dura 1.6s en total
    setTimeout(() => {
      this.mostrarCinematica = false;
    }, 1650);
  }

  clickArbolJuego(event: any) {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }

    // Hojas por click: Base (1) + (Nivel Fertilizante * Bonus) + (Bonus Fotosíntesis * LPS)
    const bonusPasivo = this.calcularLPS() * (this.mejoras.fotosintesis * this.BALANCE.fotosintesisBonus);
    let incremento = 1 + (this.mejoras.fertilizante * this.BALANCE.fertilizantePorNivel) + bonusPasivo;
    let esCritico = false;

    // Lógica de Críticos (Poda Maestra)
    const chanceCritico = this.BALANCE.criticoBaseChance + (this.mejoras.podaMaestra * this.BALANCE.criticoChancePorNivel);
    if (Math.random() < chanceCritico) {
      // Multiplicador base x5 + Bonus por nivel de Abono
      const multiCritico = 5 + (this.mejoras.abono * this.BALANCE.abonoBonusCritico);
      incremento *= multiCritico;
      esCritico = true;
    }

    this.hojas = Number((this.hojas + incremento).toFixed(1));

    // Guardado en base de datos (Throttled: cada 10 clics para no saturar)
    if (this.usuarioId && (Math.floor(this.hojas) % 10 === 0)) {
      this.supabase.actualizarPertenenciasClicker(this.usuarioId, {
        hojas: this.hojas,
        ultima_recoleccion: new Date().toISOString()
      });
    }
    this.animacionArbolJuego = true;
    setTimeout(() => {
      this.animacionArbolJuego = false;
    }, 150);

    // Que las hojas salgan desde el arbol
    const arbolElement = document.querySelector('.contenedor-arbol-juego');
    let xBase = window.innerWidth / 2;
    let yBase = window.innerHeight / 2;

    if (arbolElement) {
      const rect = arbolElement.getBoundingClientRect();
      xBase = rect.left + rect.width / 2;
      yBase = rect.top + rect.height / 3;
    }

    this.generarHojaAnimada(xBase, yBase, incremento, esCritico);
  }

  // Genera una hoja animada 
  generarHojaAnimada(x: number, y: number, valor: number = 1, esCritico: boolean = false) {
    const id = this.hojaIdCounter++;
    this.hojasAnimadas.push({
      id,
      valor,
      esCritico,
      x: x + (Math.random() * 80 - 40),
      y: y + (Math.random() * 40 - 20),
      rotacion: Math.random() * 360,
      duracion: 1.5 + Math.random() * 1,
      escala: 0.7 + Math.random() * 0.8,
      drift: (Math.random() * 100 - 50)
    });

    setTimeout(() => {
      this.hojasAnimadas = this.hojasAnimadas.filter(h => h.id !== id);
    }, 2500);
  }

  toggleTienda() {
    this.mostrarTienda = !this.mostrarTienda;
  }

  // Lógica de Mejoras
  calcularPrecio(tipo: string): number {
    const nivel = this.mejoras[tipo] || 0;
    const base = (this.PRECIOS_BASE as any)[tipo];
    return Math.floor(base * Math.pow(this.FACTOR_CRECIMIENTO, nivel));
  }

  calcularLPS(): number {
    const baseLPS = (this.mejoras.regadera * this.BALANCE.regaderaPasivo) +
      (this.mejoras.ecosistema * this.BALANCE.ecosistemaPasivo) +
      (this.mejoras.santuario * this.BALANCE.santuarioPasivo);

    // Multiplicador Invernadero
    const multiplicador = 1 + (this.mejoras.invernadero * this.BALANCE.invernaderoBonus);
    return Number((baseLPS * multiplicador).toFixed(1));
  }

  async comprarMejora(tipo: string) {
    const precio = this.calcularPrecio(tipo);
    if (this.hojas >= precio && this.usuarioId) {
      this.hojas = Number((this.hojas - precio).toFixed(1));
      this.mejoras[tipo]++;

      // Persistencia inmediata al comprar
      await this.supabase.actualizarPertenenciasClicker(this.usuarioId, {
        hojas: this.hojas,
        mejoras: this.mejoras,
        ultima_recoleccion: new Date().toISOString()
      });
    }
  }

  private passiveInterval: any;
  iniciarGeneracionPasiva() {
    if (this.passiveInterval) clearInterval(this.passiveInterval);

    this.passiveInterval = setInterval(() => {
      let lps = this.calcularLPS();
      if (lps > 0) {
        let esCritico = false;

        // Críticos Pasivos: Misma lógica que los clics
        const chanceCritico = this.BALANCE.criticoBaseChance + (this.mejoras.podaMaestra * this.BALANCE.criticoChancePorNivel);
        if (Math.random() < chanceCritico) {
          const multiCritico = 5 + (this.mejoras.abono * this.BALANCE.abonoBonusCritico);
          lps *= multiCritico;
          esCritico = true;
        }

        this.hojas = Number((this.hojas + lps).toFixed(1));

        // Generación visual pasiva
        const arbolElement = document.querySelector('.contenedor-arbol-juego');
        if (arbolElement) {
          const rect = arbolElement.getBoundingClientRect();
          this.generarHojaAnimada(
            rect.left + rect.width / 2,
            rect.top + rect.height / 3,
            lps,
            esCritico
          );
        }
      }
    }, 1000);
  }

  ngOnDestroy() {
    if (this.passiveInterval) clearInterval(this.passiveInterval);
  }

  salirJuego() {
    // Guardamos estado final antes de salir
    if (this.usuarioId) {
      this.supabase.actualizarPertenenciasClicker(this.usuarioId, {
        hojas: this.hojas,
        mejoras: this.mejoras,
        ultima_recoleccion: new Date().toISOString()
      });
    }
    this.router.navigate(['/dashboard-estudiante']);
  }

  formatearTiempoInactivo(segundos: number): string {
    if (segundos < 60) return `${segundos} segundos`;
    const minutos = Math.floor(segundos / 60);
    if (minutos < 60) return `${minutos} minutos`;
    const horas = Math.floor(minutos / 60);
    const minsRestantes = minutos % 60;
    if (horas < 24) {
      return minsRestantes > 0 ? `${horas}h ${minsRestantes}m` : `${horas} horas`;
    }
    const dias = Math.floor(horas / 24);
    const horasRestantes = horas % 24;
    return horasRestantes > 0 ? `${dias}d ${horasRestantes}h` : `${dias} días`;
  }
}
