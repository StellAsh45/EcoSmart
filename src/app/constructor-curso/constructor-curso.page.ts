import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormsModule,
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators
} from '@angular/forms';
import { IonContent, IonIcon, ViewWillEnter } from '@ionic/angular/standalone';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { SupabaseService } from '../services/supabase';
import { FondoVisualComponent } from '../components/fondo-visual/fondo-visual.component';
import { EcoSmartLogoComponent } from '../components/eco-smart-logo/eco-smart-logo.component';
import {
  EditorLeccionComponent,
  BloqueContenido
} from '../components/editor-leccion/editor-leccion.component';
import { EditorQuizComponent, Pregunta } from '../components/editor-quiz/editor-quiz.component';
import { OverlayConfirmacionComponent } from '../components/overlay-confirmacion/overlay-confirmacion.component';
import { addIcons } from 'ionicons';
import {
  arrowBackOutline,
  saveOutline,
  addOutline,
  trashOutline,
  chevronDownOutline,
  chevronUpOutline,
  documentTextOutline,
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
  alertCircleOutline
} from 'ionicons/icons';

interface Leccion {
  id?: string;
  modulo_id?: string;
  titulo: string;
  orden: number;
  contenido_html: string;
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
    EditorQuizComponent,
    OverlayConfirmacionComponent
  ]
})
export class ConstructorCursoPage implements OnInit, ViewWillEnter {
  cursoForm: FormGroup;
  cursoId: string | null = null;
  cargando = true; // Iniciar en true para evitar parpadeos visuales
  guardando = false;

  modulos: Modulo[] = [];

  imagenOriginal: string | null = null;
  archivoImagenPendiente: File | null = null;
  imagenPreviewUrl: string | null = null;

  leccionActiva: Leccion | null = null;
  moduloActivoIndex: number | null = null;
  leccionActivaIndex: number | null = null;

  examenActivo: Examen | null = null;
  modoEdicion: 'leccion' | 'quiz' | null = null;

  // Estado del Overlay Único (Reutilizable para Éxito, Error y Confirmación)
  mostrarOverlay = false;
  tituloOverlay = '';
  mensajeOverlay = '';
  iconoOverlay = 'help-circle-outline';
  textoConfirmarOverlay = 'Confirmar';
  textoCancelarOverlay = 'Volver atrás';
  claseConfirmarOverlay = 'bg-primary-500';
  accionConfirmacionOverlay: () => void = () => { };

  constructor(
    private fb: FormBuilder,
    private supabaseSvc: SupabaseService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.cursoForm = this.fb.group({
      titulo: ['', [Validators.required, Validators.minLength(5)]],
      descripcion: ['', [Validators.required]],
      nivel: ['Principiante', [Validators.required]],
      estado: ['borrador', [Validators.required]],
      imagen_url: ['']
    });

    addIcons({
      arrowBackOutline,
      saveOutline,
      addOutline,
      trashOutline,
      chevronDownOutline,
      chevronUpOutline,
      documentTextOutline,
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
      alertCircleOutline
    });
  }

  async ngOnInit() {
    this.cursoId = this.route.snapshot.paramMap.get('id');
  }

  async ionViewWillEnter() {
    this.cargando = true;
    if (this.cursoId && this.cursoId !== 'nuevo') {
      await this.cargarDatosCurso();
    } else {
      // Pequeño retraso incluso para cursos nuevos si quieres que se vea el logo
      await new Promise(resolve => setTimeout(resolve, 800));
      this.cargando = false;
    }
  }

