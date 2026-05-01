import { Component, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonIcon } from '@ionic/angular/standalone';
import { Router } from '@angular/router';
import { FondoVisualComponent } from '../components/fondo-visual/fondo-visual.component';
import { EcoSmartLogoComponent } from '../components/eco-smart-logo/eco-smart-logo.component';
import { addIcons } from 'ionicons';
import { leafOutline, leaf, sparklesOutline, arrowBackOutline, flaskOutline, waterOutline, planetOutline, cutOutline, storefrontOutline, storefront, closeOutline, thermometerOutline, bonfireOutline, pawOutline, sunnyOutline, timeOutline, statsChartOutline, statsChart, handRightOutline, infiniteOutline, mapOutline, hammerOutline, gitBranchOutline } from 'ionicons/icons';
import { SupabaseService } from '../services/supabase';

import { TarjetaMejoraComponent } from '../components/tarjeta-mejora/tarjeta-mejora.component';

@Component({
  selector: 'app-clicker',
  templateUrl: './clicker.page.html',
  styleUrls: ['./clicker.page.scss'],
  standalone: true,
  imports: [IonContent, CommonModule, FormsModule, IonIcon, FondoVisualComponent, EcoSmartLogoComponent, TarjetaMejoraComponent]
})
export class ClickerPage implements OnDestroy {
  vistaActual: 'juego' | 'tienda' | 'estadisticas' = 'juego';
  mostrarCinematica = false;
  hojas = 0;
  ecoTokens = 0;
  animacionArbolJuego = false;
  usuarioId: string | null = null;
  cargando = true;
  private ultimoClick = 0;
  private ultimoClickSync = 0;
  private readonly COOLDOWN_CLICK = 50; // Límite de balance: 20 clics/seg max
  private readonly UMBRAL_SYNC = 5000;   // Estabilidad: Guardar cada 5 segundos

  private audioCtx: AudioContext | null = null;
  private audioHojas: HTMLAudioElement | null = null;

  // Hojas cayendo
  hojasAnimadas: any[] = [];
  hojaIdCounter = 0;

  // ==============================================================================
  // CONFIGURACIÓN Y BALANCE DEL JUEGO (Valores base de cada upgrade)
  // ==============================================================================

  readonly PRECIOS_BASE = {
    fertilizante: 30,   // Mejora clic
    regadera: 150,       // Pasivo Nivel 1
    ecosistema: 2000,    // Pasivo Nivel 2
    podaMaestra: 500,    // Probabilidad Crítico
    invernadero: 2500,   // Multiplicador Pasivo
    abono: 3000,          // Potencia Crítico
    santuario: 6000,     // Pasivo Nivel 3
    guantes: 1500,       // Multiplicador Clic Nivel 1
    superCrit: 5000,     // Probabilidad Supercrítica
    potenciadorSuperCrit: 15000, // Potencia Supercrítica
    reservaNatural: 35000, // Pasivo Nivel 4
    fotosintesis: 7500,   // Sinergia Pasivo -> Clic
    herramientasTitanio: 1200, // Mejora clic
    ecoPulso: 10000        // Sinergia Clic -> Pasivo
  };

  // Crecimiento de costos: 1.4 significa que cada nivel cuesta un 30% más que el anterior
  readonly FACTOR_CRECIMIENTO = 1.4;

  // Valores de los Bonos
  readonly BALANCE = {
    fertilizantePorNivel: 3,   // Hojas extra por clic por cada nivel
    regaderaPasivo: 5,         // Hojas por segundo base por nivel
    ecosistemaPasivo: 20,      // Hojas por segundo base por nivel
    invernaderoBonus: 0.10,    // +10% de producción pasiva extra por nivel
    abonoBonusCritico: 0.2,     // Aumenta el multiplicador
    criticoBaseChance: 0.01,   // 1% de probabilidad base de crítico
    criticoChancePorNivel: 0.01, // +1% de probabilidad por cada nivel de Poda Maestra
    santuarioPasivo: 50,       // Hojas por segundo base por nivel 
    guantesBonus: 0.05,        // +5% multiplicador de clic por nivel 
    superCritChance: 0.001,    // +0.1% prob. Supercrítica por nivel
    superCritMulti: 0.05,      // +0.05x potencia Supercrítica por nivel
    reservaNaturalPasivo: 200,  // +200 Hojas/seg por nivel
    fotosintesisBonus: 0.05,    // Cada nivel añade 5% de Hojas/s al valor del clic
    herramientasTitanioBonus: 20, // +20 Hojas extra por clic por nivel
    ecoPulsoBonus: 0.02        // Cada nivel añade 2% del poder de toque al LPS
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
    guantes: 0,
    superCrit: 0,
    potenciadorSuperCrit: 0,
    reservaNatural: 0,
    fotosintesis: 0,
    herramientasTitanio: 0,
    ecoPulso: 0
  };

