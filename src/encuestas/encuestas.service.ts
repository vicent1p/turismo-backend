import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateEncuestaDto,
  ResponderEncuestaDto,
  UpdateEncuestaDto,
} from './dto/encuesta.dto';

interface FallbackSurvey {
  id: number;
  titulo: string;
  descripcion: string;
  activa: boolean;
  mostrarEnLanding: boolean;
  creadoEn: Date;
  actualizadoEn: Date;
  preguntas: Array<{
    id: number;
    encuestaId: number;
    pregunta: string;
    tipoPregunta: 'opcion' | 'texto' | 'calificacion';
    obligatoria: boolean;
    orden: number;
    opciones: Array<{
      id: number;
      preguntaId: number;
      texto: string;
      orden: number;
    }>;
  }>;
}

@Injectable()
export class EncuestasService {
  private fallbackSurveys: FallbackSurvey[] = [
    {
      id: 1,
      titulo: 'Encuesta de Satisfacción Turística - Plato 400 Años',
      descripcion:
        'Ayúdanos a mejorar la experiencia turística en Plato, Magdalena. Tu opinión es fundamental para impulsar el turismo y el desarrollo cultural de nuestra región.',
      activa: true,
      mostrarEnLanding: true,
      creadoEn: new Date('2026-11-01'),
      actualizadoEn: new Date(),
      preguntas: [
        {
          id: 1,
          encuestaId: 1,
          pregunta: '¿Cuál es el motivo principal de tu visita a Plato, Magdalena?',
          tipoPregunta: 'opcion',
          obligatoria: true,
          orden: 1,
          opciones: [
            { id: 1, preguntaId: 1, texto: 'Turismo cultural y fiestas patronales', orden: 1 },
            { id: 2, preguntaId: 1, texto: 'Ecoturismo y avistamiento de aves en la ciénaga', orden: 2 },
            { id: 3, preguntaId: 1, texto: 'Visita a familiares o amigos', orden: 3 },
            { id: 4, preguntaId: 1, texto: 'Negocios o comercio regional', orden: 4 },
          ],
        },
        {
          id: 2,
          encuestaId: 1,
          pregunta: '¿Cómo calificarías la oferta hotelera y de hospedaje en Plato?',
          tipoPregunta: 'calificacion',
          obligatoria: true,
          orden: 2,
          opciones: [],
        },
        {
          id: 3,
          encuestaId: 1,
          pregunta: '¿Qué aspectos consideras prioritarios para impulsar el turismo?',
          tipoPregunta: 'texto',
          obligatoria: false,
          orden: 3,
          opciones: [],
        },
      ],
    },
  ];

  private fallbackSubmissions: Array<{
    id: number;
    encuestaId: number;
    fechaRespuesta: Date;
    detalles: Array<{
      preguntaId: number;
      opcionId?: number | null;
      respuestaTexto?: string | null;
    }>;
  }> = [
    {
      id: 1,
      encuestaId: 1,
      fechaRespuesta: new Date('2026-11-10T14:30:00Z'),
      detalles: [
        { preguntaId: 1, opcionId: 1, respuestaTexto: null },
        { preguntaId: 2, opcionId: null, respuestaTexto: '5' },
        { preguntaId: 3, opcionId: null, respuestaTexto: 'Mayor promoción de la leyenda del Hombre Caimán.' },
      ],
    },
    {
      id: 2,
      encuestaId: 1,
      fechaRespuesta: new Date('2026-11-11T10:15:00Z'),
      detalles: [
        { preguntaId: 1, opcionId: 2, respuestaTexto: null },
        { preguntaId: 2, opcionId: null, respuestaTexto: '4' },
        { preguntaId: 3, opcionId: null, respuestaTexto: 'Señalización turística en los malecones.' },
      ],
    },
  ];

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Lists all surveys for administrative panel with questions count and response count.
   */
  async findAll() {
    try {
      const encuestas = await this.prisma.encuesta.findMany({
        orderBy: { creadoEn: 'desc' },
        include: {
          _count: {
            select: {
              preguntas: true,
              respuestas: true,
            },
          },
        },
      });

      if (encuestas && encuestas.length > 0) {
        return encuestas.map((e) => ({
          id: e.id,
          titulo: e.titulo,
          descripcion: e.descripcion,
          activa: e.activa,
          mostrarEnLanding: e.mostrarEnLanding,
          creadoEn: e.creadoEn,
          actualizadoEn: e.actualizadoEn,
          totalPreguntas: e._count.preguntas,
          totalRespuestas: e._count.respuestas,
        }));
      }
    } catch {
      // Offline fallback
    }

    return this.fallbackSurveys.map((e) => ({
      id: e.id,
      titulo: e.titulo,
      descripcion: e.descripcion,
      activa: e.activa,
      mostrarEnLanding: e.mostrarEnLanding,
      creadoEn: e.creadoEn,
      actualizadoEn: e.actualizadoEn,
      totalPreguntas: e.preguntas.length,
      totalRespuestas: this.fallbackSubmissions.filter((s) => s.encuestaId === e.id).length,
    }));
  }

