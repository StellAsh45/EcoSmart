import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { IonContent, IonIcon, ToastController } from '@ionic/angular/standalone';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { SupabaseService } from '../services/supabase';
import { FondoVisualComponent } from '../components/fondo-visual/fondo-visual.component';
import { EcoSmartLogoComponent } from '../components/eco-smart-logo/eco-smart-logo.component';
import { EditorLeccionComponent, BloqueContenido } from '../components/editor-leccion/editor-leccion.component';
import { EditorQuizComponent, Pregunta } from '../components/editor-quiz/editor-quiz.component';
import { addIcons } from 'ionicons';
import {
  playCircleOutline,
  helpCircleOutline,
  createOutline,
  eyeOutline,
  checkmarkCircleOutline,
  closeOutline,
  syncOutline,
  cameraOutline,
  bookOutline,
  schoolOutline,
  alertCircleOutline,
  arrowBackOutline,
  saveOutline,
  addOutline,
  trashOutline,
  chevronDownOutline,
  chevronUpOutline,
  documentTextOutline
} from 'ionicons/icons';

interface Leccion {
  id?: string;
  modulo_id?: string;
  titulo: string;
  orden: number;
  contenido_tipo: 'texto' | 'video' | 'interactivo';
  contenido_html: string; // JSON string de los bloques
  bloques?: BloqueContenido[];
}

interface Examen {
  id?: string;
  modulo_id?: string;
  titulo: string;
  preguntas?: Pregunta[];
}

interface Modulo {
  id?: string;
  curso_id?: string;
  titulo: string;
  orden: number;
  lecciones: Leccion[];
  examen?: Examen;
  abierto?: boolean;
}

@Component({
  selector: 'app-constructor-curso',
  templateUrl: './constructor-curso.page.html',
  styleUrls: ['./constructor-curso.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    IonContent,
    IonIcon,
    RouterLink,
    FondoVisualComponent,
    EcoSmartLogoComponent,
    EditorLeccionComponent,
    EditorQuizComponent
  ]
})
export class ConstructorCursoPage implements OnInit {
  cursoForm: FormGroup;
  cursoId: string | null = null;
  cargando = false;
  guardando = false;

  modulos: Modulo[] = [];

  // Gestión de Imágenes
  imagenOriginal: string | null = null;
  archivoImagenPendiente: File | null = null;
  imagenPreviewUrl: string | null = null;

  // Gestión de Lección Activa
  leccionActiva: Leccion | null = null;
  moduloActivoIndex: number | null = null;

  // Gestión de Quiz Activo
  examenActivo: Examen | null = null;
  modoEdicion: 'leccion' | 'quiz' | null = null;

  // Overlays de Feedback
  mostrarOverlayExito = false;
  mostrarOverlayError = false;
  mensajeErrorOverlay = '';

  constructor(
    private fb: FormBuilder,
    private supabaseSvc: SupabaseService,
    private router: Router,
    private route: ActivatedRoute,
    private toastCtrl: ToastController
  ) {
    this.cursoForm = this.fb.group({
      titulo: ['', [Validators.required, Validators.minLength(5)]],
      descripcion: ['', [Validators.required]],
      nivel: ['Principiante', [Validators.required]],
      estado: ['borrador', [Validators.required]],
      imagen_url: ['']
    });

    addIcons({
      arrowBackOutline, saveOutline, addOutline, trashOutline, 
      chevronDownOutline, chevronUpOutline, documentTextOutline, 
      playCircleOutline, helpCircleOutline, createOutline, 
      eyeOutline, checkmarkCircleOutline, closeOutline, 
      syncOutline, cameraOutline, bookOutline, schoolOutline, 
      alertCircleOutline
    });
  }

  async ngOnInit() {
    this.cursoId = this.route.snapshot.paramMap.get('id');
    if (this.cursoId && this.cursoId !== 'nuevo') {
      await this.cargarDatosCurso();
    }
  }

