import { BadRequestException, NotFoundException } from '@nestjs/common';
import { EncuestasService } from './encuestas.service';
import { PrismaService } from '../prisma/prisma.service';
import { TipoPregunta } from '@prisma/client';

describe('EncuestasService', () => {
  let service: EncuestasService;
  let mockPrisma: any;

  beforeEach(() => {
    mockPrisma = {
      encuesta: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        updateMany: jest.fn(),
        delete: jest.fn(),
      },
      respuestaEncuesta: {
        create: jest.fn(),
      },
      pregunta: {
        deleteMany: jest.fn(),
      },
      $transaction: jest.fn((cb) => cb(mockPrisma)),
    };

    service = new EncuestasService(mockPrisma as unknown as PrismaService);
  });

  it('findAll lists all surveys with formatted counters', async () => {
    mockPrisma.encuesta.findMany.mockResolvedValueOnce([
      {
        id: 1,
        titulo: 'Encuesta 1',
        descripcion: 'Desc',
        activa: true,
        mostrarEnLanding: true,
        creadoEn: new Date(),
        actualizadoEn: new Date(),
        _count: { preguntas: 3, respuestas: 10 },
      },
    ]);

    const res = await service.findAll();
    expect(res).toHaveLength(1);
    expect(res[0].totalPreguntas).toBe(3);
    expect(res[0].totalRespuestas).toBe(10);
  });

  it('findOne throws NotFoundException when survey does not exist', async () => {
    mockPrisma.encuesta.findUnique.mockResolvedValueOnce(null);

    await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
  });

  it('create saves new survey and unsets other landing flags if requested', async () => {
    mockPrisma.encuesta.updateMany.mockResolvedValueOnce({ count: 1 });
    mockPrisma.encuesta.create.mockResolvedValueOnce({
      id: 2,
      titulo: 'Nueva Encuesta',
      activa: true,
      mostrarEnLanding: true,
      preguntas: [],
    });

    const result = await service.create({
      titulo: 'Nueva Encuesta',
      mostrarEnLanding: true,
      preguntas: [
        {
          pregunta: '¿Pregunta 1?',
          tipoPregunta: TipoPregunta.opcion,
          opciones: [{ texto: 'Opción A' }],
        },
      ],
    });

    expect(mockPrisma.encuesta.updateMany).toHaveBeenCalledWith({
      where: { mostrarEnLanding: true },
      data: { mostrarEnLanding: false },
    });
    expect(mockPrisma.encuesta.create).toHaveBeenCalled();
    expect(result.id).toBe(2);
  });

  it('responder validates required questions and records answers', async () => {
    mockPrisma.encuesta.findUnique.mockResolvedValueOnce({
      id: 1,
      activa: true,
      preguntas: [
        { id: 10, pregunta: '¿Obligatoria?', obligatoria: true },
      ],
    });

    await expect(
      service.responder(1, { respuestas: [] }),
    ).rejects.toThrow(BadRequestException);

    mockPrisma.encuesta.findUnique.mockResolvedValueOnce({
      id: 1,
      activa: true,
      preguntas: [
        { id: 10, pregunta: '¿Obligatoria?', obligatoria: true },
      ],
    });
    mockPrisma.respuestaEncuesta.create.mockResolvedValueOnce({
      id: 100,
      encuestaId: 1,
      detalles: [],
    });

    const submitRes = await service.responder(1, {
      respuestas: [{ preguntaId: 10, respuestaTexto: 'Respuesta válida' }],
    });

    expect(submitRes.success).toBe(true);
    expect(submitRes.respuestaId).toBe(100);
  });

  it('obtenerResultados aggregates options, ratings and text questions correctly', async () => {
    mockPrisma.encuesta.findUnique.mockResolvedValueOnce({
      id: 1,
      titulo: 'Encuesta de Prueba',
      descripcion: 'Detalle',
      activa: true,
      mostrarEnLanding: true,
      preguntas: [
        {
          id: 1,
          pregunta: '¿Calificación?',
          tipoPregunta: 'calificacion',
          opciones: [],
        },
        {
          id: 2,
          pregunta: '¿Preferencia?',
          tipoPregunta: 'opcion',
          opciones: [
            { id: 101, texto: 'Opción 1' },
            { id: 102, texto: 'Opción 2' },
          ],
        },
        {
          id: 3,
          pregunta: '¿Comentarios?',
          tipoPregunta: 'texto',
          opciones: [],
        },
      ],
      respuestas: [
        {
          id: 1,
          fechaRespuesta: new Date(),
          detalles: [
            { preguntaId: 1, respuestaTexto: '5', opcionId: null, pregunta: { pregunta: '¿Calificación?', tipoPregunta: 'calificacion' }, opcion: null },
            { preguntaId: 2, respuestaTexto: null, opcionId: 101, pregunta: { pregunta: '¿Preferencia?', tipoPregunta: 'opcion' }, opcion: { texto: 'Opción 1' } },
            { preguntaId: 3, respuestaTexto: 'Excelente', opcionId: null, pregunta: { pregunta: '¿Comentarios?', tipoPregunta: 'texto' }, opcion: null },
          ],
        },
      ],
    });

    const metrics = await service.obtenerResultados(1);
    expect(metrics.encuesta.totalRespuestas).toBe(1);
    expect(metrics.estadisticasPreguntas).toHaveLength(3);

    // Rating question
    const ratingStats = metrics.estadisticasPreguntas[0] as any;
    expect(ratingStats.promedio).toBe(5);

    // Option question
    const optStats = metrics.estadisticasPreguntas[1] as any;
    expect(optStats.opciones[0].votos).toBe(1);
    expect(optStats.opciones[0].porcentaje).toBe(100);
  });
});