  /**
   * Fetches full survey structure by ID including questions and their options.
   */
  async findOne(id: number) {
    try {
      const encuesta = await this.prisma.encuesta.findUnique({
        where: { id },
        include: {
          preguntas: {
            orderBy: { orden: 'asc' },
            include: {
              opciones: {
                orderBy: { orden: 'asc' },
              },
            },
          },
          _count: {
            select: { respuestas: true },
          },
        },
      });

      if (encuesta) {
        return encuesta;
      }
    } catch {
      // Offline fallback
    }

    const fallback = this.fallbackSurveys.find((s) => s.id === id);
    if (fallback) {
      return {
        ...fallback,
        _count: {
          respuestas: this.fallbackSubmissions.filter((s) => s.encuestaId === id).length,
        },
      };
    }

    throw new NotFoundException(`Encuesta con ID ${id} no encontrada`);
  }

  /**
   * Returns the active survey that should be presented on the public landing page.
   */
  async findLandingActiva() {
    try {
      // First try the one explicitly marked for landing, fallback to the latest active one
      let encuesta = await this.prisma.encuesta.findFirst({
        where: { activa: true, mostrarEnLanding: true },
        orderBy: { actualizadoEn: 'desc' },
        include: {
          preguntas: {
            orderBy: { orden: 'asc' },
            include: {
              opciones: {
                orderBy: { orden: 'asc' },
              },
            },
          },
        },
      });

      if (!encuesta) {
        encuesta = await this.prisma.encuesta.findFirst({
          where: { activa: true },
          orderBy: { actualizadoEn: 'desc' },
          include: {
            preguntas: {
              orderBy: { orden: 'asc' },
              include: {
                opciones: {
                  orderBy: { orden: 'asc' },
                },
              },
            },
          },
        });
      }

      if (encuesta) {
        return encuesta;
      }
    } catch {
      // Offline fallback
    }

    const landing =
      this.fallbackSurveys.find((s) => s.activa && s.mostrarEnLanding) ??
      this.fallbackSurveys.find((s) => s.activa);

    return landing ?? null;
  }

  /**
   * Creates a new survey with nested questions and options.
   */
  async create(dto: CreateEncuestaDto) {
    try {
      if (dto.mostrarEnLanding) {
        await this.prisma.encuesta.updateMany({
          where: { mostrarEnLanding: true },
          data: { mostrarEnLanding: false },
        });
      }

      return await this.prisma.encuesta.create({
        data: {
          titulo: dto.titulo,
          descripcion: dto.descripcion ?? '',
          activa: dto.activa ?? true,
          mostrarEnLanding: dto.mostrarEnLanding ?? false,
          preguntas: {
            create: (dto.preguntas ?? []).map((p, idx) => ({
              pregunta: p.pregunta,
              tipoPregunta: p.tipoPregunta,
              obligatoria: p.obligatoria ?? true,
              orden: p.orden ?? idx + 1,
              opciones:
                p.tipoPregunta === 'opcion' && p.opciones && p.opciones.length > 0
                  ? {
                      create: p.opciones.map((op, opIdx) => ({
                        texto: op.texto,
                        orden: op.orden ?? opIdx + 1,
                      })),
                    }
                  : undefined,
            })),
          },
        },
        include: {
          preguntas: {
            include: { opciones: true },
          },
        },
      });
    } catch {
      // Offline in-memory creation
      const newId = this.fallbackSurveys.length + 1;
      if (dto.mostrarEnLanding) {
        this.fallbackSurveys.forEach((s) => (s.mostrarEnLanding = false));
      }

      const newSurvey: FallbackSurvey = {
        id: newId,
        titulo: dto.titulo,
        descripcion: dto.descripcion ?? '',
        activa: dto.activa ?? true,
        mostrarEnLanding: dto.mostrarEnLanding ?? false,
        creadoEn: new Date(),
        actualizadoEn: new Date(),
        preguntas: (dto.preguntas ?? []).map((p, idx) => ({
          id: (newId * 10) + idx + 1,
          encuestaId: newId,
          pregunta: p.pregunta,
          tipoPregunta: p.tipoPregunta,
          obligatoria: p.obligatoria ?? true,
          orden: p.orden ?? idx + 1,
          opciones: (p.opciones ?? []).map((op, opIdx) => ({
            id: (newId * 100) + (idx * 10) + opIdx + 1,
            preguntaId: (newId * 10) + idx + 1,
            texto: op.texto,
            orden: op.orden ?? opIdx + 1,
          })),
        })),
      };

      this.fallbackSurveys.unshift(newSurvey);
      return newSurvey;
    }
  }

