-- CreateEnum
CREATE TYPE "PlataformaRedSocial" AS ENUM ('Instagram', 'Facebook', 'TikTok', 'X', 'YouTube');

-- CreateEnum
CREATE TYPE "TipoPregunta" AS ENUM ('opcion', 'texto', 'calificacion');

-- DropForeignKey
ALTER TABLE IF EXISTS "hotel_servicios" DROP CONSTRAINT IF EXISTS "hotel_servicios_hotelId_fkey";
ALTER TABLE IF EXISTS "hotel_servicios" DROP CONSTRAINT IF EXISTS "hotel_servicios_servicioId_fkey";
ALTER TABLE IF EXISTS "hotel_fotos" DROP CONSTRAINT IF EXISTS "hotel_fotos_hotelId_fkey";
ALTER TABLE IF EXISTS "hoteles" DROP CONSTRAINT IF EXISTS "hoteles_creadoPorId_fkey";
ALTER TABLE IF EXISTS "hoteles" DROP CONSTRAINT IF EXISTS "hoteles_municipioId_fkey";

-- Drop old tables if transforming to new schema
DROP TABLE IF EXISTS "hotel_servicios";
DROP TABLE IF EXISTS "hotel_fotos";
DROP TABLE IF EXISTS "hoteles";

-- AlterTable usuarios to int autoincrement and new columns
DROP TABLE IF EXISTS "usuarios" CASCADE;
CREATE TABLE "usuarios" (
    "id" SERIAL NOT NULL,
    "correo" TEXT NOT NULL,
    "nombreCompleto" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "rol" "Rol" NOT NULL DEFAULT 'GESTOR',
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "debeCambiarPassword" BOOLEAN NOT NULL DEFAULT false,
    "ultimoAcceso" TIMESTAMP(3),
    "eliminadoEn" TIMESTAMP(3),
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "usuarios_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "usuarios_correo_key" ON "usuarios"("correo");

-- AlterTable servicios to int autoincrement
DROP TABLE IF EXISTS "servicios" CASCADE;
CREATE TABLE "servicios" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "nombreEn" TEXT,
    "icono" TEXT,
    "tipo" "TipoTarjeta",

    CONSTRAINT "servicios_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "servicios_nombre_key" ON "servicios"("nombre");

-- CreateTable establecimientos
CREATE TABLE "establecimientos" (
    "id" SERIAL NOT NULL,
    "tipo" "TipoTarjeta" NOT NULL DEFAULT 'HOTEL',
    "nombre" TEXT NOT NULL,
    "municipioCodigo" TEXT NOT NULL DEFAULT '47001',
    "estrellas" INTEGER NOT NULL DEFAULT 3,
    "resena" TEXT,
    "resenaEn" TEXT,
    "whatsapp" TEXT,
    "telefonoContacto" TEXT,
    "instagramUrl" TEXT,
    "facebookUrl" TEXT,
    "xUrl" TEXT,
    "direccion" TEXT,
    "ubicacionUrl" TEXT,
    "latitud" DOUBLE PRECISION,
    "longitud" DOUBLE PRECISION,
    "disponible" BOOLEAN NOT NULL DEFAULT true,
    "eliminadoEn" TIMESTAMP(3),
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,
    "usuarioId" INTEGER,

    CONSTRAINT "establecimientos_pkey" PRIMARY KEY ("id")
);

-- CreateTable redes_sociales
CREATE TABLE "redes_sociales" (
    "id" SERIAL NOT NULL,
    "establecimientoId" INTEGER NOT NULL,
    "plataforma" "PlataformaRedSocial" NOT NULL,
    "url" TEXT NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "redes_sociales_pkey" PRIMARY KEY ("id")
);

-- CreateTable establecimiento_fotos
CREATE TABLE "establecimiento_fotos" (
    "id" SERIAL NOT NULL,
    "establecimientoId" INTEGER NOT NULL,
    "url" TEXT NOT NULL,
    "orden" INTEGER NOT NULL DEFAULT 0,
    "esPortada" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "establecimiento_fotos_pkey" PRIMARY KEY ("id")
);

-- CreateTable establecimiento_servicios
CREATE TABLE "establecimiento_servicios" (
    "establecimientoId" INTEGER NOT NULL,
    "servicioId" INTEGER NOT NULL,

    CONSTRAINT "establecimiento_servicios_pkey" PRIMARY KEY ("establecimientoId","servicioId")
);

-- CreateTable encuestas
CREATE TABLE "encuestas" (
    "id" SERIAL NOT NULL,
    "titulo" TEXT NOT NULL,
    "descripcion" TEXT,
    "activa" BOOLEAN NOT NULL DEFAULT true,
    "mostrarEnLanding" BOOLEAN NOT NULL DEFAULT false,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "encuestas_pkey" PRIMARY KEY ("id")
);

-- CreateTable preguntas
CREATE TABLE "preguntas" (
    "id" SERIAL NOT NULL,
    "encuestaId" INTEGER NOT NULL,
    "pregunta" TEXT NOT NULL,
    "tipoPregunta" "TipoPregunta" NOT NULL DEFAULT 'opcion',
    "obligatoria" BOOLEAN NOT NULL DEFAULT true,
    "orden" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "preguntas_pkey" PRIMARY KEY ("id")
);

-- CreateTable opciones_pregunta
CREATE TABLE "opciones_pregunta" (
    "id" SERIAL NOT NULL,
    "preguntaId" INTEGER NOT NULL,
    "texto" TEXT NOT NULL,
    "orden" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "opciones_pregunta_pkey" PRIMARY KEY ("id")
);

-- CreateTable respuestas_encuesta
CREATE TABLE "respuestas_encuesta" (
    "id" SERIAL NOT NULL,
    "encuestaId" INTEGER NOT NULL,
    "fechaRespuesta" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "respuestas_encuesta_pkey" PRIMARY KEY ("id")
);

-- CreateTable detalle_respuestas
CREATE TABLE "detalle_respuestas" (
    "id" SERIAL NOT NULL,
    "respuestaEncuestaId" INTEGER NOT NULL,
    "preguntaId" INTEGER NOT NULL,
    "opcionId" INTEGER,
    "respuestaTexto" TEXT,

    CONSTRAINT "detalle_respuestas_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "establecimientos" ADD CONSTRAINT "establecimientos_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "redes_sociales" ADD CONSTRAINT "redes_sociales_establecimientoId_fkey" FOREIGN KEY ("establecimientoId") REFERENCES "establecimientos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "establecimiento_fotos" ADD CONSTRAINT "establecimiento_fotos_establecimientoId_fkey" FOREIGN KEY ("establecimientoId") REFERENCES "establecimientos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "establecimiento_servicios" ADD CONSTRAINT "establecimiento_servicios_establecimientoId_fkey" FOREIGN KEY ("establecimientoId") REFERENCES "establecimientos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "establecimiento_servicios" ADD CONSTRAINT "establecimiento_servicios_servicioId_fkey" FOREIGN KEY ("servicioId") REFERENCES "servicios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "preguntas" ADD CONSTRAINT "preguntas_encuestaId_fkey" FOREIGN KEY ("encuestaId") REFERENCES "encuestas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "opciones_pregunta" ADD CONSTRAINT "opciones_pregunta_preguntaId_fkey" FOREIGN KEY ("preguntaId") REFERENCES "preguntas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "respuestas_encuesta" ADD CONSTRAINT "respuestas_encuesta_encuestaId_fkey" FOREIGN KEY ("encuestaId") REFERENCES "encuestas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "detalle_respuestas" ADD CONSTRAINT "detalle_respuestas_respuestaEncuestaId_fkey" FOREIGN KEY ("respuestaEncuestaId") REFERENCES "respuestas_encuesta"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "detalle_respuestas" ADD CONSTRAINT "detalle_respuestas_preguntaId_fkey" FOREIGN KEY ("preguntaId") REFERENCES "preguntas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "detalle_respuestas" ADD CONSTRAINT "detalle_respuestas_opcionId_fkey" FOREIGN KEY ("opcionId") REFERENCES "opciones_pregunta"("id") ON DELETE SET NULL ON UPDATE CASCADE;

