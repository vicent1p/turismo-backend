-- ==============================================================================
-- DUMP SQL COMPLETO CON TODOS LOS HOTELES Y DATOS REALES DE LA BASE DE DATOS LOCAL
-- Base de datos: turismo_2027 | Total Establecimientos: 31 (incluyendo los 19 hoteles creados)
-- Generado: 2026-11-17T15:41:11.714Z
-- ==============================================================================

-- 1. TIPOS ENUMERADOS
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'Rol') THEN CREATE TYPE "Rol" AS ENUM ('ADMIN', 'GESTOR'); END IF; END $$;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'TipoTarjeta') THEN CREATE TYPE "TipoTarjeta" AS ENUM ('HOTEL', 'CABANA', 'RESTAURANTE'); END IF; END $$;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'PlataformaRedSocial') THEN CREATE TYPE "PlataformaRedSocial" AS ENUM ('Instagram', 'Facebook', 'TikTok', 'X', 'YouTube'); END IF; END $$;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'TipoPregunta') THEN CREATE TYPE "TipoPregunta" AS ENUM ('opcion', 'texto', 'calificacion'); END IF; END $$;

-- 2. TABLAS
CREATE TABLE IF NOT EXISTS "usuarios" (
    "id" SERIAL PRIMARY KEY,
    "correo" TEXT NOT NULL UNIQUE,
    "nombreCompleto" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "rol" "Rol" NOT NULL DEFAULT 'GESTOR',
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "debeCambiarPassword" BOOLEAN NOT NULL DEFAULT false,
    "ultimoAcceso" TIMESTAMP(3),
    "eliminadoEn" TIMESTAMP(3),
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "municipios" (
    "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "codigo" TEXT UNIQUE,
    "nombre" TEXT NOT NULL UNIQUE,
    "ciudad" TEXT,
    "departamento" TEXT NOT NULL DEFAULT 'Magdalena'
);

CREATE TABLE IF NOT EXISTS "servicios" (
    "id" SERIAL PRIMARY KEY,
    "nombre" TEXT NOT NULL UNIQUE,
    "nombreEn" TEXT,
    "icono" TEXT,
    "tipo" "TipoTarjeta"
);

CREATE TABLE IF NOT EXISTS "establecimientos" (
    "id" SERIAL PRIMARY KEY,
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
    "actualizadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "usuarioId" INTEGER REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "redes_sociales" (
    "id" SERIAL PRIMARY KEY,
    "establecimientoId" INTEGER NOT NULL REFERENCES "establecimientos"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    "plataforma" "PlataformaRedSocial" NOT NULL,
    "url" TEXT NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "establecimiento_fotos" (
    "id" SERIAL PRIMARY KEY,
    "establecimientoId" INTEGER NOT NULL REFERENCES "establecimientos"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    "url" TEXT NOT NULL,
    "orden" INTEGER NOT NULL DEFAULT 0,
    "esPortada" BOOLEAN NOT NULL DEFAULT false
);

CREATE TABLE IF NOT EXISTS "establecimiento_servicios" (
    "establecimientoId" INTEGER NOT NULL REFERENCES "establecimientos"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    "servicioId" INTEGER NOT NULL REFERENCES "servicios"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    PRIMARY KEY ("establecimientoId", "servicioId")
);

CREATE TABLE IF NOT EXISTS "encuestas" (
    "id" SERIAL PRIMARY KEY,
    "titulo" TEXT NOT NULL,
    "descripcion" TEXT,
    "activa" BOOLEAN NOT NULL DEFAULT true,
    "mostrarEnLanding" BOOLEAN NOT NULL DEFAULT false,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "preguntas" (
    "id" SERIAL PRIMARY KEY,
    "encuestaId" INTEGER NOT NULL REFERENCES "encuestas"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    "pregunta" TEXT NOT NULL,
    "tipoPregunta" "TipoPregunta" NOT NULL DEFAULT 'opcion',
    "obligatoria" BOOLEAN NOT NULL DEFAULT true,
    "orden" INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS "opciones_pregunta" (
    "id" SERIAL PRIMARY KEY,
    "preguntaId" INTEGER NOT NULL REFERENCES "preguntas"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    "texto" TEXT NOT NULL,
    "orden" INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS "respuestas_encuesta" (
    "id" SERIAL PRIMARY KEY,
    "encuestaId" INTEGER NOT NULL REFERENCES "encuestas"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    "fechaRespuesta" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "detalle_respuestas" (
    "id" SERIAL PRIMARY KEY,
    "respuestaEncuestaId" INTEGER NOT NULL REFERENCES "respuestas_encuesta"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    "preguntaId" INTEGER NOT NULL REFERENCES "preguntas"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    "opcionId" INTEGER REFERENCES "opciones_pregunta"("id") ON DELETE SET NULL ON UPDATE CASCADE,
    "respuestaTexto" TEXT
);

-- ==============================================================================
-- 3. INSERCIÓN DE DATOS REALES
-- ==============================================================================

-- 3.1. USUARIOS
INSERT INTO "usuarios" ("id", "correo", "nombreCompleto", "passwordHash", "rol", "activo", "debeCambiarPassword", "ultimoAcceso", "eliminadoEn", "creadoEn", "actualizadoEn") VALUES (1, 'admin@turismo.magdalena.gov.co', 'Administrador del Sistema', 'scrypt$661b227a734cb7f729652cae2914431a$d856d003c7a31235b0d0f761498bb35b25fc5b60d8aea26af6ddd9bc178a36ad6840891665745f16f3aaf368e5b38168a1a53265ed4145e287ebc06870374d2a', 'ADMIN', true, false, '2026-11-16T06:32:33.687Z', NULL, '2026-11-13T10:48:55.392Z', '2026-11-16T06:32:33.692Z') ON CONFLICT ("id") DO UPDATE SET "nombreCompleto" = EXCLUDED."nombreCompleto", "passwordHash" = EXCLUDED."passwordHash";
INSERT INTO "usuarios" ("id", "correo", "nombreCompleto", "passwordHash", "rol", "activo", "debeCambiarPassword", "ultimoAcceso", "eliminadoEn", "creadoEn", "actualizadoEn") VALUES (2, 'gestor@turismo.magdalena.gov.co', 'Gestor de Turismo y Contenidos', 'scrypt$1061cdf0e903798e2310dfdd81b7212d$13f61a68dde20d89ce27bdec7544a37f19ce908e84e2a11388b0958967bf0c8a3d2855cdac2ab8384f20539ba9274e570cec2af9f01f1a4f68a0e66b47b3026e', 'GESTOR', true, false, '2026-11-13T11:28:55.035Z', NULL, '2026-11-13T10:48:55.570Z', '2026-11-13T11:28:55.038Z') ON CONFLICT ("id") DO UPDATE SET "nombreCompleto" = EXCLUDED."nombreCompleto", "passwordHash" = EXCLUDED."passwordHash";
SELECT setval('usuarios_id_seq', (SELECT COALESCE(MAX(id), 1) FROM "usuarios"));

-- 3.2. MUNICIPIOS
INSERT INTO "municipios" ("id", "codigo", "nombre", "ciudad", "departamento") VALUES ('3e917170-7fda-4896-b67b-b591199f7a4f', NULL, 'Aracataca', 'Aracataca', 'Magdalena') ON CONFLICT ("nombre") DO NOTHING;
INSERT INTO "municipios" ("id", "codigo", "nombre", "ciudad", "departamento") VALUES ('58b1c188-5c7e-4871-8eab-71b2db751aa0', NULL, 'Chibolo', 'Chibolo', 'Magdalena') ON CONFLICT ("nombre") DO NOTHING;
INSERT INTO "municipios" ("id", "codigo", "nombre", "ciudad", "departamento") VALUES ('75349381-fccc-4609-88cd-3d1f3fcdd01f', NULL, 'Ciénaga', 'Ciénaga', 'Magdalena') ON CONFLICT ("nombre") DO NOTHING;
INSERT INTO "municipios" ("id", "codigo", "nombre", "ciudad", "departamento") VALUES ('0e701d7a-f095-4698-9329-4d747b35bf11', NULL, 'Concordia', 'Concordia', 'Magdalena') ON CONFLICT ("nombre") DO NOTHING;
INSERT INTO "municipios" ("id", "codigo", "nombre", "ciudad", "departamento") VALUES ('5c4b1a85-38a9-4c7a-b41b-bf0f02dadb25', NULL, 'El Banco', 'El Banco', 'Magdalena') ON CONFLICT ("nombre") DO NOTHING;
INSERT INTO "municipios" ("id", "codigo", "nombre", "ciudad", "departamento") VALUES ('00f9040e-3a99-4e6f-9fdb-e07add524ad6', NULL, 'Fundación', 'Fundación', 'Magdalena') ON CONFLICT ("nombre") DO NOTHING;
INSERT INTO "municipios" ("id", "codigo", "nombre", "ciudad", "departamento") VALUES ('1fb2e942-4ae9-4817-9688-e241149da2a6', NULL, 'Guamal', 'Guamal', 'Magdalena') ON CONFLICT ("nombre") DO NOTHING;
INSERT INTO "municipios" ("id", "codigo", "nombre", "ciudad", "departamento") VALUES ('16a1349c-a55d-4443-97cc-ee88a8ec8ee7', NULL, 'Nueva Granada', 'Nueva Granada', 'Magdalena') ON CONFLICT ("nombre") DO NOTHING;
INSERT INTO "municipios" ("id", "codigo", "nombre", "ciudad", "departamento") VALUES ('de00469a-5321-438d-959a-f89e597bcb36', NULL, 'Pivijay', 'Pivijay', 'Magdalena') ON CONFLICT ("nombre") DO NOTHING;
INSERT INTO "municipios" ("id", "codigo", "nombre", "ciudad", "departamento") VALUES ('e3a7bb79-4c11-425b-a98b-5c05dfbad8c4', NULL, 'Plato', 'Plato', 'Magdalena') ON CONFLICT ("nombre") DO NOTHING;
INSERT INTO "municipios" ("id", "codigo", "nombre", "ciudad", "departamento") VALUES ('aa72b7c6-c39b-455f-aabb-0a88e316ebef', NULL, 'Remolino', 'Remolino', 'Magdalena') ON CONFLICT ("nombre") DO NOTHING;
INSERT INTO "municipios" ("id", "codigo", "nombre", "ciudad", "departamento") VALUES ('6ed540c6-bd46-41de-b5b9-1928fc0b3ffb', NULL, 'Salamina', 'Salamina', 'Magdalena') ON CONFLICT ("nombre") DO NOTHING;
INSERT INTO "municipios" ("id", "codigo", "nombre", "ciudad", "departamento") VALUES ('f710eae6-9808-4a87-b0de-3b24344f3a5a', NULL, 'San Sebastián de Buenavista', 'San Sebastián de Buenavista', 'Magdalena') ON CONFLICT ("nombre") DO NOTHING;
INSERT INTO "municipios" ("id", "codigo", "nombre", "ciudad", "departamento") VALUES ('e3527fdb-0dae-4038-9548-f1a9f40877d5', NULL, 'Santa Marta', 'Santa Marta', 'Magdalena') ON CONFLICT ("nombre") DO NOTHING;
INSERT INTO "municipios" ("id", "codigo", "nombre", "ciudad", "departamento") VALUES ('29128433-3c95-45f6-8294-d6607bbf13bb', NULL, 'Sitio Nuevo', 'Sitio Nuevo', 'Magdalena') ON CONFLICT ("nombre") DO NOTHING;
INSERT INTO "municipios" ("id", "codigo", "nombre", "ciudad", "departamento") VALUES ('92fe3f76-a531-4a20-b5f0-008b4bfe5f76', NULL, 'Tenerife', 'Tenerife', 'Magdalena') ON CONFLICT ("nombre") DO NOTHING;
INSERT INTO "municipios" ("id", "codigo", "nombre", "ciudad", "departamento") VALUES ('b1fceeb9-8c3e-434d-995c-c8cc0d539119', NULL, 'Zona Bananera', 'Zona Bananera', 'Magdalena') ON CONFLICT ("nombre") DO NOTHING;

-- 3.3. SERVICIOS
INSERT INTO "servicios" ("id", "nombre", "nombreEn", "icono", "tipo") VALUES (1, 'Piscina', 'Pool', 'pool', NULL) ON CONFLICT ("id") DO NOTHING;
INSERT INTO "servicios" ("id", "nombre", "nombreEn", "icono", "tipo") VALUES (2, 'Aire acondicionado', 'Air Conditioning', 'ac', NULL) ON CONFLICT ("id") DO NOTHING;
INSERT INTO "servicios" ("id", "nombre", "nombreEn", "icono", "tipo") VALUES (3, 'Parqueadero privado', 'Private Parking', 'parking', NULL) ON CONFLICT ("id") DO NOTHING;
INSERT INTO "servicios" ("id", "nombre", "nombreEn", "icono", "tipo") VALUES (4, 'Parqueadero', 'Parking', 'parking', NULL) ON CONFLICT ("id") DO NOTHING;
INSERT INTO "servicios" ("id", "nombre", "nombreEn", "icono", "tipo") VALUES (5, 'Wifi de alta velocidad', 'High-Speed Wi-Fi', 'wifi', NULL) ON CONFLICT ("id") DO NOTHING;
INSERT INTO "servicios" ("id", "nombre", "nombreEn", "icono", "tipo") VALUES (6, 'Wifi', 'Wi-Fi', 'wifi', NULL) ON CONFLICT ("id") DO NOTHING;
INSERT INTO "servicios" ("id", "nombre", "nombreEn", "icono", "tipo") VALUES (7, 'Restaurante / Bar', 'Restaurant / Bar', 'restaurant', NULL) ON CONFLICT ("id") DO NOTHING;
INSERT INTO "servicios" ("id", "nombre", "nombreEn", "icono", "tipo") VALUES (8, 'Restaurante', 'Restaurant', 'restaurant', NULL) ON CONFLICT ("id") DO NOTHING;
INSERT INTO "servicios" ("id", "nombre", "nombreEn", "icono", "tipo") VALUES (9, 'Vista al río', 'River View', 'river_view', NULL) ON CONFLICT ("id") DO NOTHING;
INSERT INTO "servicios" ("id", "nombre", "nombreEn", "icono", "tipo") VALUES (10, 'Zona campestre', 'Countryside Area', 'countryside', NULL) ON CONFLICT ("id") DO NOTHING;
INSERT INTO "servicios" ("id", "nombre", "nombreEn", "icono", "tipo") VALUES (11, 'Recepción 24 horas', '24-Hour Front Desk', 'front_desk', NULL) ON CONFLICT ("id") DO NOTHING;
INSERT INTO "servicios" ("id", "nombre", "nombreEn", "icono", "tipo") VALUES (12, 'Desayuno incluido', 'Breakfast Included', 'breakfast', NULL) ON CONFLICT ("id") DO NOTHING;
INSERT INTO "servicios" ("id", "nombre", "nombreEn", "icono", "tipo") VALUES (25, 'TV Cable', 'TV Cable', 'check', NULL) ON CONFLICT ("id") DO NOTHING;
SELECT setval('servicios_id_seq', (SELECT COALESCE(MAX(id), 1) FROM "servicios"));

-- 3.4. ESTABLECIMIENTOS (TOTAL: 31)
INSERT INTO "establecimientos" ("id", "tipo", "nombre", "municipioCodigo", "estrellas", "resena", "resenaEn", "whatsapp", "telefonoContacto", "instagramUrl", "facebookUrl", "xUrl", "direccion", "ubicacionUrl", "latitud", "longitud", "disponible", "eliminadoEn", "creadoEn", "actualizadoEn", "usuarioId") VALUES (4, 'HOTEL', 'Hotel Test Real DB', 'Plato', 5, 'Hotel insertado directamente en base de datos real', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, true, '2026-11-13T10:52:47.431Z', '2026-11-13T10:52:35.022Z', '2026-11-13T10:52:47.432Z', 1) ON CONFLICT ("id") DO UPDATE SET "nombre" = EXCLUDED."nombre", "estrellas" = EXCLUDED."estrellas", "disponible" = EXCLUDED."disponible", "whatsapp" = EXCLUDED."whatsapp", "facebookUrl" = EXCLUDED."facebookUrl", "instagramUrl" = EXCLUDED."instagramUrl", "xUrl" = EXCLUDED."xUrl", "direccion" = EXCLUDED."direccion", "ubicacionUrl" = EXCLUDED."ubicacionUrl", "latitud" = EXCLUDED."latitud", "longitud" = EXCLUDED."longitud", "resena" = EXCLUDED."resena", "eliminadoEn" = EXCLUDED."eliminadoEn";
INSERT INTO "establecimientos" ("id", "tipo", "nombre", "municipioCodigo", "estrellas", "resena", "resenaEn", "whatsapp", "telefonoContacto", "instagramUrl", "facebookUrl", "xUrl", "direccion", "ubicacionUrl", "latitud", "longitud", "disponible", "eliminadoEn", "creadoEn", "actualizadoEn", "usuarioId") VALUES (5, 'HOTEL', 'Hotel Los Recuerdos', 'Plato', 4, 'Tradición y confort en el corazón de Plato. Habitaciones amplias con aire acondicionado, piscina para refrescarse del clima cálido, restaurante de comida típica y parqueadero seguro.', 'Tradition and comfort in the heart of Plato. Spacious air-conditioned rooms, a refreshing outdoor pool, typical regional restaurant, and secure parking.', '573000000001', NULL, 'https://www.instagram.com/hotellosrecuerdos', 'https://www.facebook.com/hotellosrecuerdosplato', NULL, NULL, 'https://www.google.com/maps/search/?api=1&query=Hotel+Los+Recuerdos+Plato+Magdalena', 9.7925, -74.7812, true, '2026-11-13T11:30:18.103Z', '2026-11-13T10:55:32.452Z', '2026-11-13T11:30:18.105Z', 1) ON CONFLICT ("id") DO UPDATE SET "nombre" = EXCLUDED."nombre", "estrellas" = EXCLUDED."estrellas", "disponible" = EXCLUDED."disponible", "whatsapp" = EXCLUDED."whatsapp", "facebookUrl" = EXCLUDED."facebookUrl", "instagramUrl" = EXCLUDED."instagramUrl", "xUrl" = EXCLUDED."xUrl", "direccion" = EXCLUDED."direccion", "ubicacionUrl" = EXCLUDED."ubicacionUrl", "latitud" = EXCLUDED."latitud", "longitud" = EXCLUDED."longitud", "resena" = EXCLUDED."resena", "eliminadoEn" = EXCLUDED."eliminadoEn";
INSERT INTO "establecimientos" ("id", "tipo", "nombre", "municipioCodigo", "estrellas", "resena", "resenaEn", "whatsapp", "telefonoContacto", "instagramUrl", "facebookUrl", "xUrl", "direccion", "ubicacionUrl", "latitud", "longitud", "disponible", "eliminadoEn", "creadoEn", "actualizadoEn", "usuarioId") VALUES (6, 'HOTEL', 'Hotel San Martín', 'Plato', 3, 'Hospedaje céntrico y acogedor, a solo pasos de la plaza principal y del comercio. Ideal para estancias de negocios o turismo durante las fiestas de los 400 años.', 'Central and welcoming stay, just steps from the main square and downtown commerce. Ideal for business or leisure travelers visiting Plato.', '573000000002', NULL, 'https://www.instagram.com/hotelsanmartinplato', 'https://www.facebook.com/hotelsanmartinplato', NULL, NULL, 'https://www.google.com/maps/search/?api=1&query=Hotel+San+Martin+Plato+Magdalena', 9.7891, -74.784, true, '2026-11-13T11:30:20.187Z', '2026-11-13T10:55:32.748Z', '2026-11-13T11:30:20.188Z', 1) ON CONFLICT ("id") DO UPDATE SET "nombre" = EXCLUDED."nombre", "estrellas" = EXCLUDED."estrellas", "disponible" = EXCLUDED."disponible", "whatsapp" = EXCLUDED."whatsapp", "facebookUrl" = EXCLUDED."facebookUrl", "instagramUrl" = EXCLUDED."instagramUrl", "xUrl" = EXCLUDED."xUrl", "direccion" = EXCLUDED."direccion", "ubicacionUrl" = EXCLUDED."ubicacionUrl", "latitud" = EXCLUDED."latitud", "longitud" = EXCLUDED."longitud", "resena" = EXCLUDED."resena", "eliminadoEn" = EXCLUDED."eliminadoEn";
INSERT INTO "establecimientos" ("id", "tipo", "nombre", "municipioCodigo", "estrellas", "resena", "resenaEn", "whatsapp", "telefonoContacto", "instagramUrl", "facebookUrl", "xUrl", "direccion", "ubicacionUrl", "latitud", "longitud", "disponible", "eliminadoEn", "creadoEn", "actualizadoEn", "usuarioId") VALUES (7, 'HOTEL', 'Hotel Posada del Río', 'Plato', 3, 'Tranquilidad frente al majestuoso río Magdalena. Hermosas vistas del atardecer ribereño, zonas de descanso campestres y la mejor atención de la región.', 'Tranquility facing the majestic Magdalena River. Beautiful river sunset views, countryside relaxation areas, and the warmest local hospitality.', '573000000003', NULL, 'https://www.instagram.com/posadadelrioplato', 'https://www.facebook.com/posadadelrioplato', NULL, NULL, 'https://www.google.com/maps/search/?api=1&query=Posada+del+Rio+Plato+Magdalena', 9.794, -74.7865, false, '2026-11-13T11:30:22.154Z', '2026-11-13T10:55:32.782Z', '2026-11-13T11:30:22.156Z', 1) ON CONFLICT ("id") DO UPDATE SET "nombre" = EXCLUDED."nombre", "estrellas" = EXCLUDED."estrellas", "disponible" = EXCLUDED."disponible", "whatsapp" = EXCLUDED."whatsapp", "facebookUrl" = EXCLUDED."facebookUrl", "instagramUrl" = EXCLUDED."instagramUrl", "xUrl" = EXCLUDED."xUrl", "direccion" = EXCLUDED."direccion", "ubicacionUrl" = EXCLUDED."ubicacionUrl", "latitud" = EXCLUDED."latitud", "longitud" = EXCLUDED."longitud", "resena" = EXCLUDED."resena", "eliminadoEn" = EXCLUDED."eliminadoEn";
INSERT INTO "establecimientos" ("id", "tipo", "nombre", "municipioCodigo", "estrellas", "resena", "resenaEn", "whatsapp", "telefonoContacto", "instagramUrl", "facebookUrl", "xUrl", "direccion", "ubicacionUrl", "latitud", "longitud", "disponible", "eliminadoEn", "creadoEn", "actualizadoEn", "usuarioId") VALUES (8, 'RESTAURANTE', 'Restaurante Fogón del Magdalena', 'Plato', 5, 'Cocina tradicional ribereña frente al río Grande: bocachico en cabrito, viuda de pescado, cayeye con queso costeño y jugos de corozo fresco.', 'Traditional riverside cuisine along the Magdalena: roasted bocachico fish, local viuda stew, plantain cayeye with coastal cheese, and fresh corozo juice.', '573000000004', NULL, 'https://www.instagram.com/fogondelmagdalena', NULL, NULL, NULL, 'https://www.google.com/maps/search/?api=1&query=Plato+Magdalena+Restaurante+Fogon', 9.7918, -74.7848, true, '2026-11-13T11:30:24.560Z', '2026-11-13T10:55:32.807Z', '2026-11-13T11:30:24.564Z', 1) ON CONFLICT ("id") DO UPDATE SET "nombre" = EXCLUDED."nombre", "estrellas" = EXCLUDED."estrellas", "disponible" = EXCLUDED."disponible", "whatsapp" = EXCLUDED."whatsapp", "facebookUrl" = EXCLUDED."facebookUrl", "instagramUrl" = EXCLUDED."instagramUrl", "xUrl" = EXCLUDED."xUrl", "direccion" = EXCLUDED."direccion", "ubicacionUrl" = EXCLUDED."ubicacionUrl", "latitud" = EXCLUDED."latitud", "longitud" = EXCLUDED."longitud", "resena" = EXCLUDED."resena", "eliminadoEn" = EXCLUDED."eliminadoEn";
INSERT INTO "establecimientos" ("id", "tipo", "nombre", "municipioCodigo", "estrellas", "resena", "resenaEn", "whatsapp", "telefonoContacto", "instagramUrl", "facebookUrl", "xUrl", "direccion", "ubicacionUrl", "latitud", "longitud", "disponible", "eliminadoEn", "creadoEn", "actualizadoEn", "usuarioId") VALUES (9, 'RESTAURANTE', 'Asados & Sabores El Caimán', 'Plato', 4, 'Cortes al carbón, sancocho de gallina criolla y arepas de huevo artesanales a pocos pasos del Parque del Hombre Caimán en ambiente familiar.', 'Charcoal-grilled cuts, traditional creole hen stew, and handmade arepas de huevo steps from Hombre Caimán Park in a warm family atmosphere.', '573000000005', NULL, 'https://www.instagram.com/asadoselcaimanplato', 'https://www.facebook.com/asadoselcaimanplato', NULL, NULL, 'https://www.google.com/maps/search/?api=1&query=Parque+Hombre+Caiman+Plato+Magdalena', 9.7909, -74.7853, true, '2026-11-13T11:30:26.708Z', '2026-11-13T10:55:32.835Z', '2026-11-13T11:30:26.717Z', 1) ON CONFLICT ("id") DO UPDATE SET "nombre" = EXCLUDED."nombre", "estrellas" = EXCLUDED."estrellas", "disponible" = EXCLUDED."disponible", "whatsapp" = EXCLUDED."whatsapp", "facebookUrl" = EXCLUDED."facebookUrl", "instagramUrl" = EXCLUDED."instagramUrl", "xUrl" = EXCLUDED."xUrl", "direccion" = EXCLUDED."direccion", "ubicacionUrl" = EXCLUDED."ubicacionUrl", "latitud" = EXCLUDED."latitud", "longitud" = EXCLUDED."longitud", "resena" = EXCLUDED."resena", "eliminadoEn" = EXCLUDED."eliminadoEn";
INSERT INTO "establecimientos" ("id", "tipo", "nombre", "municipioCodigo", "estrellas", "resena", "resenaEn", "whatsapp", "telefonoContacto", "instagramUrl", "facebookUrl", "xUrl", "direccion", "ubicacionUrl", "latitud", "longitud", "disponible", "eliminadoEn", "creadoEn", "actualizadoEn", "usuarioId") VALUES (10, 'RESTAURANTE', 'Café & Dulcería La Inmaculada', 'Plato', 4, 'Dulcería típica plateña, enyucado horneado, cocadas, café de la sierra y desayunos tradicionales con vista a la plaza central.', 'Authentic Plato sweets, baked enyucado, coconut candies, Sierra coffee, and hearty traditional breakfasts overlooking the main plaza.', '573000000006', NULL, 'https://www.instagram.com/cafelainmaculadaplato', NULL, NULL, NULL, 'https://www.google.com/maps/search/?api=1&query=Iglesia+Inmaculada+Concepcion+Plato+Magdalena', 9.7905, -74.7851, true, '2026-11-13T11:30:29.031Z', '2026-11-13T10:55:32.876Z', '2026-11-13T11:30:29.033Z', 1) ON CONFLICT ("id") DO UPDATE SET "nombre" = EXCLUDED."nombre", "estrellas" = EXCLUDED."estrellas", "disponible" = EXCLUDED."disponible", "whatsapp" = EXCLUDED."whatsapp", "facebookUrl" = EXCLUDED."facebookUrl", "instagramUrl" = EXCLUDED."instagramUrl", "xUrl" = EXCLUDED."xUrl", "direccion" = EXCLUDED."direccion", "ubicacionUrl" = EXCLUDED."ubicacionUrl", "latitud" = EXCLUDED."latitud", "longitud" = EXCLUDED."longitud", "resena" = EXCLUDED."resena", "eliminadoEn" = EXCLUDED."eliminadoEn";
INSERT INTO "establecimientos" ("id", "tipo", "nombre", "municipioCodigo", "estrellas", "resena", "resenaEn", "whatsapp", "telefonoContacto", "instagramUrl", "facebookUrl", "xUrl", "direccion", "ubicacionUrl", "latitud", "longitud", "disponible", "eliminadoEn", "creadoEn", "actualizadoEn", "usuarioId") VALUES (11, 'CABANA', 'Cabañas Brisas de la Ciénaga', 'Plato', 5, 'Cabañas ecológicas de madera y palma rodeadas de espejos de agua, amaneceres tranquilos, hamacas privadas y recorridos guiados en canoa.', 'Eco-friendly wood and palm cabins surrounded by tranquil wetlands, peaceful sunrises, private hammocks, and guided canoe tours.', '573000000007', NULL, 'https://www.instagram.com/brisasdelacienagaplato', NULL, NULL, NULL, 'https://www.google.com/maps/search/?api=1&query=Cienaga+Plato+Magdalena', 9.7962, -74.7891, true, '2026-11-13T11:30:30.965Z', '2026-11-13T10:55:32.925Z', '2026-11-13T11:30:30.967Z', 1) ON CONFLICT ("id") DO UPDATE SET "nombre" = EXCLUDED."nombre", "estrellas" = EXCLUDED."estrellas", "disponible" = EXCLUDED."disponible", "whatsapp" = EXCLUDED."whatsapp", "facebookUrl" = EXCLUDED."facebookUrl", "instagramUrl" = EXCLUDED."instagramUrl", "xUrl" = EXCLUDED."xUrl", "direccion" = EXCLUDED."direccion", "ubicacionUrl" = EXCLUDED."ubicacionUrl", "latitud" = EXCLUDED."latitud", "longitud" = EXCLUDED."longitud", "resena" = EXCLUDED."resena", "eliminadoEn" = EXCLUDED."eliminadoEn";
INSERT INTO "establecimientos" ("id", "tipo", "nombre", "municipioCodigo", "estrellas", "resena", "resenaEn", "whatsapp", "telefonoContacto", "instagramUrl", "facebookUrl", "xUrl", "direccion", "ubicacionUrl", "latitud", "longitud", "disponible", "eliminadoEn", "creadoEn", "actualizadoEn", "usuarioId") VALUES (12, 'CABANA', 'Finca Eco-Cabañas El Manglar', 'Plato', 4, 'Refugio campestre ideal para familias y grupos en la tierra del Caimán: amplios jardines, piscina al aire libre, cocina equipada y fogata nocturna.', 'Countryside retreat ideal for families and groups in the land of the Caimán: spacious gardens, outdoor pool, full kitchen, and evening firepit.', '573000000008', NULL, NULL, 'https://www.facebook.com/fincaelmanglarplato', NULL, NULL, 'https://www.google.com/maps/search/?api=1&query=Finca+Plato+Magdalena', 9.7875, -74.7808, true, '2026-11-13T11:30:32.967Z', '2026-11-13T10:55:32.972Z', '2026-11-13T11:30:32.969Z', 1) ON CONFLICT ("id") DO UPDATE SET "nombre" = EXCLUDED."nombre", "estrellas" = EXCLUDED."estrellas", "disponible" = EXCLUDED."disponible", "whatsapp" = EXCLUDED."whatsapp", "facebookUrl" = EXCLUDED."facebookUrl", "instagramUrl" = EXCLUDED."instagramUrl", "xUrl" = EXCLUDED."xUrl", "direccion" = EXCLUDED."direccion", "ubicacionUrl" = EXCLUDED."ubicacionUrl", "latitud" = EXCLUDED."latitud", "longitud" = EXCLUDED."longitud", "resena" = EXCLUDED."resena", "eliminadoEn" = EXCLUDED."eliminadoEn";
INSERT INTO "establecimientos" ("id", "tipo", "nombre", "municipioCodigo", "estrellas", "resena", "resenaEn", "whatsapp", "telefonoContacto", "instagramUrl", "facebookUrl", "xUrl", "direccion", "ubicacionUrl", "latitud", "longitud", "disponible", "eliminadoEn", "creadoEn", "actualizadoEn", "usuarioId") VALUES (13, 'CABANA', 'Cabañas Mirador del Puente', 'Plato', 4, 'Cabañas elevadas con terraza privada hacia el Puente Antonio Escobar Camargo, diseñadas para descansar escuchando la brisa del Magdalena.', 'Elevated cabins with private terraces facing the Antonio Escobar Camargo Bridge, designed for peaceful stays in the Magdalena River breeze.', '573000000009', NULL, 'https://www.instagram.com/miradordelpuenteplato', NULL, NULL, NULL, 'https://www.google.com/maps/search/?api=1&query=Puente+Plato+Magdalena', 9.7931, -74.7924, false, '2026-11-13T11:30:12.553Z', '2026-11-13T10:55:33.046Z', '2026-11-13T11:30:12.555Z', 1) ON CONFLICT ("id") DO UPDATE SET "nombre" = EXCLUDED."nombre", "estrellas" = EXCLUDED."estrellas", "disponible" = EXCLUDED."disponible", "whatsapp" = EXCLUDED."whatsapp", "facebookUrl" = EXCLUDED."facebookUrl", "instagramUrl" = EXCLUDED."instagramUrl", "xUrl" = EXCLUDED."xUrl", "direccion" = EXCLUDED."direccion", "ubicacionUrl" = EXCLUDED."ubicacionUrl", "latitud" = EXCLUDED."latitud", "longitud" = EXCLUDED."longitud", "resena" = EXCLUDED."resena", "eliminadoEn" = EXCLUDED."eliminadoEn";
INSERT INTO "establecimientos" ("id", "tipo", "nombre", "municipioCodigo", "estrellas", "resena", "resenaEn", "whatsapp", "telefonoContacto", "instagramUrl", "facebookUrl", "xUrl", "direccion", "ubicacionUrl", "latitud", "longitud", "disponible", "eliminadoEn", "creadoEn", "actualizadoEn", "usuarioId") VALUES (14, 'HOTEL', 'Hotel Test Real DB', 'Plato', 4, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, true, '2026-11-13T10:55:51.642Z', '2026-11-13T10:55:51.590Z', '2026-11-13T10:55:51.643Z', 1) ON CONFLICT ("id") DO UPDATE SET "nombre" = EXCLUDED."nombre", "estrellas" = EXCLUDED."estrellas", "disponible" = EXCLUDED."disponible", "whatsapp" = EXCLUDED."whatsapp", "facebookUrl" = EXCLUDED."facebookUrl", "instagramUrl" = EXCLUDED."instagramUrl", "xUrl" = EXCLUDED."xUrl", "direccion" = EXCLUDED."direccion", "ubicacionUrl" = EXCLUDED."ubicacionUrl", "latitud" = EXCLUDED."latitud", "longitud" = EXCLUDED."longitud", "resena" = EXCLUDED."resena", "eliminadoEn" = EXCLUDED."eliminadoEn";
INSERT INTO "establecimientos" ("id", "tipo", "nombre", "municipioCodigo", "estrellas", "resena", "resenaEn", "whatsapp", "telefonoContacto", "instagramUrl", "facebookUrl", "xUrl", "direccion", "ubicacionUrl", "latitud", "longitud", "disponible", "eliminadoEn", "creadoEn", "actualizadoEn", "usuarioId") VALUES (15, 'HOTEL', 'Hotel Gestor Test', 'Plato', 3, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, true, '2026-11-13T11:08:49.077Z', '2026-11-13T11:08:49.000Z', '2026-11-13T11:08:49.080Z', 2) ON CONFLICT ("id") DO UPDATE SET "nombre" = EXCLUDED."nombre", "estrellas" = EXCLUDED."estrellas", "disponible" = EXCLUDED."disponible", "whatsapp" = EXCLUDED."whatsapp", "facebookUrl" = EXCLUDED."facebookUrl", "instagramUrl" = EXCLUDED."instagramUrl", "xUrl" = EXCLUDED."xUrl", "direccion" = EXCLUDED."direccion", "ubicacionUrl" = EXCLUDED."ubicacionUrl", "latitud" = EXCLUDED."latitud", "longitud" = EXCLUDED."longitud", "resena" = EXCLUDED."resena", "eliminadoEn" = EXCLUDED."eliminadoEn";
INSERT INTO "establecimientos" ("id", "tipo", "nombre", "municipioCodigo", "estrellas", "resena", "resenaEn", "whatsapp", "telefonoContacto", "instagramUrl", "facebookUrl", "xUrl", "direccion", "ubicacionUrl", "latitud", "longitud", "disponible", "eliminadoEn", "creadoEn", "actualizadoEn", "usuarioId") VALUES (16, 'HOTEL', 'Pablo Jaraba Diaz', 'Plato', 4, NULL, NULL, '3188592512', NULL, 'https://www.instagram.com/hotel_pablojaraba/', NULL, NULL, NULL, 'https://maps.app.goo.gl/HryDi9mXYHxSrB8k6', NULL, NULL, true, NULL, '2026-11-13T11:28:12.404Z', '2026-11-13T11:30:49.629Z', 1) ON CONFLICT ("id") DO UPDATE SET "nombre" = EXCLUDED."nombre", "estrellas" = EXCLUDED."estrellas", "disponible" = EXCLUDED."disponible", "whatsapp" = EXCLUDED."whatsapp", "facebookUrl" = EXCLUDED."facebookUrl", "instagramUrl" = EXCLUDED."instagramUrl", "xUrl" = EXCLUDED."xUrl", "direccion" = EXCLUDED."direccion", "ubicacionUrl" = EXCLUDED."ubicacionUrl", "latitud" = EXCLUDED."latitud", "longitud" = EXCLUDED."longitud", "resena" = EXCLUDED."resena", "eliminadoEn" = EXCLUDED."eliminadoEn";
INSERT INTO "establecimientos" ("id", "tipo", "nombre", "municipioCodigo", "estrellas", "resena", "resenaEn", "whatsapp", "telefonoContacto", "instagramUrl", "facebookUrl", "xUrl", "direccion", "ubicacionUrl", "latitud", "longitud", "disponible", "eliminadoEn", "creadoEn", "actualizadoEn", "usuarioId") VALUES (17, 'HOTEL', 'Mio Led', 'Plato', 3, NULL, NULL, '3052100693', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, true, NULL, '2026-11-13T11:35:44.078Z', '2026-11-13T11:35:44.078Z', 1) ON CONFLICT ("id") DO UPDATE SET "nombre" = EXCLUDED."nombre", "estrellas" = EXCLUDED."estrellas", "disponible" = EXCLUDED."disponible", "whatsapp" = EXCLUDED."whatsapp", "facebookUrl" = EXCLUDED."facebookUrl", "instagramUrl" = EXCLUDED."instagramUrl", "xUrl" = EXCLUDED."xUrl", "direccion" = EXCLUDED."direccion", "ubicacionUrl" = EXCLUDED."ubicacionUrl", "latitud" = EXCLUDED."latitud", "longitud" = EXCLUDED."longitud", "resena" = EXCLUDED."resena", "eliminadoEn" = EXCLUDED."eliminadoEn";
INSERT INTO "establecimientos" ("id", "tipo", "nombre", "municipioCodigo", "estrellas", "resena", "resenaEn", "whatsapp", "telefonoContacto", "instagramUrl", "facebookUrl", "xUrl", "direccion", "ubicacionUrl", "latitud", "longitud", "disponible", "eliminadoEn", "creadoEn", "actualizadoEn", "usuarioId") VALUES (18, 'HOTEL', 'Rio Caiman', 'Plato', 4, NULL, NULL, '3122003472', NULL, 'https://www.instagram.com/hotelriocaiman/', NULL, NULL, NULL, NULL, NULL, NULL, true, NULL, '2026-11-13T11:37:09.548Z', '2026-11-13T11:37:09.548Z', 1) ON CONFLICT ("id") DO UPDATE SET "nombre" = EXCLUDED."nombre", "estrellas" = EXCLUDED."estrellas", "disponible" = EXCLUDED."disponible", "whatsapp" = EXCLUDED."whatsapp", "facebookUrl" = EXCLUDED."facebookUrl", "instagramUrl" = EXCLUDED."instagramUrl", "xUrl" = EXCLUDED."xUrl", "direccion" = EXCLUDED."direccion", "ubicacionUrl" = EXCLUDED."ubicacionUrl", "latitud" = EXCLUDED."latitud", "longitud" = EXCLUDED."longitud", "resena" = EXCLUDED."resena", "eliminadoEn" = EXCLUDED."eliminadoEn";
INSERT INTO "establecimientos" ("id", "tipo", "nombre", "municipioCodigo", "estrellas", "resena", "resenaEn", "whatsapp", "telefonoContacto", "instagramUrl", "facebookUrl", "xUrl", "direccion", "ubicacionUrl", "latitud", "longitud", "disponible", "eliminadoEn", "creadoEn", "actualizadoEn", "usuarioId") VALUES (19, 'HOTEL', 'Karely', 'Plato', 4, NULL, NULL, '3246195821', NULL, 'https://www.instagram.com/hotelkarely/', NULL, NULL, NULL, NULL, NULL, NULL, true, NULL, '2026-11-13T11:38:19.168Z', '2026-11-13T11:38:19.168Z', 1) ON CONFLICT ("id") DO UPDATE SET "nombre" = EXCLUDED."nombre", "estrellas" = EXCLUDED."estrellas", "disponible" = EXCLUDED."disponible", "whatsapp" = EXCLUDED."whatsapp", "facebookUrl" = EXCLUDED."facebookUrl", "instagramUrl" = EXCLUDED."instagramUrl", "xUrl" = EXCLUDED."xUrl", "direccion" = EXCLUDED."direccion", "ubicacionUrl" = EXCLUDED."ubicacionUrl", "latitud" = EXCLUDED."latitud", "longitud" = EXCLUDED."longitud", "resena" = EXCLUDED."resena", "eliminadoEn" = EXCLUDED."eliminadoEn";
INSERT INTO "establecimientos" ("id", "tipo", "nombre", "municipioCodigo", "estrellas", "resena", "resenaEn", "whatsapp", "telefonoContacto", "instagramUrl", "facebookUrl", "xUrl", "direccion", "ubicacionUrl", "latitud", "longitud", "disponible", "eliminadoEn", "creadoEn", "actualizadoEn", "usuarioId") VALUES (20, 'HOTEL', 'Camila 1', 'Plato', 3, NULL, NULL, 'https://api.whatsapp.com/send/?phone=573234194678&text=Hola%2C%20me%20gustar%C3%ADa%20recibir%20informaci%C3%B3n', NULL, 'https://www.instagram.com/hotel_camila?mdxt=YWEwMjExanRwdmpq', 'https://www.facebook.com/share/19huWw1USD/?mibextid=wwXIfr', NULL, NULL, NULL, NULL, NULL, true, NULL, '2026-11-13T11:41:07.243Z', '2026-11-13T11:57:04.695Z', 1) ON CONFLICT ("id") DO UPDATE SET "nombre" = EXCLUDED."nombre", "estrellas" = EXCLUDED."estrellas", "disponible" = EXCLUDED."disponible", "whatsapp" = EXCLUDED."whatsapp", "facebookUrl" = EXCLUDED."facebookUrl", "instagramUrl" = EXCLUDED."instagramUrl", "xUrl" = EXCLUDED."xUrl", "direccion" = EXCLUDED."direccion", "ubicacionUrl" = EXCLUDED."ubicacionUrl", "latitud" = EXCLUDED."latitud", "longitud" = EXCLUDED."longitud", "resena" = EXCLUDED."resena", "eliminadoEn" = EXCLUDED."eliminadoEn";
INSERT INTO "establecimientos" ("id", "tipo", "nombre", "municipioCodigo", "estrellas", "resena", "resenaEn", "whatsapp", "telefonoContacto", "instagramUrl", "facebookUrl", "xUrl", "direccion", "ubicacionUrl", "latitud", "longitud", "disponible", "eliminadoEn", "creadoEn", "actualizadoEn", "usuarioId") VALUES (21, 'HOTEL', 'Camila 2', 'Plato', 4, NULL, NULL, NULL, NULL, 'https://www.instagram.com/hotelcamila2?vrfl=ZHBjeThwN2dyYTRu', NULL, NULL, NULL, NULL, NULL, NULL, true, NULL, '2026-11-13T11:42:19.850Z', '2026-11-13T11:42:19.850Z', 1) ON CONFLICT ("id") DO UPDATE SET "nombre" = EXCLUDED."nombre", "estrellas" = EXCLUDED."estrellas", "disponible" = EXCLUDED."disponible", "whatsapp" = EXCLUDED."whatsapp", "facebookUrl" = EXCLUDED."facebookUrl", "instagramUrl" = EXCLUDED."instagramUrl", "xUrl" = EXCLUDED."xUrl", "direccion" = EXCLUDED."direccion", "ubicacionUrl" = EXCLUDED."ubicacionUrl", "latitud" = EXCLUDED."latitud", "longitud" = EXCLUDED."longitud", "resena" = EXCLUDED."resena", "eliminadoEn" = EXCLUDED."eliminadoEn";
INSERT INTO "establecimientos" ("id", "tipo", "nombre", "municipioCodigo", "estrellas", "resena", "resenaEn", "whatsapp", "telefonoContacto", "instagramUrl", "facebookUrl", "xUrl", "direccion", "ubicacionUrl", "latitud", "longitud", "disponible", "eliminadoEn", "creadoEn", "actualizadoEn", "usuarioId") VALUES (22, 'HOTEL', 'Las villa', 'Plato', 3, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, true, NULL, '2026-11-13T11:43:12.106Z', '2026-11-13T11:43:12.106Z', 1) ON CONFLICT ("id") DO UPDATE SET "nombre" = EXCLUDED."nombre", "estrellas" = EXCLUDED."estrellas", "disponible" = EXCLUDED."disponible", "whatsapp" = EXCLUDED."whatsapp", "facebookUrl" = EXCLUDED."facebookUrl", "instagramUrl" = EXCLUDED."instagramUrl", "xUrl" = EXCLUDED."xUrl", "direccion" = EXCLUDED."direccion", "ubicacionUrl" = EXCLUDED."ubicacionUrl", "latitud" = EXCLUDED."latitud", "longitud" = EXCLUDED."longitud", "resena" = EXCLUDED."resena", "eliminadoEn" = EXCLUDED."eliminadoEn";
INSERT INTO "establecimientos" ("id", "tipo", "nombre", "municipioCodigo", "estrellas", "resena", "resenaEn", "whatsapp", "telefonoContacto", "instagramUrl", "facebookUrl", "xUrl", "direccion", "ubicacionUrl", "latitud", "longitud", "disponible", "eliminadoEn", "creadoEn", "actualizadoEn", "usuarioId") VALUES (23, 'HOTEL', 'Davinci', 'Plato', 3, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, true, NULL, '2026-11-13T11:43:50.730Z', '2026-11-13T11:43:50.730Z', 1) ON CONFLICT ("id") DO UPDATE SET "nombre" = EXCLUDED."nombre", "estrellas" = EXCLUDED."estrellas", "disponible" = EXCLUDED."disponible", "whatsapp" = EXCLUDED."whatsapp", "facebookUrl" = EXCLUDED."facebookUrl", "instagramUrl" = EXCLUDED."instagramUrl", "xUrl" = EXCLUDED."xUrl", "direccion" = EXCLUDED."direccion", "ubicacionUrl" = EXCLUDED."ubicacionUrl", "latitud" = EXCLUDED."latitud", "longitud" = EXCLUDED."longitud", "resena" = EXCLUDED."resena", "eliminadoEn" = EXCLUDED."eliminadoEn";
INSERT INTO "establecimientos" ("id", "tipo", "nombre", "municipioCodigo", "estrellas", "resena", "resenaEn", "whatsapp", "telefonoContacto", "instagramUrl", "facebookUrl", "xUrl", "direccion", "ubicacionUrl", "latitud", "longitud", "disponible", "eliminadoEn", "creadoEn", "actualizadoEn", "usuarioId") VALUES (24, 'HOTEL', 'Real', 'Plato', 3, NULL, NULL, NULL, NULL, 'https://www.instagram.com/hotelrealplato/', NULL, NULL, NULL, NULL, NULL, NULL, true, NULL, '2026-11-13T11:44:37.195Z', '2026-11-13T11:44:37.195Z', 1) ON CONFLICT ("id") DO UPDATE SET "nombre" = EXCLUDED."nombre", "estrellas" = EXCLUDED."estrellas", "disponible" = EXCLUDED."disponible", "whatsapp" = EXCLUDED."whatsapp", "facebookUrl" = EXCLUDED."facebookUrl", "instagramUrl" = EXCLUDED."instagramUrl", "xUrl" = EXCLUDED."xUrl", "direccion" = EXCLUDED."direccion", "ubicacionUrl" = EXCLUDED."ubicacionUrl", "latitud" = EXCLUDED."latitud", "longitud" = EXCLUDED."longitud", "resena" = EXCLUDED."resena", "eliminadoEn" = EXCLUDED."eliminadoEn";
INSERT INTO "establecimientos" ("id", "tipo", "nombre", "municipioCodigo", "estrellas", "resena", "resenaEn", "whatsapp", "telefonoContacto", "instagramUrl", "facebookUrl", "xUrl", "direccion", "ubicacionUrl", "latitud", "longitud", "disponible", "eliminadoEn", "creadoEn", "actualizadoEn", "usuarioId") VALUES (25, 'HOTEL', 'Star Plaza', 'Plato', 3, NULL, NULL, NULL, NULL, NULL, 'https://www.facebook.com/hotelstarplazaplato/', NULL, NULL, NULL, NULL, NULL, true, NULL, '2026-11-13T11:46:17.166Z', '2026-11-13T11:58:31.151Z', 1) ON CONFLICT ("id") DO UPDATE SET "nombre" = EXCLUDED."nombre", "estrellas" = EXCLUDED."estrellas", "disponible" = EXCLUDED."disponible", "whatsapp" = EXCLUDED."whatsapp", "facebookUrl" = EXCLUDED."facebookUrl", "instagramUrl" = EXCLUDED."instagramUrl", "xUrl" = EXCLUDED."xUrl", "direccion" = EXCLUDED."direccion", "ubicacionUrl" = EXCLUDED."ubicacionUrl", "latitud" = EXCLUDED."latitud", "longitud" = EXCLUDED."longitud", "resena" = EXCLUDED."resena", "eliminadoEn" = EXCLUDED."eliminadoEn";
INSERT INTO "establecimientos" ("id", "tipo", "nombre", "municipioCodigo", "estrellas", "resena", "resenaEn", "whatsapp", "telefonoContacto", "instagramUrl", "facebookUrl", "xUrl", "direccion", "ubicacionUrl", "latitud", "longitud", "disponible", "eliminadoEn", "creadoEn", "actualizadoEn", "usuarioId") VALUES (26, 'HOTEL', 'Tv', 'Plato', 2, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, true, NULL, '2026-11-13T11:47:13.203Z', '2026-11-13T11:47:13.203Z', 1) ON CONFLICT ("id") DO UPDATE SET "nombre" = EXCLUDED."nombre", "estrellas" = EXCLUDED."estrellas", "disponible" = EXCLUDED."disponible", "whatsapp" = EXCLUDED."whatsapp", "facebookUrl" = EXCLUDED."facebookUrl", "instagramUrl" = EXCLUDED."instagramUrl", "xUrl" = EXCLUDED."xUrl", "direccion" = EXCLUDED."direccion", "ubicacionUrl" = EXCLUDED."ubicacionUrl", "latitud" = EXCLUDED."latitud", "longitud" = EXCLUDED."longitud", "resena" = EXCLUDED."resena", "eliminadoEn" = EXCLUDED."eliminadoEn";
INSERT INTO "establecimientos" ("id", "tipo", "nombre", "municipioCodigo", "estrellas", "resena", "resenaEn", "whatsapp", "telefonoContacto", "instagramUrl", "facebookUrl", "xUrl", "direccion", "ubicacionUrl", "latitud", "longitud", "disponible", "eliminadoEn", "creadoEn", "actualizadoEn", "usuarioId") VALUES (27, 'HOTEL', 'Cero Extres', 'Plato', 3, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, true, NULL, '2026-11-13T11:47:45.276Z', '2026-11-13T11:47:45.276Z', 1) ON CONFLICT ("id") DO UPDATE SET "nombre" = EXCLUDED."nombre", "estrellas" = EXCLUDED."estrellas", "disponible" = EXCLUDED."disponible", "whatsapp" = EXCLUDED."whatsapp", "facebookUrl" = EXCLUDED."facebookUrl", "instagramUrl" = EXCLUDED."instagramUrl", "xUrl" = EXCLUDED."xUrl", "direccion" = EXCLUDED."direccion", "ubicacionUrl" = EXCLUDED."ubicacionUrl", "latitud" = EXCLUDED."latitud", "longitud" = EXCLUDED."longitud", "resena" = EXCLUDED."resena", "eliminadoEn" = EXCLUDED."eliminadoEn";
INSERT INTO "establecimientos" ("id", "tipo", "nombre", "municipioCodigo", "estrellas", "resena", "resenaEn", "whatsapp", "telefonoContacto", "instagramUrl", "facebookUrl", "xUrl", "direccion", "ubicacionUrl", "latitud", "longitud", "disponible", "eliminadoEn", "creadoEn", "actualizadoEn", "usuarioId") VALUES (28, 'HOTEL', 'Madrigal', 'Plato', 3, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, true, NULL, '2026-11-13T11:48:27.351Z', '2026-11-13T11:48:27.351Z', 1) ON CONFLICT ("id") DO UPDATE SET "nombre" = EXCLUDED."nombre", "estrellas" = EXCLUDED."estrellas", "disponible" = EXCLUDED."disponible", "whatsapp" = EXCLUDED."whatsapp", "facebookUrl" = EXCLUDED."facebookUrl", "instagramUrl" = EXCLUDED."instagramUrl", "xUrl" = EXCLUDED."xUrl", "direccion" = EXCLUDED."direccion", "ubicacionUrl" = EXCLUDED."ubicacionUrl", "latitud" = EXCLUDED."latitud", "longitud" = EXCLUDED."longitud", "resena" = EXCLUDED."resena", "eliminadoEn" = EXCLUDED."eliminadoEn";
INSERT INTO "establecimientos" ("id", "tipo", "nombre", "municipioCodigo", "estrellas", "resena", "resenaEn", "whatsapp", "telefonoContacto", "instagramUrl", "facebookUrl", "xUrl", "direccion", "ubicacionUrl", "latitud", "longitud", "disponible", "eliminadoEn", "creadoEn", "actualizadoEn", "usuarioId") VALUES (29, 'HOTEL', 'Caiman Plaza', 'Plato', 3, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, true, NULL, '2026-11-13T11:49:31.467Z', '2026-11-13T11:49:31.467Z', 1) ON CONFLICT ("id") DO UPDATE SET "nombre" = EXCLUDED."nombre", "estrellas" = EXCLUDED."estrellas", "disponible" = EXCLUDED."disponible", "whatsapp" = EXCLUDED."whatsapp", "facebookUrl" = EXCLUDED."facebookUrl", "instagramUrl" = EXCLUDED."instagramUrl", "xUrl" = EXCLUDED."xUrl", "direccion" = EXCLUDED."direccion", "ubicacionUrl" = EXCLUDED."ubicacionUrl", "latitud" = EXCLUDED."latitud", "longitud" = EXCLUDED."longitud", "resena" = EXCLUDED."resena", "eliminadoEn" = EXCLUDED."eliminadoEn";
INSERT INTO "establecimientos" ("id", "tipo", "nombre", "municipioCodigo", "estrellas", "resena", "resenaEn", "whatsapp", "telefonoContacto", "instagramUrl", "facebookUrl", "xUrl", "direccion", "ubicacionUrl", "latitud", "longitud", "disponible", "eliminadoEn", "creadoEn", "actualizadoEn", "usuarioId") VALUES (30, 'HOTEL', 'Plaza del rio', 'Plato', 3, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, true, NULL, '2026-11-13T11:50:01.562Z', '2026-11-13T11:50:01.562Z', 1) ON CONFLICT ("id") DO UPDATE SET "nombre" = EXCLUDED."nombre", "estrellas" = EXCLUDED."estrellas", "disponible" = EXCLUDED."disponible", "whatsapp" = EXCLUDED."whatsapp", "facebookUrl" = EXCLUDED."facebookUrl", "instagramUrl" = EXCLUDED."instagramUrl", "xUrl" = EXCLUDED."xUrl", "direccion" = EXCLUDED."direccion", "ubicacionUrl" = EXCLUDED."ubicacionUrl", "latitud" = EXCLUDED."latitud", "longitud" = EXCLUDED."longitud", "resena" = EXCLUDED."resena", "eliminadoEn" = EXCLUDED."eliminadoEn";
INSERT INTO "establecimientos" ("id", "tipo", "nombre", "municipioCodigo", "estrellas", "resena", "resenaEn", "whatsapp", "telefonoContacto", "instagramUrl", "facebookUrl", "xUrl", "direccion", "ubicacionUrl", "latitud", "longitud", "disponible", "eliminadoEn", "creadoEn", "actualizadoEn", "usuarioId") VALUES (31, 'HOTEL', 'Villa Arenas', 'Plato', 3, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, false, NULL, '2026-11-13T11:50:51.150Z', '2026-11-14T04:25:50.222Z', 1) ON CONFLICT ("id") DO UPDATE SET "nombre" = EXCLUDED."nombre", "estrellas" = EXCLUDED."estrellas", "disponible" = EXCLUDED."disponible", "whatsapp" = EXCLUDED."whatsapp", "facebookUrl" = EXCLUDED."facebookUrl", "instagramUrl" = EXCLUDED."instagramUrl", "xUrl" = EXCLUDED."xUrl", "direccion" = EXCLUDED."direccion", "ubicacionUrl" = EXCLUDED."ubicacionUrl", "latitud" = EXCLUDED."latitud", "longitud" = EXCLUDED."longitud", "resena" = EXCLUDED."resena", "eliminadoEn" = EXCLUDED."eliminadoEn";
INSERT INTO "establecimientos" ("id", "tipo", "nombre", "municipioCodigo", "estrellas", "resena", "resenaEn", "whatsapp", "telefonoContacto", "instagramUrl", "facebookUrl", "xUrl", "direccion", "ubicacionUrl", "latitud", "longitud", "disponible", "eliminadoEn", "creadoEn", "actualizadoEn", "usuarioId") VALUES (32, 'HOTEL', 'Hospedaje RV', 'Plato', 3, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, false, NULL, '2026-11-13T11:51:37.678Z', '2026-11-14T04:25:49.440Z', 1) ON CONFLICT ("id") DO UPDATE SET "nombre" = EXCLUDED."nombre", "estrellas" = EXCLUDED."estrellas", "disponible" = EXCLUDED."disponible", "whatsapp" = EXCLUDED."whatsapp", "facebookUrl" = EXCLUDED."facebookUrl", "instagramUrl" = EXCLUDED."instagramUrl", "xUrl" = EXCLUDED."xUrl", "direccion" = EXCLUDED."direccion", "ubicacionUrl" = EXCLUDED."ubicacionUrl", "latitud" = EXCLUDED."latitud", "longitud" = EXCLUDED."longitud", "resena" = EXCLUDED."resena", "eliminadoEn" = EXCLUDED."eliminadoEn";
INSERT INTO "establecimientos" ("id", "tipo", "nombre", "municipioCodigo", "estrellas", "resena", "resenaEn", "whatsapp", "telefonoContacto", "instagramUrl", "facebookUrl", "xUrl", "direccion", "ubicacionUrl", "latitud", "longitud", "disponible", "eliminadoEn", "creadoEn", "actualizadoEn", "usuarioId") VALUES (33, 'HOTEL', 'ARISTI CASA HOTEL', 'Plato', 3, NULL, NULL, NULL, NULL, 'https://www.instagram.com/aristicasahotel/', NULL, NULL, NULL, NULL, NULL, NULL, false, NULL, '2026-11-13T11:52:31.015Z', '2026-11-14T04:25:51.559Z', 1) ON CONFLICT ("id") DO UPDATE SET "nombre" = EXCLUDED."nombre", "estrellas" = EXCLUDED."estrellas", "disponible" = EXCLUDED."disponible", "whatsapp" = EXCLUDED."whatsapp", "facebookUrl" = EXCLUDED."facebookUrl", "instagramUrl" = EXCLUDED."instagramUrl", "xUrl" = EXCLUDED."xUrl", "direccion" = EXCLUDED."direccion", "ubicacionUrl" = EXCLUDED."ubicacionUrl", "latitud" = EXCLUDED."latitud", "longitud" = EXCLUDED."longitud", "resena" = EXCLUDED."resena", "eliminadoEn" = EXCLUDED."eliminadoEn";
INSERT INTO "establecimientos" ("id", "tipo", "nombre", "municipioCodigo", "estrellas", "resena", "resenaEn", "whatsapp", "telefonoContacto", "instagramUrl", "facebookUrl", "xUrl", "direccion", "ubicacionUrl", "latitud", "longitud", "disponible", "eliminadoEn", "creadoEn", "actualizadoEn", "usuarioId") VALUES (34, 'HOTEL', 'Comfort', 'Plato', 3, NULL, NULL, NULL, NULL, NULL, 'https://www.facebook.com/apartahotelcomfort/?locale=es_LA', NULL, NULL, NULL, NULL, NULL, true, NULL, '2026-11-13T11:56:01.992Z', '2026-11-14T04:19:40.718Z', 1) ON CONFLICT ("id") DO UPDATE SET "nombre" = EXCLUDED."nombre", "estrellas" = EXCLUDED."estrellas", "disponible" = EXCLUDED."disponible", "whatsapp" = EXCLUDED."whatsapp", "facebookUrl" = EXCLUDED."facebookUrl", "instagramUrl" = EXCLUDED."instagramUrl", "xUrl" = EXCLUDED."xUrl", "direccion" = EXCLUDED."direccion", "ubicacionUrl" = EXCLUDED."ubicacionUrl", "latitud" = EXCLUDED."latitud", "longitud" = EXCLUDED."longitud", "resena" = EXCLUDED."resena", "eliminadoEn" = EXCLUDED."eliminadoEn";
SELECT setval('establecimientos_id_seq', (SELECT COALESCE(MAX(id), 1) FROM "establecimientos"));

-- 3.5. FOTOS DE ESTABLECIMIENTOS
INSERT INTO "establecimiento_fotos" ("id", "establecimientoId", "url", "orden", "esPortada") VALUES (5, 4, 'cultura-plato.jpg', 0, true) ON CONFLICT ("id") DO NOTHING;
INSERT INTO "establecimiento_fotos" ("id", "establecimientoId", "url", "orden", "esPortada") VALUES (6, 5, 'cultura-plato.jpg', 0, true) ON CONFLICT ("id") DO NOTHING;
INSERT INTO "establecimiento_fotos" ("id", "establecimientoId", "url", "orden", "esPortada") VALUES (7, 5, 'iglesia-plato.jpg', 1, false) ON CONFLICT ("id") DO NOTHING;
INSERT INTO "establecimiento_fotos" ("id", "establecimientoId", "url", "orden", "esPortada") VALUES (8, 5, 'hombre-caiman.jpg', 2, false) ON CONFLICT ("id") DO NOTHING;
INSERT INTO "establecimiento_fotos" ("id", "establecimientoId", "url", "orden", "esPortada") VALUES (9, 6, 'iglesia-fachada.jpg', 0, true) ON CONFLICT ("id") DO NOTHING;
INSERT INTO "establecimiento_fotos" ("id", "establecimientoId", "url", "orden", "esPortada") VALUES (10, 6, 'collage-plato.jpg', 1, false) ON CONFLICT ("id") DO NOTHING;
INSERT INTO "establecimiento_fotos" ("id", "establecimientoId", "url", "orden", "esPortada") VALUES (11, 7, 'iglesia-plato.jpg', 0, true) ON CONFLICT ("id") DO NOTHING;
INSERT INTO "establecimiento_fotos" ("id", "establecimientoId", "url", "orden", "esPortada") VALUES (12, 7, 'cultura-plato.jpg', 1, false) ON CONFLICT ("id") DO NOTHING;
INSERT INTO "establecimiento_fotos" ("id", "establecimientoId", "url", "orden", "esPortada") VALUES (13, 8, 'cultura/cultura-rio-atardecer.jpg', 0, true) ON CONFLICT ("id") DO NOTHING;
INSERT INTO "establecimiento_fotos" ("id", "establecimientoId", "url", "orden", "esPortada") VALUES (14, 8, 'cultura-plato.jpg', 1, false) ON CONFLICT ("id") DO NOTHING;
INSERT INTO "establecimiento_fotos" ("id", "establecimientoId", "url", "orden", "esPortada") VALUES (15, 9, 'hombre-caiman.jpg', 0, true) ON CONFLICT ("id") DO NOTHING;
INSERT INTO "establecimiento_fotos" ("id", "establecimientoId", "url", "orden", "esPortada") VALUES (16, 9, 'collage-plato.jpg', 1, false) ON CONFLICT ("id") DO NOTHING;
INSERT INTO "establecimiento_fotos" ("id", "establecimientoId", "url", "orden", "esPortada") VALUES (17, 10, 'iglesia-fachada.jpg', 0, true) ON CONFLICT ("id") DO NOTHING;
INSERT INTO "establecimiento_fotos" ("id", "establecimientoId", "url", "orden", "esPortada") VALUES (18, 10, 'cultura/cultura-plaza-aerea.jpg', 1, false) ON CONFLICT ("id") DO NOTHING;
INSERT INTO "establecimiento_fotos" ("id", "establecimientoId", "url", "orden", "esPortada") VALUES (19, 11, 'cultura/cultura-pueblo-cienaga.jpg', 0, true) ON CONFLICT ("id") DO NOTHING;
INSERT INTO "establecimiento_fotos" ("id", "establecimientoId", "url", "orden", "esPortada") VALUES (20, 11, 'cultura/cultura-canoas-rio.jpg', 1, false) ON CONFLICT ("id") DO NOTHING;
INSERT INTO "establecimiento_fotos" ("id", "establecimientoId", "url", "orden", "esPortada") VALUES (21, 12, 'cultura/cultura-ocaso-iglesia-rio.jpg', 0, true) ON CONFLICT ("id") DO NOTHING;
INSERT INTO "establecimiento_fotos" ("id", "establecimientoId", "url", "orden", "esPortada") VALUES (22, 12, 'cultura/cultura-puente-magdalena.jpg', 1, false) ON CONFLICT ("id") DO NOTHING;
INSERT INTO "establecimiento_fotos" ("id", "establecimientoId", "url", "orden", "esPortada") VALUES (23, 13, 'cultura/cultura-puente-magdalena.jpg', 0, true) ON CONFLICT ("id") DO NOTHING;
INSERT INTO "establecimiento_fotos" ("id", "establecimientoId", "url", "orden", "esPortada") VALUES (24, 13, 'cultura/cultura-rio-atardecer.jpg', 1, false) ON CONFLICT ("id") DO NOTHING;
SELECT setval('establecimiento_fotos_id_seq', (SELECT COALESCE(MAX(id), 1) FROM "establecimiento_fotos"));

-- 3.6. REDES SOCIALES
-- 3.7. RELACIÓN ESTABLECIMIENTO - SERVICIOS
INSERT INTO "establecimiento_servicios" ("establecimientoId", "servicioId") VALUES (4, 1) ON CONFLICT DO NOTHING;
INSERT INTO "establecimiento_servicios" ("establecimientoId", "servicioId") VALUES (4, 6) ON CONFLICT DO NOTHING;
INSERT INTO "establecimiento_servicios" ("establecimientoId", "servicioId") VALUES (5, 1) ON CONFLICT DO NOTHING;
INSERT INTO "establecimiento_servicios" ("establecimientoId", "servicioId") VALUES (5, 2) ON CONFLICT DO NOTHING;
INSERT INTO "establecimiento_servicios" ("establecimientoId", "servicioId") VALUES (5, 8) ON CONFLICT DO NOTHING;
INSERT INTO "establecimiento_servicios" ("establecimientoId", "servicioId") VALUES (5, 4) ON CONFLICT DO NOTHING;
INSERT INTO "establecimiento_servicios" ("establecimientoId", "servicioId") VALUES (5, 6) ON CONFLICT DO NOTHING;
INSERT INTO "establecimiento_servicios" ("establecimientoId", "servicioId") VALUES (6, 5) ON CONFLICT DO NOTHING;
INSERT INTO "establecimiento_servicios" ("establecimientoId", "servicioId") VALUES (6, 2) ON CONFLICT DO NOTHING;
INSERT INTO "establecimiento_servicios" ("establecimientoId", "servicioId") VALUES (7, 9) ON CONFLICT DO NOTHING;
INSERT INTO "establecimiento_servicios" ("establecimientoId", "servicioId") VALUES (7, 10) ON CONFLICT DO NOTHING;
INSERT INTO "establecimiento_servicios" ("establecimientoId", "servicioId") VALUES (7, 6) ON CONFLICT DO NOTHING;
INSERT INTO "establecimiento_servicios" ("establecimientoId", "servicioId") VALUES (8, 9) ON CONFLICT DO NOTHING;
INSERT INTO "establecimiento_servicios" ("establecimientoId", "servicioId") VALUES (8, 8) ON CONFLICT DO NOTHING;
INSERT INTO "establecimiento_servicios" ("establecimientoId", "servicioId") VALUES (8, 2) ON CONFLICT DO NOTHING;
INSERT INTO "establecimiento_servicios" ("establecimientoId", "servicioId") VALUES (8, 6) ON CONFLICT DO NOTHING;
INSERT INTO "establecimiento_servicios" ("establecimientoId", "servicioId") VALUES (9, 8) ON CONFLICT DO NOTHING;
INSERT INTO "establecimiento_servicios" ("establecimientoId", "servicioId") VALUES (9, 4) ON CONFLICT DO NOTHING;
INSERT INTO "establecimiento_servicios" ("establecimientoId", "servicioId") VALUES (9, 2) ON CONFLICT DO NOTHING;
INSERT INTO "establecimiento_servicios" ("establecimientoId", "servicioId") VALUES (9, 6) ON CONFLICT DO NOTHING;
INSERT INTO "establecimiento_servicios" ("establecimientoId", "servicioId") VALUES (10, 8) ON CONFLICT DO NOTHING;
INSERT INTO "establecimiento_servicios" ("establecimientoId", "servicioId") VALUES (10, 6) ON CONFLICT DO NOTHING;
INSERT INTO "establecimiento_servicios" ("establecimientoId", "servicioId") VALUES (10, 2) ON CONFLICT DO NOTHING;
INSERT INTO "establecimiento_servicios" ("establecimientoId", "servicioId") VALUES (11, 9) ON CONFLICT DO NOTHING;
INSERT INTO "establecimiento_servicios" ("establecimientoId", "servicioId") VALUES (11, 10) ON CONFLICT DO NOTHING;
INSERT INTO "establecimiento_servicios" ("establecimientoId", "servicioId") VALUES (11, 1) ON CONFLICT DO NOTHING;
INSERT INTO "establecimiento_servicios" ("establecimientoId", "servicioId") VALUES (11, 2) ON CONFLICT DO NOTHING;
INSERT INTO "establecimiento_servicios" ("establecimientoId", "servicioId") VALUES (11, 4) ON CONFLICT DO NOTHING;
INSERT INTO "establecimiento_servicios" ("establecimientoId", "servicioId") VALUES (12, 1) ON CONFLICT DO NOTHING;
INSERT INTO "establecimiento_servicios" ("establecimientoId", "servicioId") VALUES (12, 10) ON CONFLICT DO NOTHING;
INSERT INTO "establecimiento_servicios" ("establecimientoId", "servicioId") VALUES (12, 4) ON CONFLICT DO NOTHING;
INSERT INTO "establecimiento_servicios" ("establecimientoId", "servicioId") VALUES (12, 6) ON CONFLICT DO NOTHING;
INSERT INTO "establecimiento_servicios" ("establecimientoId", "servicioId") VALUES (12, 2) ON CONFLICT DO NOTHING;
INSERT INTO "establecimiento_servicios" ("establecimientoId", "servicioId") VALUES (13, 9) ON CONFLICT DO NOTHING;
INSERT INTO "establecimiento_servicios" ("establecimientoId", "servicioId") VALUES (13, 2) ON CONFLICT DO NOTHING;
INSERT INTO "establecimiento_servicios" ("establecimientoId", "servicioId") VALUES (13, 6) ON CONFLICT DO NOTHING;
INSERT INTO "establecimiento_servicios" ("establecimientoId", "servicioId") VALUES (14, 1) ON CONFLICT DO NOTHING;
INSERT INTO "establecimiento_servicios" ("establecimientoId", "servicioId") VALUES (14, 6) ON CONFLICT DO NOTHING;
INSERT INTO "establecimiento_servicios" ("establecimientoId", "servicioId") VALUES (15, 6) ON CONFLICT DO NOTHING;
INSERT INTO "establecimiento_servicios" ("establecimientoId", "servicioId") VALUES (16, 6) ON CONFLICT DO NOTHING;
INSERT INTO "establecimiento_servicios" ("establecimientoId", "servicioId") VALUES (16, 25) ON CONFLICT DO NOTHING;
INSERT INTO "establecimiento_servicios" ("establecimientoId", "servicioId") VALUES (17, 6) ON CONFLICT DO NOTHING;
INSERT INTO "establecimiento_servicios" ("establecimientoId", "servicioId") VALUES (17, 25) ON CONFLICT DO NOTHING;
INSERT INTO "establecimiento_servicios" ("establecimientoId", "servicioId") VALUES (19, 6) ON CONFLICT DO NOTHING;
INSERT INTO "establecimiento_servicios" ("establecimientoId", "servicioId") VALUES (19, 25) ON CONFLICT DO NOTHING;
INSERT INTO "establecimiento_servicios" ("establecimientoId", "servicioId") VALUES (20, 6) ON CONFLICT DO NOTHING;
INSERT INTO "establecimiento_servicios" ("establecimientoId", "servicioId") VALUES (20, 25) ON CONFLICT DO NOTHING;
INSERT INTO "establecimiento_servicios" ("establecimientoId", "servicioId") VALUES (21, 6) ON CONFLICT DO NOTHING;
INSERT INTO "establecimiento_servicios" ("establecimientoId", "servicioId") VALUES (21, 25) ON CONFLICT DO NOTHING;
INSERT INTO "establecimiento_servicios" ("establecimientoId", "servicioId") VALUES (22, 6) ON CONFLICT DO NOTHING;
INSERT INTO "establecimiento_servicios" ("establecimientoId", "servicioId") VALUES (22, 25) ON CONFLICT DO NOTHING;
INSERT INTO "establecimiento_servicios" ("establecimientoId", "servicioId") VALUES (23, 6) ON CONFLICT DO NOTHING;
INSERT INTO "establecimiento_servicios" ("establecimientoId", "servicioId") VALUES (23, 25) ON CONFLICT DO NOTHING;
INSERT INTO "establecimiento_servicios" ("establecimientoId", "servicioId") VALUES (24, 6) ON CONFLICT DO NOTHING;
INSERT INTO "establecimiento_servicios" ("establecimientoId", "servicioId") VALUES (24, 25) ON CONFLICT DO NOTHING;
INSERT INTO "establecimiento_servicios" ("establecimientoId", "servicioId") VALUES (25, 6) ON CONFLICT DO NOTHING;
INSERT INTO "establecimiento_servicios" ("establecimientoId", "servicioId") VALUES (25, 25) ON CONFLICT DO NOTHING;
INSERT INTO "establecimiento_servicios" ("establecimientoId", "servicioId") VALUES (26, 6) ON CONFLICT DO NOTHING;
INSERT INTO "establecimiento_servicios" ("establecimientoId", "servicioId") VALUES (26, 25) ON CONFLICT DO NOTHING;
INSERT INTO "establecimiento_servicios" ("establecimientoId", "servicioId") VALUES (27, 6) ON CONFLICT DO NOTHING;
INSERT INTO "establecimiento_servicios" ("establecimientoId", "servicioId") VALUES (27, 25) ON CONFLICT DO NOTHING;
INSERT INTO "establecimiento_servicios" ("establecimientoId", "servicioId") VALUES (28, 6) ON CONFLICT DO NOTHING;
INSERT INTO "establecimiento_servicios" ("establecimientoId", "servicioId") VALUES (28, 25) ON CONFLICT DO NOTHING;
INSERT INTO "establecimiento_servicios" ("establecimientoId", "servicioId") VALUES (29, 6) ON CONFLICT DO NOTHING;
INSERT INTO "establecimiento_servicios" ("establecimientoId", "servicioId") VALUES (29, 25) ON CONFLICT DO NOTHING;
INSERT INTO "establecimiento_servicios" ("establecimientoId", "servicioId") VALUES (30, 6) ON CONFLICT DO NOTHING;
INSERT INTO "establecimiento_servicios" ("establecimientoId", "servicioId") VALUES (30, 25) ON CONFLICT DO NOTHING;
INSERT INTO "establecimiento_servicios" ("establecimientoId", "servicioId") VALUES (31, 6) ON CONFLICT DO NOTHING;
INSERT INTO "establecimiento_servicios" ("establecimientoId", "servicioId") VALUES (31, 25) ON CONFLICT DO NOTHING;
INSERT INTO "establecimiento_servicios" ("establecimientoId", "servicioId") VALUES (32, 25) ON CONFLICT DO NOTHING;
INSERT INTO "establecimiento_servicios" ("establecimientoId", "servicioId") VALUES (33, 6) ON CONFLICT DO NOTHING;
INSERT INTO "establecimiento_servicios" ("establecimientoId", "servicioId") VALUES (33, 25) ON CONFLICT DO NOTHING;
INSERT INTO "establecimiento_servicios" ("establecimientoId", "servicioId") VALUES (34, 6) ON CONFLICT DO NOTHING;
INSERT INTO "establecimiento_servicios" ("establecimientoId", "servicioId") VALUES (34, 25) ON CONFLICT DO NOTHING;

-- 3.8. ENCUESTAS, PREGUNTAS Y OPCIONES
INSERT INTO "encuestas" ("id", "titulo", "descripcion", "activa", "mostrarEnLanding", "creadoEn", "actualizadoEn") VALUES (1, 'Encuesta de Satisfacción Turística - Magdalena', 'Queremos conocer tu opinión para seguir mejorando la oferta turística y cultural de nuestra región.', true, true, '2026-11-13T10:51:19.925Z', '2026-11-13T10:51:19.925Z') ON CONFLICT ("id") DO NOTHING;
INSERT INTO "preguntas" ("id", "encuestaId", "pregunta", "tipoPregunta", "obligatoria", "orden") VALUES (1, 1, '¿Cómo calificarías tu experiencia general en los destinos del Magdalena?', 'calificacion', true, 1) ON CONFLICT ("id") DO NOTHING;
INSERT INTO "preguntas" ("id", "encuestaId", "pregunta", "tipoPregunta", "obligatoria", "orden") VALUES (2, 1, '¿Cuál fue el motivo principal de tu visita?', 'opcion', true, 2) ON CONFLICT ("id") DO NOTHING;
INSERT INTO "opciones_pregunta" ("id", "preguntaId", "texto", "orden") VALUES (1, 2, 'Vacaciones, descanso y ecoturismo', 1) ON CONFLICT ("id") DO NOTHING;
INSERT INTO "opciones_pregunta" ("id", "preguntaId", "texto", "orden") VALUES (2, 2, 'Cultura, gastronomía y patrimonio', 2) ON CONFLICT ("id") DO NOTHING;
INSERT INTO "opciones_pregunta" ("id", "preguntaId", "texto", "orden") VALUES (3, 2, 'Negocios, trabajo o eventos', 3) ON CONFLICT ("id") DO NOTHING;
INSERT INTO "opciones_pregunta" ("id", "preguntaId", "texto", "orden") VALUES (4, 2, 'Visita a familiares y amigos', 4) ON CONFLICT ("id") DO NOTHING;
INSERT INTO "preguntas" ("id", "encuestaId", "pregunta", "tipoPregunta", "obligatoria", "orden") VALUES (3, 1, '¿Qué tipo de hospedaje prefieres utilizar?', 'opcion', true, 3) ON CONFLICT ("id") DO NOTHING;
INSERT INTO "opciones_pregunta" ("id", "preguntaId", "texto", "orden") VALUES (5, 3, 'Hotel convencional', 1) ON CONFLICT ("id") DO NOTHING;
INSERT INTO "opciones_pregunta" ("id", "preguntaId", "texto", "orden") VALUES (6, 3, 'Cabaña campestre / Ecolodge', 2) ON CONFLICT ("id") DO NOTHING;
INSERT INTO "opciones_pregunta" ("id", "preguntaId", "texto", "orden") VALUES (7, 3, 'Apartamento turístico', 3) ON CONFLICT ("id") DO NOTHING;
INSERT INTO "preguntas" ("id", "encuestaId", "pregunta", "tipoPregunta", "obligatoria", "orden") VALUES (4, 1, '¿Qué sugerencias o recomendaciones tienes para mejorar los servicios turísticos?', 'texto', false, 4) ON CONFLICT ("id") DO NOTHING;
SELECT setval('encuestas_id_seq', (SELECT COALESCE(MAX(id), 1) FROM "encuestas"));
SELECT setval('preguntas_id_seq', (SELECT COALESCE(MAX(id), 1) FROM "preguntas"));
SELECT setval('opciones_pregunta_id_seq', (SELECT COALESCE(MAX(id), 1) FROM "opciones_pregunta"));