  async cargarDatosCurso() {
    this.cargando = true;
    try {
      const { data: curso, error } = await this.supabaseSvc.obtenerCursoPorId(this.cursoId!);
      if (error) throw error;

      this.cursoForm.patchValue({
        titulo: curso.titulo,
        descripcion: curso.descripcion,
        nivel: curso.nivel,
        estado: curso.estado,
        imagen_url: curso.imagen_url
      });
      this.imagenOriginal = curso.imagen_url;
      this.imagenPreviewUrl = curso.imagen_url;

      const { data: modulosData } = await this.supabaseSvc.obtenerModulosCurso(this.cursoId!);
      if (modulosData) {
        for (const mod of modulosData) {
          const { data: leccionesData } = await this.supabaseSvc.obtenerLeccionesModulo(mod.id);
          const { data: examenData } = await this.supabaseSvc.obtenerExamenModulo(mod.id);
          let examenConPreguntas = undefined;

          if (examenData) {
            const { data: preguntasData } = await this.supabaseSvc.obtenerPreguntasExamen(examenData.id);
            examenConPreguntas = {
              ...examenData,
              preguntas: preguntasData?.map(p => ({
                id: p.id,
                pregunta: p.enunciado || p.pregunta,
                opciones: p.opciones,
                respuesta_correcta: p.respuesta_correcta
              })) || []
            };
          }

          this.modulos.push({
            ...mod,
            lecciones: leccionesData || [],
            examen: examenConPreguntas,
            abierto: false
          });
        }
      }
    } catch (error) {
      console.error('Error al cargar curso:', error);
    } finally {
      this.cargando = false;
    }
  }

  async guardarCurso() {
    if (!this.validarTodo()) return;

    this.guardando = true;
    try {
      if (this.archivoImagenPendiente) {
        const nombreArchivo = `${Date.now()}_${this.archivoImagenPendiente.name.replace(/\s+/g, '_')}`;
        const ruta = `portadas/${nombreArchivo}`;
        const { error } = await this.supabaseSvc.subirImagenCurso(this.archivoImagenPendiente, ruta);
        if (error) throw error;
        const urlPublica = this.supabaseSvc.obtenerUrlPublica(ruta);
        this.cursoForm.patchValue({ imagen_url: urlPublica });
      }

      const { data: { user } } = await this.supabaseSvc.obtenerUsuario();
      const cursoData = { ...this.cursoForm.value, creado_por: user?.id };

      let result;
      if (this.cursoId && this.cursoId !== 'nuevo') {
        result = await this.supabaseSvc.cliente.from('cursos').update(cursoData).eq('id', this.cursoId).select().single();
      } else {
        result = await this.supabaseSvc.crearCurso(cursoData);
      }

      if (result.error) throw result.error;
      const nuevoCursoId = result.data.id;

      for (const [mIndex, mod] of this.modulos.entries()) {
        const moduloData = { curso_id: nuevoCursoId, titulo: mod.titulo, orden: mIndex + 1 };
        let modResult;
        if (mod.id) {
          modResult = await this.supabaseSvc.cliente.from('modulos').update(moduloData).eq('id', mod.id).select().single();
        } else {
          modResult = await this.supabaseSvc.crearModulo(moduloData);
          if (modResult.data) mod.id = modResult.data.id;
        }

        const moduloId = modResult.data.id;

        for (const [lIndex, lec] of mod.lecciones.entries()) {
          const leccionData = { modulo_id: moduloId, titulo: lec.titulo, orden: lIndex + 1, contenido_tipo: lec.contenido_tipo, contenido_html: lec.contenido_html };
          if (lec.id) {
            await this.supabaseSvc.cliente.from('lecciones').update(leccionData).eq('id', lec.id);
          } else {
            const lecResult = await this.supabaseSvc.crearLeccion(leccionData);
            if (lecResult.data) lec.id = lecResult.data.id;
          }
        }

        if (mod.examen) {
          if (mod.examen.preguntas && mod.examen.preguntas.length > 0) {
            const examenData = { modulo_id: moduloId, titulo: mod.examen.titulo };
            let exResult;
            if (mod.examen.id) {
              exResult = await this.supabaseSvc.cliente.from('examenes').update(examenData).eq('id', mod.examen.id).select().single();
            } else {
              exResult = await this.supabaseSvc.crearExamen(examenData);
              if (exResult.data) mod.examen.id = exResult.data.id;
            }
            const examenId = exResult.data.id;
            await this.supabaseSvc.cliente.from('preguntas').delete().eq('examen_id', examenId);
            const preguntasFinales = mod.examen.preguntas.map(p => ({
              examen_id: examenId,
              enunciado: p.pregunta,
              opciones: p.opciones,
              respuesta_correcta: p.respuesta_correcta
            }));
            await this.supabaseSvc.guardarPreguntas(preguntasFinales);
          } else if (mod.examen.id) {
            await this.supabaseSvc.eliminarExamen(mod.examen.id);
            delete mod.examen;
          }
        }
      }

      const imagenFinal = this.cursoForm.get('imagen_url')?.value;
      if (this.archivoImagenPendiente && this.imagenOriginal && this.imagenOriginal !== imagenFinal) {
        await this.borrarImagenDeStorage(this.imagenOriginal);
      }

      this.archivoImagenPendiente = null;
      this.imagenOriginal = imagenFinal;
      this.imagenPreviewUrl = imagenFinal;

      if (!this.cursoId || this.cursoId === 'nuevo') {
        this.cursoId = nuevoCursoId;
        this.router.navigate(['/constructor-curso', this.cursoId]);
      }

      this.mostrarOverlayExito = true;
      setTimeout(() => { this.mostrarOverlayExito = false; }, 4000);

    } catch (error: any) {
      console.error('Error al guardar curso:', error);
      const mensaje = error.message || 'Error inesperado al guardar el curso';
      this.mostrarMensajeError(mensaje);
    } finally {
      this.guardando = false;
    }
  }