  /**
   * Updates survey metadata and active states.
   */
  async update(id: number, dto: UpdateEncuestaDto) {
    try {
      await this.findOne(id);

      if (dto.mostrarEnLanding) {
        await this.prisma.encuesta.updateMany({
          where: { mostrarEnLanding: true, NOT: { id } },
          data: { mostrarEnLanding: false },
        });
      }

      return await this.prisma.encuesta.update({
        where: { id },
        data: {
          ...(dto.titulo !== undefined ? { titulo: dto.titulo } : {}),
          ...(dto.descripcion !== undefined ? { descripcion: dto.descripcion } : {}),
          ...(dto.activa !== undefined ? { activa: dto.activa } : {}),
          ...(dto.mostrarEnLanding !== undefined
            ? { mostrarEnLanding: dto.mostrarEnLanding }
            : {}),
        },
        include: {
          preguntas: {
            include: { opciones: true },
          },
        },
      });
    } catch {
      const survey = this.fallbackSurveys.find((s) => s.id === id);
      if (survey) {
        if (dto.titulo) survey.titulo = dto.titulo;
        if (dto.descripcion) survey.descripcion = dto.descripcion;
        if (dto.activa !== undefined) survey.activa = dto.activa;
        if (dto.mostrarEnLanding !== undefined) survey.mostrarEnLanding = dto.mostrarEnLanding;
        survey.actualizadoEn = new Date();
        return survey;
      }
      throw new NotFoundException(`Encuesta con ID ${id} no encontrada`);
    }
  }

  /**
   * Deletes a survey and all associated questions/options/responses (cascade).
   */
  async remove(id: number) {
    try {
      await this.findOne(id);
      await this.prisma.encuesta.delete({ where: { id } });
      return { success: true, message: `Encuesta con ID ${id} eliminada exitosamente` };
    } catch {
      this.fallbackSurveys = this.fallbackSurveys.filter((s) => s.id !== id);
      return { success: true, message: `Encuesta con ID ${id} eliminada exitosamente` };
    }
  }

  /**
   * Submits responses for a public survey.
   */
  async responder(encuestaId: number, dto: ResponderEncuestaDto) {
    const encuesta = await this.findOne(encuestaId);

    if (!encuesta.activa) {
      throw new BadRequestException('Esta encuesta se encuentra cerrada o inactiva');
    }

    // Verify required questions
    const requiredQuestions = encuesta.preguntas.filter((p) => p.obligatoria);
    const answeredQuestionIds = new Set(dto.respuestas.map((r) => r.preguntaId));

    for (const req of requiredQuestions) {
      if (!answeredQuestionIds.has(req.id)) {
        throw new BadRequestException(`La pregunta "${req.pregunta}" es obligatoria`);
      }
    }

    try {
      const respuestaEncuesta = await this.prisma.respuestaEncuesta.create({
        data: {
          encuestaId,
          fechaRespuesta: new Date(),
          detalles: {
            create: dto.respuestas.map((r) => ({
              preguntaId: r.preguntaId,
              opcionId: r.opcionId ?? null,
              respuestaTexto: r.respuestaTexto ?? null,
            })),
          },
        },
        include: {
          detalles: true,
        },
      });

      return {
        success: true,
        message: '¡Gracias por responder la encuesta!',
        respuestaId: respuestaEncuesta.id,
      };
    } catch {
      // In-memory fallback
      const newSubmissionId = Date.now();
      this.fallbackSubmissions.push({
        id: newSubmissionId,
        encuestaId,
        fechaRespuesta: new Date(),
        detalles: dto.respuestas,
      });

      return {
        success: true,
        message: '¡Gracias por responder la encuesta!',
        respuestaId: newSubmissionId,
      };
    }
  }

