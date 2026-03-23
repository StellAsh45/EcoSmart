import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { IonContent, IonIcon } from '@ionic/angular/standalone';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { SupabaseService } from '../services/supabase';
import { FondoVisualComponent } from '../components/fondo-visual/fondo-visual.component';
import { EcoSmartLogoComponent } from '../components/eco-smart-logo/eco-smart-logo.component';
import { EditorLeccionComponent, BloqueContenido } from '../components/editor-leccion/editor-leccion.component';
import { EditorQuizComponent, Pregunta } from '../components/editor-quiz/editor-quiz.component';
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
  cameraOutline
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
  descripcion: string;
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

  // Gestión de Lección Activa
  leccionActiva: Leccion | null = null;
  moduloActivoIndex: number | null = null;

  // Gestión de Quiz Activo
  examenActivo: Examen | null = null;
  modoEdicion: 'leccion' | 'quiz' | null = null;

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
      cameraOutline
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

      // Cargar módulos, lecciones y exámenes
      const { data: modulosData } = await this.supabaseSvc.obtenerModulosCurso(this.cursoId!);
      if (modulosData) {
        for (const mod of modulosData) {
          // Cargar Lecciones
          const { data: leccionesData } = await this.supabaseSvc.obtenerLeccionesModulo(mod.id);

          // Cargar Examen
          const { data: examenData } = await this.supabaseSvc.obtenerExamenModulo(mod.id);
          let examenConPreguntas = undefined;

          if (examenData) {
            const { data: preguntasData } = await this.supabaseSvc.obtenerPreguntasExamen(examenData.id);
            examenConPreguntas = {
              ...examenData,
              preguntas: preguntasData?.map(p => ({
                id: p.id,
                pregunta: p.enunciado || p.pregunta, // Mapeo flexible
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
      const { data: { user } } = await this.supabaseSvc.obtenerUsuario();
      const cursoData = {
        ...this.cursoForm.value,
        creado_por: user?.id
      };

      let result;
      if (this.cursoId && this.cursoId !== 'nuevo') {
        result = await this.supabaseSvc.cliente.from('cursos').update(cursoData).eq('id', this.cursoId).select().single();
      } else {
        result = await this.supabaseSvc.crearCurso(cursoData);
      }

      if (result.error) throw result.error;

      const nuevoCursoId = result.data.id;

      // GUARDAR MÓDULOS Y LECCIONES
      for (const [mIndex, mod] of this.modulos.entries()) {
        const moduloData = {
          curso_id: nuevoCursoId,
          titulo: mod.titulo,
          orden: mIndex + 1,
          descripcion: mod.descripcion || ''
        };

        let modResult;
        if (mod.id) {
          modResult = await this.supabaseSvc.cliente.from('modulos').update(moduloData).eq('id', mod.id).select().single();
        } else {
          modResult = await this.supabaseSvc.crearModulo(moduloData);
          if (modResult.data) mod.id = modResult.data.id;
        }

        const moduloId = modResult.data.id;

        // Guardar Lecciones
        for (const [lIndex, lec] of mod.lecciones.entries()) {
          const leccionData = {
            modulo_id: moduloId,
            titulo: lec.titulo,
            orden: lIndex + 1,
            contenido_tipo: lec.contenido_tipo,
            contenido_html: lec.contenido_html
          };

          if (lec.id) {
            await this.supabaseSvc.cliente.from('lecciones').update(leccionData).eq('id', lec.id);
          } else {
            const lecResult = await this.supabaseSvc.crearLeccion(leccionData);
            if (lecResult.data) lec.id = lecResult.data.id;
          }
        }

        // Gestión del Quiz
        if (mod.examen) {
          if (mod.examen.preguntas && mod.examen.preguntas.length > 0) {
            const examenData = {
              modulo_id: moduloId,
              titulo: mod.examen.titulo
            };

            let exResult;
            if (mod.examen.id) {
              exResult = await this.supabaseSvc.cliente.from('examenes').update(examenData).eq('id', mod.examen.id).select().single();
            } else {
              exResult = await this.supabaseSvc.crearExamen(examenData);
              if (exResult.data) mod.examen.id = exResult.data.id;
            }

            const examenId = exResult.data.id;

            // Borrar preguntas anteriores y sincronizar nuevas
            await this.supabaseSvc.cliente.from('preguntas').delete().eq('examen_id', examenId);
            const preguntasFinales = mod.examen.preguntas.map(p => ({
              examen_id: examenId,
              enunciado: p.pregunta,
              opciones: p.opciones,
              respuesta_correcta: p.respuesta_correcta
            }));
            await this.supabaseSvc.guardarPreguntas(preguntasFinales);
          } else if (mod.examen.id) {
            // Si el examen existe en DB pero ya no tiene preguntas, lo borramos
            await this.supabaseSvc.eliminarExamen(mod.examen.id);
            delete mod.examen;
          }
        }
      }

      if (!this.cursoId || this.cursoId === 'nuevo') {
        this.cursoId = nuevoCursoId;
        this.router.navigate(['/constructor-curso', this.cursoId]);
      }
    } catch (error) {
      console.error('Error al guardar curso:', error);
      alert('Hubo un error al guardar el curso. Revisa la consola.');
    } finally {
      this.guardando = false;
    }
  }

  validarTodo(): boolean {
    // 1. Validar Formulario Principal
    if (this.cursoForm.invalid) {
      this.cursoForm.markAllAsTouched();
      alert('Por favor, completa los datos básicos del curso.');
      return false;
    }

    // 2. Validar Módulos
    if (this.modulos.length === 0) {
      alert('El curso debe tener al menos un módulo.');
      return false;
    }
    // 3. Titulo menor a 3 caracteres no es aceptado
    for (const mod of this.modulos) {
      if (!mod.titulo || mod.titulo.trim().length < 3) {
        alert(`El módulo "${mod.titulo}" necesita un título válido.`);
        return false;
      }

      // 4. El modulo debe tener al menos una leccion
      if (mod.lecciones.length === 0) {
        alert(`El módulo "${mod.titulo}" debe tener al menos una lección.`);
        return false;
      }

      // 5. Titulo menor a 3 caracteres no es aceptado  
      for (const lec of mod.lecciones) {
        if (!lec.titulo || lec.titulo.trim().length < 3) {
          alert(`Una lección del módulo "${mod.titulo}" no tiene título.`);
          return false;
        }
      }
    }

    return true;
  }

  agregarModulo() {
    const nuevoModulo: Modulo = {
      titulo: `Nuevo Módulo ${this.modulos.length + 1}`,
      orden: this.modulos.length + 1,
      descripcion: '',
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
      contenido_tipo: 'texto',
      contenido_html: '[]',
      bloques: []
    };
    modulo.lecciones.push(nuevaLeccion);
  }

  abrirEditorLeccion(moduloIndex: number, leccionIndex: number) {
    this.moduloActivoIndex = moduloIndex;
    const leccion = this.modulos[moduloIndex].lecciones[leccionIndex];

    if (!leccion.bloques) {
      try {
        leccion.bloques = JSON.parse(leccion.contenido_html || '[]');
      } catch {
        leccion.bloques = [];
      }
    }

    this.leccionActiva = { ...leccion };
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

  actualizarBloquesLeccion(bloques: BloqueContenido[]) {
    if (this.leccionActiva) {
      this.leccionActiva.bloques = bloques;
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
      this.guardando = true;
      try {
        // 1. Borrar foto anterior si existe
        const urlAnterior = this.cursoForm.get('imagen_url')?.value;
        if (urlAnterior && urlAnterior.includes('/object/public/cursos/')) {
          const rutaRelativa = urlAnterior.split('/object/public/cursos/')[1];
          if (rutaRelativa) {
            await this.supabaseSvc.eliminarImagenCurso(rutaRelativa);
          }
        }

        // 2. Subir la nueva foto
        const nombreArchivo = `${Date.now()}_${file.name.replace(/\s+/g, '_')}`;
        const ruta = `portadas/${nombreArchivo}`;

        const { data, error } = await this.supabaseSvc.subirImagenCurso(file, ruta);
        if (error) throw error;

        const urlPublica = this.supabaseSvc.obtenerUrlPublica(ruta);
        this.cursoForm.patchValue({ imagen_url: urlPublica });

        // Autoguardado: Si estamos editando un curso existente, actualizamos el campo en la DB inmediatamente
        if (this.cursoId && this.cursoId !== 'nuevo') {
          await this.supabaseSvc.cliente
            .from('cursos')
            .update({ imagen_url: urlPublica })
            .eq('id', this.cursoId);
        }
      } catch (error: any) {
        console.error('Error en la gestión de imagen:', error);
        alert(`Fallo en la imagen: ${error.message}`);
      } finally {
        this.guardando = false;
        if (event.target) event.target.value = '';
      }
    }
  }

  async eliminarModulo(index: number) {
    const modulo = this.modulos[index];

    // Si el módulo ya existe en la DB (tiene ID), borrarlo de allí
    if (modulo.id) {
      if (confirm('¿Eliminar este módulo permanentemente? Se borrarán todas sus lecciones y el quiz.')) {
        const { error } = await this.supabaseSvc.eliminarModulo(modulo.id);
        if (error) {
          alert('Error al borrar módulo en base de datos');
          return;
        }
        this.modulos.splice(index, 1);
      }
    } else {
      this.modulos.splice(index, 1);
    }
  }

  async eliminarLeccion(moduloIndex: number, leccionIndex: number) {
    const leccion = this.modulos[moduloIndex].lecciones[leccionIndex];

    // Si la lección ya existe en la DB, borrarla físicamente
    if (leccion.id) {
      if (confirm('¿Quieres eliminar esta lección para siempre?')) {
        const { error } = await this.supabaseSvc.eliminarLeccion(leccion.id);
        if (error) {
          alert('Error al borrar lección en la base de datos');
          return;
        }
        this.modulos[moduloIndex].lecciones.splice(leccionIndex, 1);
      }
    } else {
      this.modulos[moduloIndex].lecciones.splice(leccionIndex, 1);
    }
  }
}

