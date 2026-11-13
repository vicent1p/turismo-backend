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

@Injectable()
export class EncuestasService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Lists all surveys for administrative panel with questions count and response count.
   */
  async findAll() {
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

  /**
   * Fetches full survey structure by ID including questions and their options.
   */
  async findOne(id: number) {
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

    if (!encuesta) {
      throw new NotFoundException(`Encuesta con ID ${id} no encontrada`);
    }

    return encuesta;
  }

  /**
   * Returns the active survey that should be presented on the public landing page.
   */
  async findLandingActiva() {
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

    return encuesta;
  }

  /**
   * Creates a new survey with nested questions and options.
   */
  async create(dto: CreateEncuestaDto) {
    if (dto.mostrarEnLanding) {
      // Unmark any previous survey marked for landing so only one is active on landing
      await this.prisma.encuesta.updateMany({
        where: { mostrarEnLanding: true },
        data: { mostrarEnLanding: false },
      });
    }

    return this.prisma.encuesta.create({
      data: {
        titulo: dto.titulo,
        descripcion: dto.descripcion,
        activa: dto.activa ?? true,
        mostrarEnLanding: dto.mostrarEnLanding ?? false,
        preguntas: {
          create: (dto.preguntas ?? []).map((p, pIndex) => ({
            pregunta: p.pregunta,
            tipoPregunta: p.tipoPregunta,
            obligatoria: p.obligatoria ?? true,
            orden: p.orden ?? pIndex,
            opciones: {
              create: (p.opciones ?? []).map((o, oIndex) => ({
                texto: o.texto,
                orden: o.orden ?? oIndex,
              })),
            },
          })),
        },
      },
      include: {
        preguntas: {
          include: { opciones: true },
        },
      },
    });
  }

  /**
   * Updates an existing survey and optionally recreates/updates questions.
   */
  async update(id: number, dto: UpdateEncuestaDto) {
    await this.findOne(id);

    if (dto.mostrarEnLanding) {
      await this.prisma.encuesta.updateMany({
        where: { id: { not: id }, mostrarEnLanding: true },
        data: { mostrarEnLanding: false },
      });
    }

    return this.prisma.$transaction(async (tx) => {
      if (dto.preguntas) {
        // Remove old questions to replace with updated list
        await tx.pregunta.deleteMany({ where: { encuestaId: id } });
      }

      return tx.encuesta.update({
        where: { id },
        data: {
          titulo: dto.titulo,
          descripcion: dto.descripcion,
          activa: dto.activa,
          mostrarEnLanding: dto.mostrarEnLanding,
          ...(dto.preguntas && {
            preguntas: {
              create: dto.preguntas.map((p, pIndex) => ({
                pregunta: p.pregunta,
                tipoPregunta: p.tipoPregunta,
                obligatoria: p.obligatoria ?? true,
                orden: p.orden ?? pIndex,
                opciones: {
                  create: (p.opciones ?? []).map((o, oIndex) => ({
                    texto: o.texto,
                    orden: o.orden ?? oIndex,
                  })),
                },
              })),
            },
          }),
        },
        include: {
          preguntas: {
            include: { opciones: true },
          },
        },
      });
    });
  }

  /**
   * Deletes a survey.
   */
  async remove(id: number) {
    await this.findOne(id);
    await this.prisma.encuesta.delete({ where: { id } });
    return { success: true, message: `Encuesta ${id} eliminada correctamente` };
  }

  /**
   * Public endpoint to submit citizen/tourist responses to a survey.
   */
  async responder(encuestaId: number, dto: ResponderEncuestaDto) {
    const encuesta = await this.prisma.encuesta.findUnique({
      where: { id: encuestaId },
      include: {
        preguntas: true,
      },
    });

    if (!encuesta) {
      throw new NotFoundException(`Encuesta con ID ${encuestaId} no encontrada`);
    }

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
  }

  /**
   * Retrieves aggregated results, statistics, and submissions for gestor/admin.
   */
  async obtenerResultados(encuestaId: number) {
    const encuesta = await this.prisma.encuesta.findUnique({
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

    if (!encuesta) {
      throw new NotFoundException(`Encuesta con ID ${encuestaId} no encontrada`);
    }

    const totalRespuestas = encuesta.respuestas.length;

    // Aggregate statistics per question
    const estadisticasPreguntas = encuesta.preguntas.map((pregunta) => {
      // Find all answer details for this specific question
      const respuestasPregunta = encuesta.respuestas.flatMap((r) =>
        r.detalles.filter((d) => d.preguntaId === pregunta.id),
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

        const opcionesEstadisticas = pregunta.opciones.map((op) => {
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
          .map((d) => (d.respuestaTexto ? parseFloat(d.respuestaTexto) : null))
          .filter((v): v is number => v !== null && !isNaN(v));

        const promedio =
          ratings.length > 0
            ? Number((ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(2))
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
        .map((d) => d.respuestaTexto?.trim())
        .filter((t): t is string => Boolean(t));

      return {
        preguntaId: pregunta.id,
        pregunta: pregunta.pregunta,
        tipoPregunta: pregunta.tipoPregunta,
        totalRespuestas: respuestasPregunta.length,
        respuestasTexto: textos,
      };
    });

    // Format individual submissions for table display
    const respuestasRecientes = encuesta.respuestas.map((r) => ({
      id: r.id,
      fechaRespuesta: r.fechaRespuesta,
      detalles: r.detalles.map((d) => ({
        preguntaId: d.preguntaId,
        pregunta: d.pregunta.pregunta,
        tipoPregunta: d.pregunta.tipoPregunta,
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