  private async borrarImagenDeStorage(url: string) {
    if (url && url.includes('/object/public/cursos/')) {
      const rutaRelativa = url.split('/object/public/cursos/')[1];
      if (rutaRelativa) await this.supabaseSvc.eliminarImagenCurso(rutaRelativa);
    }
  }

  validarTodo(): boolean {
    if (this.cursoForm.invalid) {
      this.cursoForm.markAllAsTouched();
      this.mostrarMensajeError('Por favor, completa los datos básicos del curso.');
      return false;
    }
    if (this.modulos.length === 0) {
      this.mostrarMensajeError('El curso debe tener al menos un módulo.');
      return false;
    }
    for (const mod of this.modulos) {
      if (!mod.titulo || mod.titulo.trim().length < 3) {
        this.mostrarMensajeError(`El módulo "${mod.titulo || 'sin nombre'}" necesita un título válido (mín. 3 caracteres).`);
        return false;
      }
      if (mod.lecciones.length === 0) {
        this.mostrarMensajeError(`El módulo "${mod.titulo}" debe tener al menos una lección.`);
        return false;
      }
      for (const lec of mod.lecciones) {
        if (!lec.titulo || lec.titulo.trim().length < 3) {
          this.mostrarMensajeError(`Una lección del módulo "${mod.titulo}" necesita un título válido (mín. 3 caracteres).`);
          return false;
        }
        if (!lec.bloques) {
          lec.bloques = this.parsearBloques(lec.contenido_html);
        }
        if (lec.bloques && lec.bloques.length > 0) {
          for (const bloque of lec.bloques) {
            if (['titulo', 'subtitulo', 'texto'].includes(bloque.tipo)) {
              if (!bloque.valor || bloque.valor.trim().length < 3) {
                this.mostrarMensajeError(`Un bloque de texto en la lección "${lec.titulo}" debe tener al menos 3 caracteres.`);
                return false;
              }
            }
          }
        }
      }
      if (!mod.examen || !mod.examen.preguntas || mod.examen.preguntas.length === 0) {
        this.mostrarMensajeError(`El módulo "${mod.titulo}" debe tener un examen configurado con al menos una pregunta.`);
        return false;
      }

      if (!mod.examen.titulo || mod.examen.titulo.trim().length < 3) {
        this.mostrarMensajeError(`El examen del módulo "${mod.titulo}" necesita un título válido (mín. 3 caracteres).`);
        return false;
      }
      for (const [pIdx, p] of mod.examen.preguntas.entries()) {
        if (!p.pregunta || p.pregunta.trim().length < 3) {
          this.mostrarMensajeError(`La pregunta #${pIdx + 1} del examen de "${mod.titulo}" necesita un texto válido.`);
          return false;
        }
        if (!p.opciones || p.opciones.length < 2) {
          this.mostrarMensajeError(`La pregunta #${pIdx + 1} del examen de "${mod.titulo}" debe tener al menos 2 opciones.`);
          return false;
        }
        for (const [oIdx, opt] of p.opciones.entries()) {
          if (!opt || opt.trim().length === 0) {
            this.mostrarMensajeError(`La opción ${oIdx + 1} de la pregunta #${pIdx + 1} no puede estar vacía.`);
            return false;
          }
        }
      }
    }
    return true;
  }

  agregarModulo() {
    const nuevoModulo: Modulo = { titulo: `Nuevo Módulo ${this.modulos.length + 1}`, orden: this.modulos.length + 1, lecciones: [], abierto: true };
    this.modulos.push(nuevoModulo);
  }

  toggleModulo(index: number) {
    this.modulos[index].abierto = !this.modulos[index].abierto;
  }

  agregarLeccion(moduloIndex: number) {
    const modulo = this.modulos[moduloIndex];
    const nuevaLeccion: Leccion = { titulo: `Nueva Lección ${modulo.lecciones.length + 1}`, orden: modulo.lecciones.length + 1, contenido_tipo: 'texto', contenido_html: '[]', bloques: [] };
    modulo.lecciones.push(nuevaLeccion);
  }