  // Configuración de la Tienda para el *ngFor
  listaMejorasToque = [
    { id: 'fertilizante', nombre: 'Fertilizante', desc: 'Hojas extra por cada toque manual.', icono: 'flask-outline', color: '#10b981' },
    { id: 'podaMaestra', nombre: 'Poda maestra', desc: 'Aumenta la probabilidad de realizar críticos.', icono: 'cut-outline', color: '#eab308' },
    { id: 'herramientasTitanio', nombre: 'Herramientas de titanio', desc: 'Potencia cada toque.', icono: 'hammer-outline', color: '#94a3b8' },
    { id: 'guantes', nombre: 'Guantes', desc: 'Multiplicador directo al poder de toque.', icono: 'hand-right-outline', color: '#6366f1' },
    { id: 'abono', nombre: 'Nutrientes', desc: 'Aumenta el multiplicador de críticos.', icono: 'bonfire-outline', color: '#ef4444' },
    { id: 'superCrit', nombre: 'Esencia estelar', desc: 'Probabilidad de realizar supercríticos.', icono: 'sparkles-outline', color: '#c084fc' },
    { id: 'fotosintesis', nombre: 'Fotosíntesis', desc: 'Las H/S potencian cada toque.', icono: 'sunny-outline', color: '#fde047' },
    { id: 'potenciadorSuperCrit', nombre: 'Abono galáctico', desc: 'Aumenta la potencia de los supercríticos.', icono: 'infinite-outline', color: '#22d3ee' }
  ];