  async cargarDatosCurso() {
    this.cargando = true;
    await new Promise(resolve => setTimeout(resolve, 1500));

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

      this.modulos = [];

      if (modulosData) {
        for (const mod of modulosData) {
          const { data: leccionesData } = await this.supabaseSvc.obtenerLeccionesModulo(mod.id);
          const { data: examenData } = await this.supabaseSvc.obtenerExamenModulo(mod.id);

          let examenConPreguntas: Examen | undefined = undefined;

          if (examenData) {
            const { data: preguntasData } = await this.supabaseSvc.obtenerPreguntasExamen(examenData.id);
            examenConPreguntas = {
              ...examenData,
              preguntas:
                preguntasData?.map((p: any) => ({
                  id: p.id,
                  pregunta: p.enunciado || p.pregunta,
                  opciones: p.opciones,
                  respuesta_correcta: p.respuesta_correcta,
                  retroalimentacion: p.retroalimentacion
                })) || []
            };
          }

          const leccionesNormalizadas: Leccion[] = (leccionesData || []).map((lec: any) => {
            const bloques = this.normalizarBloquesDesdeJson(lec.contenido_html);
            return {
              ...lec,
              bloques,
              contenido_html: JSON.stringify(bloques)
            };
          });

          this.modulos.push({
            ...mod,
            lecciones: leccionesNormalizadas,
            examen: examenConPreguntas,
            abierto: false
          });
        }
      }
    } catch (error) {
      console.error('Error al cargar curso:', error);
      this.mostrarNotificacionError('Error al cargar el curso');
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

      const {
        data: { user }
      } = await this.supabaseSvc.obtenerUsuario();

      const cursoData = {
        ...this.cursoForm.value,
        creado_por: user?.id
      };

      let result;

      if (this.cursoId && this.cursoId !== 'nuevo') {
        result = await this.supabaseSvc.cliente
          .from('cursos')
          .update(cursoData)
          .eq('id', this.cursoId)
          .select()
          .single();
      } else {
        result = await this.supabaseSvc.crearCurso(cursoData);
      }

      if (result.error) throw result.error;

      const nuevoCursoId = result.data.id;

      for (const [mIndex, mod] of this.modulos.entries()) {
        const moduloData = {
          curso_id: nuevoCursoId,
          titulo: mod.titulo,
          orden: mIndex + 1
        };

        let modResult;

        if (mod.id) {
          modResult = await this.supabaseSvc.cliente
            .from('modulos')
            .update(moduloData)
            .eq('id', mod.id)
            .select()
            .single();
        } else {
          modResult = await this.supabaseSvc.crearModulo(moduloData);
          if (modResult.data) mod.id = modResult.data.id;
        }

        const moduloId = modResult.data.id;

        for (const [lIndex, lec] of mod.lecciones.entries()) {
          const bloquesFinales = this.normalizarBloquesParaGuardar(lec.bloques || []);
          const leccionData = {
            modulo_id: moduloId,
            titulo: lec.titulo,
            orden: lIndex + 1,
            contenido_html: JSON.stringify(bloquesFinales)
          };

          if (lec.id) {
            await this.supabaseSvc.cliente
              .from('lecciones')
              .update(leccionData)
              .eq('id', lec.id);
          } else {
            const lecResult = await this.supabaseSvc.crearLeccion(leccionData);
            if (lecResult.data) lec.id = lecResult.data.id;
          }

          lec.contenido_html = JSON.stringify(bloquesFinales);
        }

        if (mod.examen) {
          if (mod.examen.preguntas && mod.examen.preguntas.length > 0) {
            const examenData = {
              modulo_id: moduloId,
              titulo: mod.examen.titulo
            };

            let exResult;

            if (mod.examen.id) {
              exResult = await this.supabaseSvc.cliente
                .from('examenes')
                .update(examenData)
                .eq('id', mod.examen.id)
                .select()
                .single();
            } else {
              exResult = await this.supabaseSvc.crearExamen(examenData);
              if (exResult.data) mod.examen.id = exResult.data.id;
            }

            const examenId = exResult.data.id;

            await this.supabaseSvc.cliente
              .from('preguntas')
              .delete()
              .eq('examen_id', examenId);

            const preguntasFinales = mod.examen.preguntas.map((p) => ({
              examen_id: examenId,
              enunciado: p.pregunta,
              opciones: p.opciones,
              respuesta_correcta: p.respuesta_correcta,
              retroalimentacion: p.retroalimentacion
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

      this.tituloOverlay = '¡Guardado con éxito!';
      this.mensajeOverlay = 'Tu curso ya está en la nube';
      this.iconoOverlay = 'checkmark-circle-outline';
      this.textoConfirmarOverlay = '';
      this.textoCancelarOverlay = '';
      this.accionConfirmacionOverlay = () => { this.mostrarOverlay = false; };

      this.mostrarOverlay = true;
      setTimeout(() => {
        this.mostrarOverlay = false;
      }, 2000);

    } catch (error) {
      console.error('Error al guardar curso:', error);
      this.mostrarNotificacionError('Hubo un error al guardar el curso');
    } finally {
      this.guardando = false;
    }
  }

  private async borrarImagenDeStorage(url: string) {
    if (url && url.includes('/object/public/cursos/')) {
      const rutaRelativa = url.split('/object/public/cursos/')[1];
      if (rutaRelativa) {
        await this.supabaseSvc.eliminarImagenCurso(rutaRelativa);
      }
    }
  }

  validarTodo(): boolean {
    if (this.cursoForm.invalid) {
      this.cursoForm.markAllAsTouched();
      this.mostrarNotificacionError('Por favor, completa los datos básicos del curso.');
      return false;
    }

    if (this.modulos.length === 0) {
      this.mostrarNotificacionError('El curso debe tener al menos un módulo.');
      return false;
    }

    let hayAlMenosUnExamen = false;

    for (const mod of this.modulos) {
      if (!mod.titulo || mod.titulo.trim().length < 3) {
        this.mostrarNotificacionError(`El módulo "${mod.titulo || 'sin nombre'}" necesita un título válido (mín. 3 chars).`);
        return false;
      }

      if (mod.lecciones.length === 0) {
        this.mostrarNotificacionError(`El módulo "${mod.titulo}" debe tener al menos una lección.`);
        return false;
      }

      for (const lec of mod.lecciones) {
        if (!lec.titulo || lec.titulo.trim().length < 3) {
          this.mostrarNotificacionError(`Una lección del módulo "${mod.titulo}" necesita un título válido (mín. 3 chars).`);
          return false;
        }

        const bloques = lec.bloques || this.normalizarBloquesDesdeJson(lec.contenido_html);

        if (!bloques.length) {
          this.mostrarNotificacionError(`La lección "${lec.titulo}" debe tener al menos un bloque de contenido.`);
          return false;
        }

        for (const bloque of bloques) {
          if (['titulo', 'subtitulo', 'texto', 'lista', 'cita', 'codigo'].includes(bloque.tipo)) {
            if (!bloque.valor || bloque.valor.trim().length < 1) {
              this.mostrarNotificacionError(`Hay un bloque vacío en la lección "${lec.titulo}".`);
              return false;
            }
          }

          if (['imagen', 'video'].includes(bloque.tipo)) {
            if (!bloque.valor || bloque.valor.trim().length < 3) {
              this.mostrarNotificacionError(`Los bloques multimedia de "${lec.titulo}" deben tener URL válida.`);
              return false;
            }
          }
        }
      }

      if (mod.examen?.preguntas?.length) {
        hayAlMenosUnExamen = true;

        if (!mod.examen.titulo || mod.examen.titulo.trim().length < 3) {
          this.mostrarNotificacionError(`El examen del módulo "${mod.titulo}" necesita un título válido (mín. 3 chars).`);
          return false;
        }

        for (const [pIdx, p] of mod.examen.preguntas.entries()) {
          if (!p.pregunta || p.pregunta.trim().length < 3) {
            this.mostrarNotificacionError(`La pregunta #${pIdx + 1} del examen de "${mod.titulo}" necesita un texto válido.`);
            return false;
          }

          if (!p.opciones || p.opciones.length < 2) {
            this.mostrarNotificacionError(`La pregunta #${pIdx + 1} del examen de "${mod.titulo}" debe tener al menos 2 opciones.`);
            return false;
          }

          for (const [oIdx, opt] of p.opciones.entries()) {
            if (!opt || opt.trim().length === 0) {
              this.mostrarNotificacionError(`La opción ${oIdx + 1} de la pregunta #${pIdx + 1} no puede estar vacía.`);
              return false;
            }
          }
        }
      }
    }

    if (!hayAlMenosUnExamen) {
      this.mostrarNotificacionError('El curso debe contener al menos un examen con al menos una pregunta.');
      return false;
    }

    return true;
  }

  agregarModulo() {
    const nuevoModulo: Modulo = {
      titulo: `Nuevo Módulo ${this.modulos.length + 1}`,
      orden: this.modulos.length + 1,
      lecciones: [],
      abierto: true
    };

    this.modulos.push(nuevoModulo);
  }

  toggleModulo(index: number) {
    this.modulos[index].abierto = !this.modulos[index].abierto;
  }

  agregarLeccion(moduloIndex: number) {
    const modulo = this.modulos[moduloIndex];

    const nuevaLeccion: Leccion = {
      titulo: `Nueva Lección ${modulo.lecciones.length + 1}`,
      orden: modulo.lecciones.length + 1,
      contenido_html: JSON.stringify(this.crearBloquesIniciales()),
      bloques: this.crearBloquesIniciales()
    };

    modulo.lecciones.push(nuevaLeccion);
  }

  abrirEditorLeccion(moduloIndex: number, leccionIndex: number) {
    this.moduloActivoIndex = moduloIndex;
    this.leccionActivaIndex = leccionIndex;

    const leccion = this.modulos[moduloIndex].lecciones[leccionIndex];

    if (!leccion.bloques || leccion.bloques.length === 0) {
      leccion.bloques = this.normalizarBloquesDesdeJson(leccion.contenido_html);
    }

    this.leccionActiva = {
      ...leccion,
      bloques: structuredClone(leccion.bloques || [])
    };

    this.modoEdicion = 'leccion';
  }

  abrirEditorQuiz(moduloIndex: number) {
    this.moduloActivoIndex = moduloIndex;
    const modulo = this.modulos[moduloIndex];

    if (!modulo.examen) {
      modulo.examen = {
        titulo: `Quiz del Módulo: ${modulo.titulo}`,
        preguntas: []
      };
    }

    // Asegurar que haya al menos una pregunta si está vacío
    if (!modulo.examen.preguntas || modulo.examen.preguntas.length === 0) {
      modulo.examen.preguntas = [{
        pregunta: '',
        opciones: ['', ''],
        respuesta_correcta: 0,
        retroalimentacion: ''
      }];
    }

    this.examenActivo = { ...modulo.examen };
    this.modoEdicion = 'quiz';
  }

  cerrarEditor() {
    this.leccionActiva = null;
    this.examenActivo = null;
    this.modoEdicion = null;
    this.moduloActivoIndex = null;
    this.leccionActivaIndex = null;
  }

  confirmarCambiosLeccion() {
    if (
      this.leccionActiva &&
      this.moduloActivoIndex !== null &&
      this.leccionActivaIndex !== null
    ) {
      const bloquesFinales = this.normalizarBloquesParaGuardar(this.leccionActiva.bloques || []);
      this.leccionActiva.contenido_html = JSON.stringify(bloquesFinales);
      this.leccionActiva.bloques = bloquesFinales;

      this.modulos[this.moduloActivoIndex].lecciones[this.leccionActivaIndex] = {
        ...this.leccionActiva
      };
    }

    this.cerrarEditor();
  }

  confirmarCambiosQuiz() {
    if (this.examenActivo && this.moduloActivoIndex !== null) {
      this.modulos[this.moduloActivoIndex].examen = { ...this.examenActivo };
    }

    this.cerrarEditor();
  }

  actualizarBloquesLeccion(bloques: BloqueContenido[]) {
    if (this.leccionActiva) {
      const bloquesFinales = this.normalizarBloquesParaGuardar(bloques);
      this.leccionActiva.bloques = bloquesFinales;
      this.leccionActiva.contenido_html = JSON.stringify(bloquesFinales);
    }
  }

  actualizarPreguntasQuiz(preguntas: Pregunta[]) {
    if (this.examenActivo) {
      this.examenActivo.preguntas = preguntas;
    }
  }

  async onFileSelected(event: any) {
    const file = event.target.files[0];

    if (file) {
      this.archivoImagenPendiente = file;
      const reader = new FileReader();

      reader.onload = (e: any) => {
        this.imagenPreviewUrl = e.target.result;
      };

      reader.readAsDataURL(file);

      if (event.target) event.target.value = '';
    }
  }

  async eliminarModulo(index: number) {
    this.tituloOverlay = '¿Eliminar Módulo?';
    this.mensajeOverlay = 'Esta acción borrará todas las lecciones y el examen asociado permanentemente.';
    this.iconoOverlay = 'trash-outline';
    this.textoConfirmarOverlay = 'Eliminar Módulo';
    this.textoCancelarOverlay = 'Cancelar';
    this.claseConfirmarOverlay = 'bg-red-500 hover:bg-red-400 text-slate-950';

    this.accionConfirmacionOverlay = async () => {
      const modulo = this.modulos[index];
      if (modulo.id) {
        const { error } = await this.supabaseSvc.eliminarModulo(modulo.id);
        if (error) {
          this.mostrarNotificacionError('Error al borrar módulo');
          return;
        }
      }
      this.modulos.splice(index, 1);
      this.reordenarModulos();
      this.mostrarOverlay = false;
    };

    this.mostrarOverlay = true;
  }

  private reordenarModulos() {
    this.modulos.forEach((mod, index) => {
      mod.orden = index + 1;
    });
  }

  async eliminarLeccion(moduloIndex: number, leccionIndex: number) {
    this.tituloOverlay = '¿Borrar Lección?';
    this.mensajeOverlay = 'El contenido de esta lección se perderá definitivamente.';
    this.iconoOverlay = 'document-text-outline';
    this.textoConfirmarOverlay = 'Eliminar Lección';
    this.textoCancelarOverlay = 'Cancelar';
    this.claseConfirmarOverlay = 'bg-red-500 hover:bg-red-400 text-slate-950';

    this.accionConfirmacionOverlay = async () => {
      const leccion = this.modulos[moduloIndex].lecciones[leccionIndex];
      if (leccion.id) {
        const { error } = await this.supabaseSvc.eliminarLeccion(leccion.id);
        if (error) {
          this.mostrarNotificacionError('Error al borrar lección');
          return;
        }
      }
      this.modulos[moduloIndex].lecciones.splice(leccionIndex, 1);
      this.reordenarLecciones(moduloIndex);
      this.mostrarOverlay = false;
    };

    this.mostrarOverlay = true;
  }

  private reordenarLecciones(moduloIndex: number) {
    this.modulos[moduloIndex].lecciones.forEach((lec, index) => {
      lec.orden = index + 1;
    });
  }

  private mostrarNotificacionError(mensaje: string) {
    this.tituloOverlay = 'Ups, algo salió mal';
    this.mensajeOverlay = mensaje;
    this.iconoOverlay = 'alert-circle-outline';
    this.textoConfirmarOverlay = 'Entendido';
    this.textoCancelarOverlay = ''; // Sin cancelar
    this.claseConfirmarOverlay = 'bg-red-500 hover:bg-red-400 text-slate-950';
    this.accionConfirmacionOverlay = () => { this.mostrarOverlay = false; };

    this.mostrarOverlay = true;
    setTimeout(() => {
      if (this.mostrarOverlay) this.mostrarOverlay = false;
    }, 2000);
  }

  private crearBloquesIniciales(): BloqueContenido[] {
    return [
      {
        id: this.generarId(),
        tipo: 'titulo',
        valor: 'Nuevo bloque de título'
      },
      {
        id: this.generarId(),
        tipo: 'texto',
        valor: 'Nuevo bloque de párrafo'
      }
    ];
  }

  private normalizarBloquesDesdeJson(contenidoHtml: string): BloqueContenido[] {
    try {
      const parsed = JSON.parse(contenidoHtml || '[]');

      if (!Array.isArray(parsed) || parsed.length === 0) {
        return this.crearBloquesIniciales();
      }

      return parsed.map((b: any) => ({
        id: b.id || this.generarId(),
        tipo: b.tipo || 'texto',
        valor: b.valor || '',
        meta: b.meta || {}
      }));
    } catch {
      return this.crearBloquesIniciales();
    }
  }

  private normalizarBloquesParaGuardar(bloques: BloqueContenido[]): BloqueContenido[] {
    return (bloques || []).map((b: any) => ({
      id: b.id || this.generarId(),
      tipo: b.tipo || 'texto',
      valor: b.valor || '',
      meta: b.meta || {}
    }));
  }

  private generarId(): string {
    return `bloque_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
  }
}