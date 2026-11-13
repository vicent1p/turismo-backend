-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "Rol" AS ENUM ('ADMIN', 'GESTOR');

-- CreateEnum
CREATE TYPE "TipoTarjeta" AS ENUM ('HOTEL', 'CABANA', 'RESTAURANTE');

-- CreateTable
CREATE TABLE "usuarios" (
    "id" TEXT NOT NULL,
    "correo" TEXT NOT NULL,
    "nombreCompleto" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "rol" "Rol" NOT NULL DEFAULT 'GESTOR',
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "usuarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "municipios" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "ciudad" TEXT,
    "departamento" TEXT NOT NULL DEFAULT 'Magdalena',

    CONSTRAINT "municipios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hoteles" (
    "id" TEXT NOT NULL,
    "tipo" "TipoTarjeta" NOT NULL DEFAULT 'HOTEL',
    "nombre" TEXT NOT NULL,
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
    "municipioId" TEXT,
    "creadoPorId" TEXT,

    CONSTRAINT "hoteles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "servicios" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "nombreEn" TEXT,
    "icono" TEXT,

    CONSTRAINT "servicios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hotel_servicios" (
    "hotelId" TEXT NOT NULL,
    "servicioId" TEXT NOT NULL,

    CONSTRAINT "hotel_servicios_pkey" PRIMARY KEY ("hotelId","servicioId")
);

-- CreateTable
CREATE TABLE "hotel_fotos" (
    "id" TEXT NOT NULL,
    "hotelId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "orden" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "hotel_fotos_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_correo_key" ON "usuarios"("correo");

-- CreateIndex
CREATE UNIQUE INDEX "municipios_nombre_key" ON "municipios"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "servicios_nombre_key" ON "servicios"("nombre");

-- AddForeignKey
ALTER TABLE "hoteles" ADD CONSTRAINT "hoteles_municipioId_fkey" FOREIGN KEY ("municipioId") REFERENCES "municipios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hoteles" ADD CONSTRAINT "hoteles_creadoPorId_fkey" FOREIGN KEY ("creadoPorId") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hotel_servicios" ADD CONSTRAINT "hotel_servicios_hotelId_fkey" FOREIGN KEY ("hotelId") REFERENCES "hoteles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hotel_servicios" ADD CONSTRAINT "hotel_servicios_servicioId_fkey" FOREIGN KEY ("servicioId") REFERENCES "servicios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hotel_fotos" ADD CONSTRAINT "hotel_fotos_hotelId_fkey" FOREIGN KEY ("hotelId") REFERENCES "hoteles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