  listaMejorasPasivo = [
    { id: 'regadera', nombre: 'Regadera', desc: 'Genera hojas automáticamente.', icono: 'water-outline', color: '#3b82f6' },
    { id: 'ecosistema', nombre: 'Ecosistema', desc: 'Mejora la producción natural base de hojas.', icono: 'planet-outline', color: '#10b981' },
    { id: 'invernadero', nombre: 'Invernadero', desc: 'Bono multiplicador a toda tu producción de hojas.', icono: 'thermometer-outline', color: '#f97316' },
    { id: 'santuario', nombre: 'Santuario', desc: 'Animales recolectores de alta eficiencia.', icono: 'paw-outline', color: '#ec4899' },
    { id: 'ecoPulso', nombre: 'Eco-Pulso', desc: 'Cada toque envía un impulso que acelera la producción pasiva.', icono: 'git-branch-outline', color: '#a855f7' },
    { id: 'reservaNatural', nombre: 'Reserva natural', desc: 'Zona de conservación masiva, produce aún mas hojas.', icono: 'map-outline', color: '#059669' }
  ];

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
      storefront,
      closeOutline,
      thermometerOutline,
      bonfireOutline,
      pawOutline,
      sunnyOutline,
      timeOutline,
      statsChartOutline,
      statsChart,
      handRightOutline,
      infiniteOutline,
      mapOutline,
      hammerOutline,
      gitBranchOutline
    });

    // Pre-cargar sonido de hojas real (Usamos una URL más estable)
    this.audioHojas = new Audio('https://www.soundjay.com/nature/sounds/dry-leaves-rustling-01.mp3');
    this.audioHojas.volume = 0.3;

    // Si hay error de carga, nos aseguramos de usar el fallback
    this.audioHojas.onerror = () => {
      this.audioHojas = null;
    };

    this.audioHojas.load();

    // Listener para detectar cuando el usuario sale o vuelve a la app sin cerrar la vista
    document.addEventListener('visibilitychange', this.handleVisibilityChange);
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

      // 2. Carga y verificación de inactividad
      await this.cargarYVerificarInactividad();
    }

    this.cargando = false;

    // Bucle de generación pasiva mientras el usuario está en la página
    this.iniciarGeneracionPasiva();

    // La animación de apertura dura aproximadamente 0.6s
    setTimeout(() => {
      this.mostrarCinematica = false;

      // Si ganamos algo offline, mostramos el aviso después de la cinemática
      if (this.hojasGanadasOffline > 0) {
        setTimeout(() => {
          this.mostrarAvisoOffline = true;
        }, 300);
      }
    }, 600);
  }

  // Lógica para manejar cambios de visibilidad (segundo plano / primer plano)
  private handleVisibilityChange = async () => {
    if (document.visibilityState === 'hidden') {
      // Al ocultar la app, sincronizamos para tener un punto de referencia exacto
      await this.sincronizarHojas();
    } else if (document.visibilityState === 'visible') {
      // Al volver, esperamos un momento y verificamos cuánto tiempo pasó
      setTimeout(async () => {
        await this.cargarYVerificarInactividad();

        // Si no estamos en medio de la cinemática inicial y hubo ganancias, mostramos el aviso
        if (!this.mostrarCinematica && this.hojasGanadasOffline > 0) {
          this.mostrarAvisoOffline = true;
        }
      }, 300);
    }
  };

  async sincronizarHojas() {
    if (this.usuarioId) {
      await this.supabase.actualizarPertenenciasClicker(this.usuarioId, {
        hojas: Math.floor(this.hojas),
        ultima_recoleccion: new Date().toISOString()
      });
    }
  }

  async cargarYVerificarInactividad() {
    if (!this.usuarioId) return;

    const { data: clickerData } = await this.supabase.obtenerPertenenciasClicker(this.usuarioId);
    if (clickerData) {
      this.hojas = clickerData.hojas || 0;
      this.nivelArbol = clickerData.nivel_arbol || 1;
      if (clickerData.mejoras) {
        this.mejoras = { ...this.mejoras, ...clickerData.mejoras };
      }

      await this.procesarGananciasOffline(clickerData);
    }
  }

  private async procesarGananciasOffline(clickerData: any) {
    if (clickerData.ultima_recoleccion) {
      const ultima = new Date(clickerData.ultima_recoleccion).getTime();
      const ahora = new Date().getTime();
      const segundosTranscurridos = Math.floor((ahora - ultima) / 1000);

      if (segundosTranscurridos > 5) { // Umbral de 5 segundos para considerar inactividad
        const lps = this.calcularLPS();
        if (lps <= 0) return;

        const chanceNormal = this.BALANCE.criticoBaseChance + (this.mejoras.podaMaestra * this.BALANCE.criticoChancePorNivel);
        const chanceSuper = this.mejoras.superCrit * this.BALANCE.superCritChance;

        const multiNormal = 2 + (this.mejoras.abono * this.BALANCE.abonoBonusCritico);
        const multiSuper = 2 + (this.mejoras.potenciadorSuperCrit * this.BALANCE.superCritMulti);

        const factorPromedio = 1 + (chanceNormal * (multiNormal - 1)) + (chanceSuper * multiNormal * (multiSuper - 1));
        const hojasGanadas = segundosTranscurridos * lps * factorPromedio;

        if (hojasGanadas > 0) {
          const ganadasFinal = Math.floor(hojasGanadas);
          this.hojasGanadasOffline = ganadasFinal;
          this.segundosOffline = segundosTranscurridos;
          this.hojas = Math.floor(this.hojas + ganadasFinal);

          // Guardamos inmediatamente el nuevo estado
          await this.supabase.actualizarPertenenciasClicker(this.usuarioId!, {
            hojas: this.hojas,
            ultima_recoleccion: new Date().toISOString()
          });
        } else {
          this.hojasGanadasOffline = 0;
        }
      } else {
        this.hojasGanadasOffline = 0;
      }
    }
  }

  hojasGanadasOffline: number = 0;
  segundosOffline: number = 0;
  mostrarAvisoOffline: boolean = false;

  cerrarAvisoOffline() {
    this.mostrarAvisoOffline = false;
  }

  formatearTiempo(segundos: number): string {
    if (segundos < 60) return `${segundos}s`;

    const h = Math.floor(segundos / 3600);
    const m = Math.floor((segundos % 3600) / 60);
    const s = segundos % 60;

    if (h > 0) return `${h}h ${m}m ${s}s`;
    return `${m}m ${s}s`;
  }

  recolectarHojas(event: any) {
    if (this.mostrarCinematica) return;
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    const ahora = Date.now();

    // 1. BALANCE: Cooldown estricto para evitar romper la economía del juego
    if (ahora - this.ultimoClick < this.COOLDOWN_CLICK) return;
    this.ultimoClick = ahora;

    this.reproducirSonidoHojas();

    let incremento = this.obtenerValorToqueReal();
    let esCritico = false;
    let esSuperCritico = false;

    // Lógica de Críticos y Supercríticos
    const chanceSuper = this.mejoras.superCrit * this.BALANCE.superCritChance;
    const chanceNormal = this.BALANCE.criticoBaseChance + (this.mejoras.podaMaestra * this.BALANCE.criticoChancePorNivel);

    const rand = Math.random();

    const multiNormal = 2 + (this.mejoras.abono * this.BALANCE.abonoBonusCritico);
    const multiSuper = 2 + (this.mejoras.potenciadorSuperCrit * this.BALANCE.superCritMulti);

    if (rand < chanceSuper) {
      incremento *= (multiNormal * multiSuper);
      esSuperCritico = true;
      esCritico = true;
    } else if (rand < chanceNormal) {
      incremento *= multiNormal;
      esCritico = true;
    }

    const incrementoFinal = Math.floor(incremento);
    this.hojas += incrementoFinal;

    // Lógica especial de Abono de Meteorito: Estallido de Nutrientes
    if (this.mejoras.abonoMeteorito > 0) {
      const chanceBurst = 0.05; // 5% de probabilidad
      if (Math.random() < chanceBurst) {
        const lps = this.calcularLPS();
        const burstValue = lps * 15 * this.mejoras.abonoMeteorito; // 15s de prod por nivel
        if (burstValue > 0) {
          this.hojas += burstValue;
          this.generarHojaAnimada(window.innerWidth / 2, window.innerHeight / 2, burstValue, true);
        }
      }
    }

    // 2. ESTABILIDAD: Guardado Throttled (Evita saturar Supabase con autoclickers)
    if (this.usuarioId && (ahora - this.ultimoClickSync > this.UMBRAL_SYNC)) {
      this.ultimoClickSync = ahora;
      this.supabase.actualizarPertenenciasClicker(this.usuarioId, {
        hojas: Math.floor(this.hojas),
        ultima_recoleccion: new Date().toISOString()
      });
    }

    // 3. RENDIMIENTO: Feedback visual con límite de partículas
    this.animacionArbolJuego = true;
    setTimeout(() => { this.animacionArbolJuego = false; }, 100);

    if (this.hojasAnimadas.length < 30) { // Máximo 30 hojas simultáneas
      const arbolElement = document.querySelector('.contenedor-arbol-juego');
      let xBase = window.innerWidth / 2;
      let yBase = window.innerHeight / 2;

      if (arbolElement) {
        const rect = arbolElement.getBoundingClientRect();
        xBase = rect.left + rect.width / 2;
        yBase = rect.top + rect.height / 3;
      }
      this.generarHojaAnimada(xBase, yBase, incrementoFinal, esCritico, esSuperCritico);
    }
  }

  // Genera una hoja animada 
  generarHojaAnimada(x: number, y: number, valor: number = 1, esCritico: boolean = false, esSuperCritico: boolean = false) {
    const id = this.hojaIdCounter++;
    this.hojasAnimadas.push({
      id,
      valor: this.formatearNumero(Math.floor(valor)),
      esCritico,
      esSuperCritico,
      x: x + (Math.random() * 80 - 40),
      y: y + (Math.random() * 40 - 20),
      rotacion: Math.random() * 360,
      duracion: 1.5 + Math.random() * 1,
      escala: (esSuperCritico ? 1.5 : 1) * (0.7 + Math.random() * 0.8),
      drift: (Math.random() * 100 - 50)
    });

    setTimeout(() => {
      this.hojasAnimadas = this.hojasAnimadas.filter(h => h.id !== id);
    }, 2500);
  }

  reproducirSonidoHojas() {
    // Intentamos reproducir el sonido real pre-cargado
    if (this.audioHojas) {
      this.audioHojas.currentTime = 0;
      this.audioHojas.play().catch(() => {
        // Si falla por políticas de autoplay o red, usamos el sintetizador como fallback
        this.sintetizarSonidoHojas();
      });
    } else {
      this.sintetizarSonidoHojas();
    }
  }

  sintetizarSonidoHojas() {
    try {
      if (!this.audioCtx) {
        this.audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      if (this.audioCtx.state === 'suspended') this.audioCtx.resume();
      const now = this.audioCtx.currentTime;
      const duration = 0.4;
      const noiseBuffer = this.audioCtx.createBuffer(1, this.audioCtx.sampleRate * duration, this.audioCtx.sampleRate);
      const noiseData = noiseBuffer.getChannelData(0);
      for (let i = 0; i < noiseData.length; i++) noiseData[i] = Math.random() * 2 - 1;
      const source = this.audioCtx.createBufferSource();
      source.buffer = noiseBuffer;
      const filter = this.audioCtx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(3000, now);
      filter.Q.value = 1;
      const gain = this.audioCtx.createGain();
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.05, now + 0.05);
      gain.gain.linearRampToValueAtTime(0, now + duration);
      source.connect(filter);
      filter.connect(gain);
      gain.connect(this.audioCtx.destination);
      source.start(now);
    } catch (e) { }
  }

  // 1. Valores puramente base (sin ninguna sinergia ni multiplicador final)
  private obtenerBaseToquePuro(): number {
    return 1 +
      (this.mejoras.fertilizante * this.BALANCE.fertilizantePorNivel) +
      (this.mejoras.herramientasTitanio * this.BALANCE.herramientasTitanioBonus);
  }

  private obtenerBasePasivoPuro(): number {
    return (this.mejoras.regadera * this.BALANCE.regaderaPasivo) +
      (this.mejoras.ecosistema * this.BALANCE.ecosistemaPasivo) +
      (this.mejoras.santuario * this.BALANCE.santuarioPasivo) +
      (this.mejoras.reservaNatural * this.BALANCE.reservaNaturalPasivo);
  }

  // 2. Cálculos Finales con Sinergia Simétrica
  obtenerValorToqueReal(): number {
    const baseToque = this.obtenerBaseToquePuro();
    const basePasivo = this.obtenerBasePasivoPuro();
    const multiG = 1 + (this.mejoras.guantes * this.BALANCE.guantesBonus);
    const multiI = 1 + (this.mejoras.invernadero * this.BALANCE.invernaderoBonus);

    const kF = this.mejoras.fotosintesis * this.BALANCE.fotosintesisBonus;
    const kM = this.mejoras.ecoPulso * this.BALANCE.ecoPulsoBonus;

    // Sinergia simétrica: El toque se beneficia del pasivo ya potenciado por el toque base
    const pasivoPotenciado = (basePasivo + (kM * baseToque)) * multiI;

    return (baseToque + (kF * pasivoPotenciado)) * multiG;
  }

  calcularLPS(): number {
    const baseToque = this.obtenerBaseToquePuro();
    const basePasivo = this.obtenerBasePasivoPuro();
    const multiG = 1 + (this.mejoras.guantes * this.BALANCE.guantesBonus);
    const multiI = 1 + (this.mejoras.invernadero * this.BALANCE.invernaderoBonus);

    const kF = this.mejoras.fotosintesis * this.BALANCE.fotosintesisBonus;
    const kM = this.mejoras.ecoPulso * this.BALANCE.ecoPulsoBonus;

    const toquePotenciado = (baseToque + (kF * basePasivo)) * multiG;

    return (basePasivo + (kM * toquePotenciado)) * multiI;
  }

  obtenerChanceCritico(): number {
    return (this.BALANCE.criticoBaseChance + (this.mejoras.podaMaestra * this.BALANCE.criticoChancePorNivel)) * 100;
  }

  obtenerMultiplicadorCritico(): number {
    return 2 + (this.mejoras.abono * this.BALANCE.abonoBonusCritico);
  }

  obtenerChanceSuperCritico(): number {
    return (this.mejoras.superCrit * this.BALANCE.superCritChance) * 100;
  }

  obtenerMultiplicadorSuperCritico(): number {
    return 2 + (this.mejoras.potenciadorSuperCrit * this.BALANCE.superCritMulti);
  }

  obtenerTotalNiveles(): number {
    return Object.values(this.mejoras).reduce((a: any, b: any) => a + b, 0) as number;
  }

  cambiarVista(vista: 'juego' | 'tienda' | 'estadisticas') {
    if (this.mostrarCinematica) return;
    this.vistaActual = vista;
  }

  // Lógica de Mejoras
  calcularPrecio(tipo: string): number {
    const nivel = this.mejoras[tipo] || 0;
    const base = (this.PRECIOS_BASE as any)[tipo];
    return Math.floor(base * Math.pow(this.FACTOR_CRECIMIENTO, nivel));
  }

  formatearNumero(num: number): string {
    if (num < 1000) return Math.floor(num).toString();

    const unidades = ['', 'K', 'M', 'B', 'T', 'Qa', 'Qi', 'Sx', 'Sp'];
    const orden = Math.floor(Math.log10(Math.abs(num)) / 3);
    const unidad = unidades[orden] || '??';
    const valorReducido = num / Math.pow(10, orden * 3);

    // Si es entero exacto no ponemos decimales, si no, uno solo
    return valorReducido.toFixed(valorReducido >= 100 ? 0 : 1) + unidad;
  }

  obtenerEfectoTexto(id: string): string {
    switch (id) {
      case 'fertilizante': return `+${this.BALANCE.fertilizantePorNivel} Hojas/Toque`;
      case 'podaMaestra': return `+${this.BALANCE.criticoChancePorNivel * 100}% Prob. Crit`;
      case 'herramientasTitanio': return `+${this.BALANCE.herramientasTitanioBonus} Hojas/Toque`;
      case 'guantes': return `+${this.BALANCE.guantesBonus * 100}% Poder Clic`;
      case 'abono': return `+x${this.BALANCE.abonoBonusCritico} Daño Crit`;
      case 'superCrit': return `+${(this.BALANCE.superCritChance * 100).toFixed(1)}% Prob. Super`;
      case 'fotosintesis': return `+${this.BALANCE.fotosintesisBonus * 100}% Bonus Toque`;
      case 'potenciadorSuperCrit': return `+x${this.BALANCE.superCritMulti} Multi. Super`;
      case 'regadera': return `+${this.BALANCE.regaderaPasivo} Hojas/Seg`;
      case 'ecosistema': return `+${this.BALANCE.ecosistemaPasivo} Hojas/Seg`;
      case 'invernadero': return `+${this.BALANCE.invernaderoBonus * 100}% Prod. Total`;
      case 'santuario': return `+${this.BALANCE.santuarioPasivo} Hojas/Seg`;
      case 'ecoPulso': return `+${this.BALANCE.ecoPulsoBonus * 100}% Toque a H/S`;
      case 'reservaNatural': return `+${this.BALANCE.reservaNaturalPasivo} Hojas/Seg`;
      default: return '';
    }
  }

  async comprarMejora(tipo: string) {
    if (this.mostrarCinematica) return;
    const precio = this.calcularPrecio(tipo);
    if (this.hojas >= precio && this.usuarioId) {
      this.hojas = Number((this.hojas - precio).toFixed(1));
      this.mejoras[tipo]++;

      // Persistencia inmediata al comprar
      await this.supabase.actualizarPertenenciasClicker(this.usuarioId, {
        hojas: Math.floor(this.hojas),
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
        let esSuperCritico = false;

        // Críticos y Supercríticos Pasivos
        const chanceSuper = this.mejoras.superCrit * this.BALANCE.superCritChance;
        const chanceNormal = this.BALANCE.criticoBaseChance + (this.mejoras.podaMaestra * this.BALANCE.criticoChancePorNivel);

        const rand = Math.random();
        const multiNormal = 2 + (this.mejoras.abono * this.BALANCE.abonoBonusCritico);
        const multiSuper = 2 + (this.mejoras.potenciadorSuperCrit * this.BALANCE.superCritMulti);

        if (rand < chanceSuper) {
          lps *= (multiNormal * multiSuper);
          esSuperCritico = true;
          esCritico = true;
        } else if (rand < chanceNormal) {
          lps *= multiNormal;
          esCritico = true;
        }

        this.hojas += lps;

        const arbolElement = document.querySelector('.contenedor-arbol-juego');
        if (arbolElement) {
          const rect = arbolElement.getBoundingClientRect();
          this.generarHojaAnimada(
            rect.left + rect.width / 2,
            rect.top + rect.height / 3,
            lps,
            esCritico,
            esSuperCritico
          );
        }
      }
    }, 1000);
  }

  ngOnDestroy() {
    if (this.passiveInterval) clearInterval(this.passiveInterval);
    document.removeEventListener('visibilitychange', this.handleVisibilityChange);
  }

  salirJuego() {
    if (this.mostrarCinematica || this.mostrarAvisoOffline) return;
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
