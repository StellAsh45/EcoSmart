import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { IonContent, IonIcon, ViewWillEnter } from '@ionic/angular/standalone';
import { SupabaseService } from '../services/supabase';
import { FondoVisualComponent } from '../components/fondo-visual/fondo-visual.component';
import { EcoSmartLogoComponent } from '../components/eco-smart-logo/eco-smart-logo.component';
// @ts-ignore
import html2pdf from 'html2pdf.js';
import { addIcons } from 'ionicons';
import {
  bookOutline,
  playCircleOutline,
  chevronForwardOutline,
  menuOutline,
  closeOutline,
  personOutline,
  logOutOutline,
  arrowBackOutline,
  checkmarkCircleOutline,
  helpCircleOutline,
  documentTextOutline,
  chevronDownOutline,
  chevronUpOutline,
  arrowForwardOutline,
  schoolOutline,
  chatbubbleEllipsesOutline,
  checkmarkOutline,
  syncOutline,
  radioButtonOnOutline,
  radioButtonOffOutline,
  warningOutline,
  alertCircleOutline
} from 'ionicons/icons';

interface Leccion {
  id: string;
  titulo: string;
  orden: number;
  contenido_html: string;
  completada?: boolean;
}

interface Modulo {
  id: string;
  titulo: string;
  orden: number;
  lecciones: Leccion[];
  expandido?: boolean;
  examen?: any;
}

interface ExamenActivo {
  id: string;
  titulo: string;
  preguntas: any[];
  modulo_id: string;
}

export interface BloqueContenido {
  id: string;
  tipo: 'titulo' | 'subtitulo' | 'texto' | 'imagen' | 'video';
  valor: string;
}


@Component({
  selector: 'app-curso',
  templateUrl: './curso.page.html',
  styleUrls: ['./curso.page.scss'],
  standalone: true,
  imports: [CommonModule, IonContent, IonIcon, FondoVisualComponent, EcoSmartLogoComponent]

})
export class CursoPage implements OnInit, ViewWillEnter {
  cursoId: string | null = null;
  curso: any = null;
  modulos: Modulo[] = [];
  leccionActiva: Leccion | null = null;
  cargando = true;
  sidebarAbierto = false;
  usuario: any = null;
  nombreUsuario = '';
  progresoGeneral = 0;
  bloquesActivos: BloqueContenido[] = [];
  inscripcionId: string | null = null;

  examenActivo: ExamenActivo | null = null;
  respuestasUsuario: number[] = [];
  examenFinalizado = false;
  resultadoExamen: any = null;
  guardandoResultado = false;
  mostrarOverlayError = false;
  mensajeErrorOverlay = '';
  fechaExpedicion = '';
  generandoCertificado = false;

  get preguntasRespondidas(): number {
    return this.respuestasUsuario.filter(r => r !== -1).length;
  }