  abrirEditorLeccion(moduloIndex: number, leccionIndex: number) {
    this.moduloActivoIndex = moduloIndex;
    const leccion = this.modulos[moduloIndex].lecciones[leccionIndex];
    if (!leccion.bloques) {
      leccion.bloques = this.parsearBloques(leccion.contenido_html);
    }
    this.leccionActiva = { ...leccion };
    this.modoEdicion = 'leccion';
  }

  abrirEditorQuiz(moduloIndex: number) {
    this.moduloActivoIndex = moduloIndex;
    const modulo = this.modulos[moduloIndex];
    if (!modulo.examen) {
      modulo.examen = { titulo: `Quiz del Módulo: ${modulo.titulo}`, preguntas: [] };
    }
    this.examenActivo = { ...modulo.examen };
    this.modoEdicion = 'quiz';
  }

  cerrarEditor() {
    this.leccionActiva = null;
    this.examenActivo = null;
    this.modoEdicion = null;
    this.moduloActivoIndex = null;
  }

  confirmarCambiosLeccion() {
    if (this.leccionActiva && this.moduloActivoIndex !== null) {
      const leccionIndex = this.modulos[this.moduloActivoIndex].lecciones.findIndex(l => l.orden === this.leccionActiva?.orden);
      if (leccionIndex !== -1) {
        this.leccionActiva.contenido_html = JSON.stringify(this.leccionActiva.bloques);
        this.modulos[this.moduloActivoIndex].lecciones[leccionIndex] = { ...this.leccionActiva };
      }
    }
    this.cerrarEditor();
  }

  confirmarCambiosQuiz() {
    if (this.examenActivo && this.moduloActivoIndex !== null) {
      this.modulos[this.moduloActivoIndex].examen = { ...this.examenActivo };
    }
    this.cerrarEditor();
  }

  actualizarBloquesLeccion(bloques: BloqueContenido[]) { if (this.leccionActiva) this.leccionActiva.bloques = bloques; }
  actualizarPreguntasQuiz(preguntas: Pregunta[]) { if (this.examenActivo) this.examenActivo.preguntas = preguntas; }

  async onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.archivoImagenPendiente = file;
      const reader = new FileReader();
      reader.onload = (e: any) => { this.imagenPreviewUrl = e.target.result; };
      reader.readAsDataURL(file);
      if (event.target) event.target.value = '';
    }
  }

  async eliminarModulo(index: number) {
    const modulo = this.modulos[index];
    if (modulo.id) {
      if (confirm('¿Eliminar este módulo permanentemente?')) {
        const { error } = await this.supabaseSvc.eliminarModulo(modulo.id);
        if (error) { this.mostrarMensajeError('Error al borrar módulo'); return; }
        this.modulos.splice(index, 1);
        this.reordenarModulos();
      }
    } else {
      this.modulos.splice(index, 1);
      this.reordenarModulos();
    }
  }

  private reordenarModulos() { this.modulos.forEach((mod, index) => { mod.orden = index + 1; }); }

  async eliminarLeccion(moduloIndex: number, leccionIndex: number) {
    const leccion = this.modulos[moduloIndex].lecciones[leccionIndex];
    if (leccion.id) {
      if (confirm('¿Eliminar esta lección permanentemente?')) {
        const { error } = await this.supabaseSvc.eliminarLeccion(leccion.id);
        if (error) { this.mostrarMensajeError('Error al borrar lección'); return; }
        this.modulos[moduloIndex].lecciones.splice(leccionIndex, 1);
        this.reordenarLecciones(moduloIndex);
      }
    } else {
      this.modulos[moduloIndex].lecciones.splice(leccionIndex, 1);
      this.reordenarLecciones(moduloIndex);
    }
  }

  private reordenarLecciones(moduloIndex: number) { this.modulos[moduloIndex].lecciones.forEach((lec, index) => { lec.orden = index + 1; }); }

  async mostrarToast(mensaje: string, color: 'success' | 'danger' = 'success') {
    const toast = await this.toastCtrl.create({
      message: mensaje,
      duration: 2000,
      position: 'middle',
      color: color,
      cssClass: 'premium-toast',
      buttons: [{ icon: color === 'success' ? 'checkmark-circle-outline' : 'close-outline', side: 'start', role: 'cancel' }]
    });
    await toast.present();
  }

  private mostrarMensajeError(msg: string) {
    this.mensajeErrorOverlay = msg;
    this.mostrarOverlayError = true;
    setTimeout(() => { if (this.mostrarOverlayError) this.mostrarOverlayError = false; }, 4000);
  }

  private parsearBloques(html: string): BloqueContenido[] {
    try { return JSON.parse(html || '[]'); } catch { return []; }
  }
}