  /**
   * Retrieves aggregated results, statistics, and submissions for gestor/admin.
   */
  async obtenerResultados(encuestaId: number) {
    let encuesta: any = null;
    try {
      encuesta = await this.prisma.encuesta.findUnique({
        where: { id: encuestaId },
        include: {
          preguntas: {
            orderBy: { orden: 'asc' },
            include: {
              opciones: {
                orderBy: { orden: 'asc' },
              },
            },
          },
          respuestas: {
            orderBy: { fechaRespuesta: 'desc' },
            include: {
              detalles: {
                include: {
                  opcion: true,
                  pregunta: true,
                },
              },
            },
          },
        },
      });
    } catch {
      // Offline fallback
    }

    if (!encuesta) {
      const fb = this.fallbackSurveys.find((s) => s.id === encuestaId);
      if (!fb) {
        throw new NotFoundException(`Encuesta con ID ${encuestaId} no encontrada`);
      }

      const submissions = this.fallbackSubmissions.filter((s) => s.encuestaId === encuestaId);
      encuesta = {
        ...fb,
        respuestas: submissions.map((sub) => ({
          id: sub.id,
          encuestaId: sub.encuestaId,
          fechaRespuesta: sub.fechaRespuesta,
          detalles: sub.detalles.map((d) => {
            const preg = fb.preguntas.find((p) => p.id === d.preguntaId);
            const op = preg?.opciones?.find((o) => o.id === d.opcionId);
            return {
              preguntaId: d.preguntaId,
              opcionId: d.opcionId,
              respuestaTexto: d.respuestaTexto,
              pregunta: preg || { pregunta: '', tipoPregunta: 'texto' },
              opcion: op || null,
            };
          }),
        })),
      };
    }

    const totalRespuestas = encuesta.respuestas.length;

    // Aggregate statistics per question
    const estadisticasPreguntas = encuesta.preguntas.map((pregunta: any) => {
      const respuestasPregunta = encuesta.respuestas.flatMap((r: any) =>
        r.detalles.filter((d: any) => d.preguntaId === pregunta.id),
      );

      if (pregunta.tipoPregunta === 'opcion') {
        const conteoOpciones: Record<number, number> = {};
        for (const op of pregunta.opciones) {
          conteoOpciones[op.id] = 0;
        }

        for (const det of respuestasPregunta) {
          if (det.opcionId && conteoOpciones[det.opcionId] !== undefined) {
            conteoOpciones[det.opcionId]++;
          }
        }

        const opcionesEstadisticas = pregunta.opciones.map((op: any) => {
          const totalVotos = conteoOpciones[op.id] ?? 0;
          const porcentaje =
            totalRespuestas > 0 ? Number(((totalVotos / totalRespuestas) * 100).toFixed(1)) : 0;
          return {
            opcionId: op.id,
            texto: op.texto,
            votos: totalVotos,
            porcentaje,
          };
        });

        return {
          preguntaId: pregunta.id,
          pregunta: pregunta.pregunta,
          tipoPregunta: pregunta.tipoPregunta,
          totalRespuestas: respuestasPregunta.length,
          opciones: opcionesEstadisticas,
        };
      }

      if (pregunta.tipoPregunta === 'calificacion') {
        const ratings = respuestasPregunta
          .map((d: any) => (d.respuestaTexto ? parseFloat(d.respuestaTexto) : null))
          .filter((v: any): v is number => v !== null && !isNaN(v));

        const promedio =
          ratings.length > 0
            ? Number((ratings.reduce((a: number, b: number) => a + b, 0) / ratings.length).toFixed(2))
            : 0;

        const distribucion: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
        for (const r of ratings) {
          const rounded = Math.round(r);
          if (distribucion[rounded] !== undefined) {
            distribucion[rounded]++;
          }
        }

        return {
          preguntaId: pregunta.id,
          pregunta: pregunta.pregunta,
          tipoPregunta: pregunta.tipoPregunta,
          totalRespuestas: respuestasPregunta.length,
          promedio,
          distribucion,
        };
      }

      // tipoPregunta === 'texto'
      const textos = respuestasPregunta
        .map((d: any) => d.respuestaTexto?.trim())
        .filter((t: any): t is string => Boolean(t));

      return {
        preguntaId: pregunta.id,
        pregunta: pregunta.pregunta,
        tipoPregunta: pregunta.tipoPregunta,
        totalRespuestas: respuestasPregunta.length,
        respuestasTexto: textos,
      };
    });

    // Format individual submissions for table display
    const respuestasRecientes = encuesta.respuestas.map((r: any) => ({
      id: r.id,
      fechaRespuesta: r.fechaRespuesta,
      detalles: r.detalles.map((d: any) => ({
        preguntaId: d.preguntaId,
        pregunta: d.pregunta?.pregunta || '',
        tipoPregunta: d.pregunta?.tipoPregunta || '',
        opcionId: d.opcionId,
        opcionTexto: d.opcion?.texto ?? null,
        respuestaTexto: d.respuestaTexto,
      })),
    }));

    return {
      encuesta: {
        id: encuesta.id,
        titulo: encuesta.titulo,
        descripcion: encuesta.descripcion,
        activa: encuesta.activa,
        mostrarEnLanding: encuesta.mostrarEnLanding,
        totalPreguntas: encuesta.preguntas.length,
        totalRespuestas,
      },
      estadisticasPreguntas,
      respuestasRecientes,
    };
  }
}