  examenesPasados = new Set<string>(); // IDs de exámenes con >= 70%
  intentosExamenMap = new Map<string, any>(); // Mapa para guardar el resultado completo de cada examen
  private videoUrlCache = new Map<string, SafeResourceUrl>();

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private supabaseSvc: SupabaseService
  ) {
    addIcons({
      bookOutline, playCircleOutline, chevronForwardOutline,
      menuOutline, closeOutline, personOutline, logOutOutline,
      arrowBackOutline, checkmarkCircleOutline, helpCircleOutline,
      documentTextOutline, chevronDownOutline, chevronUpOutline,
      arrowForwardOutline, schoolOutline, chatbubbleEllipsesOutline,
      checkmarkOutline, radioButtonOnOutline, radioButtonOffOutline, syncOutline,
      warningOutline, alertCircleOutline
    });
  }

  async ngOnInit() {
    this.cursoId = this.route.snapshot.paramMap.get('id');
    if (!this.cursoId) {
      this.router.navigate(['/dashboard-estudiante']);
    }
  }

  async ionViewWillEnter() {
    if (this.cursoId) {
      await this.cargarTodo();
    }
  }

  async cargarTodo() {
    this.cargando = true;
    try {
      await this.cargarUsuario();
      await this.cargarCurso();
      await this.cargarModulosLecciones();
      await this.cargarInscripcion(); // Obtener el ID de la matrícula
      await this.cargarProgreso();

      // Activar la primera lección por defecto si no hay una activa
      if (this.modulos.length > 0 && this.modulos[0].lecciones.length > 0) {
        this.seleccionarLeccion(this.modulos[0].lecciones[0]);
        this.modulos[0].expandido = true;
      }
    } catch (error) {
      console.error('Error al cargar datos del curso:', error);
    } finally {
      this.cargando = false;
    }
  }

  async cargarUsuario() {
    const { data } = await this.supabaseSvc.obtenerUsuario();
    this.usuario = data?.user;
    if (this.usuario) {
      const { data: perfil } = await this.supabaseSvc.obtenerPerfil(this.usuario.id);
      this.nombreUsuario = perfil?.nombre || this.usuario.email?.split('@')[0] || 'Estudiante';
    }
  }

  async cargarCurso() {
    const { data, error } = await this.supabaseSvc.obtenerCursoPorId(this.cursoId!);
    if (error) throw error;
    this.curso = data;
    if (this.curso && this.curso.estado !== 'publicado') {
      this.router.navigate(['/dashboard-estudiante']);
    }
  }

  async cargarInscripcion() {
    if (!this.usuario || !this.cursoId) return;
    const { data: insc, error } = await this.supabaseSvc.obtenerInscripcion(this.usuario.id, this.cursoId);
    if (error) {
      console.error('Error al cargar inscripción:', error);
      return;
    }
    if (insc) {
      this.inscripcionId = insc.id;
    }
  }

  async cargarModulosLecciones() {
    const { data: mods, error } = await this.supabaseSvc.obtenerModulosCurso(this.cursoId!);
    if (error) throw error;

    this.modulos = [];
    for (const m of mods || []) {
      const { data: lecs } = await this.supabaseSvc.obtenerLeccionesModulo(m.id);
      const { data: examen } = await this.supabaseSvc.obtenerExamenModulo(m.id);

      let examenCompleto = null;
      if (examen) {
        const { data: preguntas } = await this.supabaseSvc.obtenerPreguntasExamen(examen.id);
        examenCompleto = { ...examen, preguntas: preguntas || [] };
      }

      this.modulos.push({
        ...m,
        lecciones: lecs || [],
        examen: examenCompleto,
        expandido: false
      });
    }
  }

  async cargarProgreso() {
    if (!this.inscripcionId) return;

    try {
      let totalActividades = 0;
      let totalCompletadas = 0;

      // 1. Cargar lecciones completadas
      const { data: completadas, error } = await this.supabaseSvc.obtenerLeccionesCompletadas(this.inscripcionId);
      if (error) throw error;
      const completadasSet = new Set(completadas?.map((p: any) => p.leccion_id));

      // 2. Cargar exámenes aprobados (Obtenemos todos los intentos del usuario para este curso)
      const { data: resultados, error: errRes } = await this.supabaseSvc.cliente
        .from('resultados_examen')
        .select('examen_id, porcentaje, respuestas, correctas, incorrectas')
        .eq('usuario_id', this.usuario.id)
        .eq('curso_id', this.cursoId);

      if (errRes) console.error('Error cargando resultados:', errRes);

      //console.log('Resultados de exámenes encontrados en DB:');
      //console.table(resultados); esto lo estaba usando para ver que estaba pasando que no me salian

      this.intentosExamenMap = new Map();
      (resultados || []).forEach((r: any) => {
        this.intentosExamenMap.set(r.examen_id, r);
      });

      const examenesAprobadosIds = (resultados || [])
        .filter((r: any) => Number(r.porcentaje) >= 70)
        .map((r: any) => r.examen_id);

      this.examenesPasados = new Set(examenesAprobadosIds);

      for (const mod of this.modulos) {
        // Contar lecciones
        for (const lec of mod.lecciones) {
          totalActividades++;
          if (completadasSet.has(lec.id)) {
            lec.completada = true;
            totalCompletadas++;
          }
        }
        // Contar examen si existe
        if (mod.examen) {
          totalActividades++;
          if (this.examenesPasados.has(mod.examen.id)) {
            totalCompletadas++;
          }
        }
      }

      this.progresoGeneral = totalActividades > 0 ? Math.round((totalCompletadas / totalActividades) * 100) : 0;
      console.log(`Progreso integral: ${this.progresoGeneral}% (${totalCompletadas}/${totalActividades})`);
    } catch (error) {
      console.error('Error al cargar progreso:', error);
    }
  }

  private recalcularProgresoLocal() {
    let totalActividades = 0;
    let totalCompletadas = 0;

    for (const mod of this.modulos) {
      for (const lec of mod.lecciones) {
        totalActividades++;
        if (lec.completada) totalCompletadas++;
      }
      if (mod.examen) {
        totalActividades++;
        if (this.examenesPasados.has(mod.examen.id)) totalCompletadas++;
      }
    }

    this.progresoGeneral = totalActividades > 0 ? Math.round((totalCompletadas / totalActividades) * 100) : 0;
  }

  get esPrimerLeccion(): boolean {
    if (!this.leccionActiva || this.modulos.length === 0) return true;
    const primeraLec = this.modulos[0].lecciones[0];
    return primeraLec?.id === this.leccionActiva.id;
  }

  get esPrimeraLeccionModulo(): boolean {
    if (!this.leccionActiva) return false;
    const modulo = this.modulos.find(m => m.lecciones.some(l => l.id === this.leccionActiva?.id));
    if (!modulo) return false;
    return modulo.lecciones[0].id === this.leccionActiva.id;
  }

  get esUltimaLeccionModulo(): boolean {
    if (!this.leccionActiva) return false;
    const modulo = this.modulos.find(m => m.lecciones.some(l => l.id === this.leccionActiva?.id));
    if (!modulo) return false;
    const ultimaLec = modulo.lecciones[modulo.lecciones.length - 1];
    return ultimaLec.id === this.leccionActiva.id;
  }

  get tieneExamenModuloActual(): boolean {
    const modulo = this.modulos.find(m => m.lecciones.some(l => l.id === this.leccionActiva?.id));
    return !!modulo?.examen;
  }

  get esUltimaActividadCurso(): boolean {
    if (this.modulos.length === 0) return false;

    const ultimoMod = this.modulos[this.modulos.length - 1];
    if (!ultimoMod) return false;

    if (this.examenActivo) {
      return this.examenActivo.id === ultimoMod.examen?.id;
    }
    if (this.leccionActiva) {
      const esUltimaLec = ultimoMod.lecciones && ultimoMod.lecciones.length > 0
        ? ultimoMod.lecciones[ultimoMod.lecciones.length - 1]?.id === this.leccionActiva.id
        : false;
      return esUltimaLec && !ultimoMod.examen;
    }
    return false;
  }

  get moduloActualExamen(): Modulo | null {
    if (!this.leccionActiva) return null;
    return this.modulos.find(m => m.lecciones.some(l => l.id === this.leccionActiva?.id)) || null;
  }

  get esUltimaLeccion(): boolean {
    if (!this.leccionActiva || this.modulos.length === 0) return true;
    const ultimoMod = this.modulos[this.modulos.length - 1];
    if (!ultimoMod.lecciones.length) return true;
    const ultimaLec = ultimoMod.lecciones[ultimoMod.lecciones.length - 1];
    return ultimaLec?.id === this.leccionActiva.id && !ultimoMod.examen;
  }

  seleccionarLeccion(leccion: Leccion) {
    this.leccionActiva = leccion;
    this.examenActivo = null;
    this.examenFinalizado = false;
    this.resultadoExamen = null;
    this.sidebarAbierto = false;

    // Parsear bloques
    try {
      this.bloquesActivos = JSON.parse(leccion.contenido_html || '[]');
    } catch {
      this.bloquesActivos = [];
    }
  }

  seleccionarExamen(modulo: Modulo) {
    if (!modulo.examen) return;

    const idExamen = modulo.examen.id;
    this.leccionActiva = null;
    this.examenActivo = {
      id: idExamen,
      titulo: modulo.examen.titulo,
      preguntas: modulo.examen.preguntas,
      modulo_id: modulo.id
    };

    // Restaurar estado previo si existe
    if (this.intentosExamenMap.has(idExamen)) {
      const previo = this.intentosExamenMap.get(idExamen);
      this.resultadoExamen = previo;
      this.respuestasUsuario = [...previo.respuestas]; // Clonar array de respuestas
      this.examenFinalizado = true;
    } else {
      this.respuestasUsuario = new Array(this.examenActivo.preguntas.length).fill(-1);
      this.examenFinalizado = false;
      this.resultadoExamen = null;
    }

    this.sidebarAbierto = false;
  }

  seleccionarOpcion(preguntaIndex: number, opcionIndex: number) {
    if (this.examenFinalizado) return;
    this.respuestasUsuario[preguntaIndex] = opcionIndex;
  }

  async finalizarExamen() {
    if (this.respuestasUsuario.includes(-1)) {
      this.mensajeErrorOverlay = 'Por favor responde todas las preguntas antes de finalizar el examen.';
      this.mostrarOverlayError = true;
      return;
    }

    this.guardandoResultado = true;

    let correctas = 0;
    this.examenActivo?.preguntas.forEach((p, index) => {
      if (this.respuestasUsuario[index] === p.respuesta_correcta) {
        correctas++;
      }
    });

    const incorrectas = this.examenActivo!.preguntas.length - correctas;
    const porcentaje = Math.round((correctas / this.examenActivo!.preguntas.length) * 100);

    const resultado = {
      usuario_id: this.usuario.id,
      examen_id: this.examenActivo!.id,
      curso_id: this.cursoId!,
      modulo_id: this.examenActivo!.modulo_id,
      correctas,
      incorrectas,
      porcentaje,
      respuestas: this.respuestasUsuario
    };

    try {
      const { data, error } = await this.supabaseSvc.guardarResultadoExamen(resultado);
      if (error) {
        console.error('Error de Supabase al guardar:', error);
        throw error;
      }

      this.resultadoExamen = data;
      this.examenFinalizado = true;

      if (porcentaje >= 70) {
        this.examenesPasados.add(this.examenActivo!.id);
        this.intentosExamenMap.set(this.examenActivo!.id, data);
        this.recalcularProgresoLocal();
        // Actualizar progreso en la tabla de inscripciones
        await this.supabaseSvc.actualizarProgresoInscripcion(
          this.usuario.id,
          this.cursoId!,
          this.progresoGeneral
        );
      } else {
        // Aunque no apruebe, guardamos el intento para persistencia
        this.intentosExamenMap.set(this.examenActivo!.id, data);
      }

    } catch (error) {
      console.error('Error al guardar resultado:', error);
      alert('Hubo un error al guardar tus resultados. Reintenta por favor.');
    } finally {
      this.guardandoResultado = false;
    }
  }

  async reintentarExamen() {
    if (!this.examenActivo || !this.usuario) return;

    try {
      // 1. Borrar de la base de datos
      await this.supabaseSvc.eliminarResultadoExamen(this.usuario.id, this.examenActivo.id);

      // 2. Limpiar estado local
      this.intentosExamenMap.delete(this.examenActivo.id);
      this.examenesPasados.delete(this.examenActivo.id);

      this.examenFinalizado = false;
      this.resultadoExamen = null;
      this.respuestasUsuario = new Array(this.examenActivo.preguntas.length).fill(-1);

      // 3. Recalcular progreso y sincronizar
      this.recalcularProgresoLocal();
      await this.supabaseSvc.actualizarProgresoInscripcion(
        this.usuario.id,
        this.cursoId!,
        this.progresoGeneral
      );

      // Scroll arriba
      const mainElement = document.querySelector('main');
      if (mainElement) mainElement.scrollTop = 0;

    } catch (error) {
      console.error('Error al reiniciar examen:', error);
      this.mensajeErrorOverlay = 'No se pudo reiniciar el examen. Intenta de nuevo.';
      this.mostrarOverlayError = true;
    }
  }

  cerrarError() {
    this.mostrarOverlayError = false;
    this.mensajeErrorOverlay = '';
  }

  toggleModulo(mod: Modulo) {
    mod.expandido = !mod.expandido;
  }

  toggleSidebar() {
    this.sidebarAbierto = !this.sidebarAbierto;
  }

  async marcarCompletada() {
    if (!this.leccionActiva || !this.inscripcionId) return;

    try {
      // 1. Marcar localmente para respuesta inmediata en la UI
      this.leccionActiva.completada = true;
      this.recalcularProgresoLocal();

      // 2. Guardar progreso de la lección en Supabase (lecciones_completadas)
      const { error: saveError } = await this.supabaseSvc.guardarLeccionCompletada(
        this.inscripcionId,
        this.leccionActiva.id
      );

      if (saveError) throw saveError;

      // 3. Actualizar el progreso general en la tabla de inscripciones
      const { error: updateError } = await this.supabaseSvc.actualizarProgresoInscripcion(
        this.usuario.id,
        this.cursoId!,
        this.progresoGeneral
      );

      if (updateError) throw updateError;



    } catch (error) {
      console.error('Error al marcar lección como completada:', error);
    }
  }

  async irASiguienteLeccion() {
    // 1. Marcar como completada
    await this.marcarCompletada();

    // 2. ¿Es la última lección del módulo y hay un examen?
    if (this.esUltimaLeccionModulo && this.tieneExamenModuloActual) {
      this.seleccionarExamen(this.moduloActualExamen!);
      // Scroll to top
      const mainElement = document.querySelector('main');
      if (mainElement) mainElement.scrollTop = 0;
      return;
    }

    // 3. Si no hay examen o no es la última lección, buscar la siguiente lección
    let encontradaActiva = false;
    let siguienteLec: Leccion | null = null;
    let siguienteModulo: Modulo | null = null;

    for (const mod of this.modulos) {
      for (const lec of mod.lecciones) {
        if (encontradaActiva) {
          siguienteLec = lec;
          siguienteModulo = mod;
          break;
        }
        if (lec.id === this.leccionActiva?.id) {
          encontradaActiva = true;
        }
      }
      if (siguienteLec) break;
    }

    if (siguienteLec) {
      if (siguienteModulo) siguienteModulo.expandido = true;
      this.seleccionarLeccion(siguienteLec);
      // Scroll to top
      const mainElement = document.querySelector('main');
      if (mainElement) mainElement.scrollTop = 0;
    } else {
      this.volverAlDashboard();
    }
  }

  async irASiguienteDesdeExamen() {
    let encontradoActivo = false;
    let siguienteLec: Leccion | null = null;
    let siguienteModulo: Modulo | null = null;

    for (const mod of this.modulos) {
      if (encontradoActivo) {
        if (mod.lecciones.length > 0) {
          siguienteLec = mod.lecciones[0];
          siguienteModulo = mod;
          break;
        }
      }
      if (mod.examen?.id === this.examenActivo?.id) {
        encontradoActivo = true;
      }
    }

    if (siguienteLec) {
      if (siguienteModulo) siguienteModulo.expandido = true;
      this.seleccionarLeccion(siguienteLec);
    } else {
      this.volverAlDashboard();
    }
  }

  async irALeccionAnterior() {
    let anteriorLec: Leccion | null = null;
    let anteriorModulo: Modulo | null = null;
    let ultimaLecVisualizada: Leccion | null = null;
    let moduloDeUltimaLec: Modulo | null = null;

    for (const mod of this.modulos) {
      for (const lec of mod.lecciones) {
        if (lec.id === this.leccionActiva?.id) {
          anteriorLec = ultimaLecVisualizada;
          anteriorModulo = moduloDeUltimaLec;
          break;
        }
        ultimaLecVisualizada = lec;
        moduloDeUltimaLec = mod;
      }
      if (anteriorLec) break;
    }

    if (anteriorLec) {
      if (anteriorModulo) anteriorModulo.expandido = true;
      this.seleccionarLeccion(anteriorLec);
      // Scroll to top
      const mainElement = document.querySelector('main');
      if (mainElement) mainElement.scrollTop = 0;
    }
  }

  volverAlDashboard() {
    this.router.navigate(['/dashboard-estudiante']);
  }

  async cerrarSesion() {
    await this.supabaseSvc.cerrarSesion();
    this.router.navigate(['/ingreso']);
  }

  async descargarCertificado() {
    this.generandoCertificado = true;
    this.fechaExpedicion = new Date().toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' });
    
    setTimeout(() => {
      const element = document.getElementById('certificado-container');
      if (!element) {
        this.generandoCertificado = false;
        return;
      }
      
      const opt: any = {
        margin:       0,
        filename:     `Certificado-${this.curso?.titulo?.replace(/\s+/g, '-') || 'Curso'}.pdf`,
        image:        { type: 'jpeg', quality: 0.98 },
        html2canvas:  { scale: 2, useCORS: true },
        jsPDF:        { unit: 'in', format: 'letter', orientation: 'landscape' }
      };

      html2pdf().from(element).set(opt).save().then(() => {
        this.generandoCertificado = false;
      }).catch((err: any) => {
        console.error('Error al generar el certificado PDF', err);
        this.generandoCertificado = false;
        this.mensajeErrorOverlay = 'Error al generar el certificado. Intenta de nuevo.';
        this.mostrarOverlayError = true;
      });
    }, 100);
  }

  trackByBloque(index: number, bloque: BloqueContenido): string {
    return bloque.id;
  }

  private sanitizer = inject(DomSanitizer);

  obtenerUrlVideo(id: string): SafeResourceUrl {
    if (this.videoUrlCache.has(id)) {
      return this.videoUrlCache.get(id)!;
    }
    const url = `https://www.youtube.com/embed/${id}`;
    const safeUrl = this.sanitizer.bypassSecurityTrustResourceUrl(url);
    this.videoUrlCache.set(id, safeUrl);
    return safeUrl;
  }
}
