-- ==============================================================================
-- SCRIPT SQL COMPLETO: BASE DE DATOS TURISMO MAGDALENA (PLATO 400 AÑOS)
-- PostgreSQL 14+ / Prisma Compatible
-- ==============================================================================

-- 1. CREACIÓN DE TIPOS ENUMERADOS (ENUMS)
-- ------------------------------------------------------------------------------
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'Rol') THEN
        CREATE TYPE "Rol" AS ENUM ('ADMIN', 'GESTOR');
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'TipoTarjeta') THEN
        CREATE TYPE "TipoTarjeta" AS ENUM ('HOTEL', 'CABANA', 'RESTAURANTE');
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'PlataformaRedSocial') THEN
        CREATE TYPE "PlataformaRedSocial" AS ENUM ('Instagram', 'Facebook', 'TikTok', 'X', 'YouTube');
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'TipoPregunta') THEN
        CREATE TYPE "TipoPregunta" AS ENUM ('opcion', 'texto', 'calificacion');
    END IF;
END $$;

-- 2. CREACIÓN DE TABLAS
-- ------------------------------------------------------------------------------

-- Tabla: usuarios
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

-- Tabla: municipios
CREATE TABLE IF NOT EXISTS "municipios" (
    "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "codigo" TEXT UNIQUE,
    "nombre" TEXT NOT NULL UNIQUE,
    "ciudad" TEXT,
    "departamento" TEXT NOT NULL DEFAULT 'Magdalena'
);

-- Tabla: servicios
CREATE TABLE IF NOT EXISTS "servicios" (
    "id" SERIAL PRIMARY KEY,
    "nombre" TEXT NOT NULL UNIQUE,
    "nombreEn" TEXT,
    "icono" TEXT,
    "tipo" "TipoTarjeta"
);

-- Tabla: establecimientos (Hoteles, Cabañas, Restaurantes)
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

-- Tabla: redes_sociales
CREATE TABLE IF NOT EXISTS "redes_sociales" (
    "id" SERIAL PRIMARY KEY,
    "establecimientoId" INTEGER NOT NULL REFERENCES "establecimientos"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    "plataforma" "PlataformaRedSocial" NOT NULL,
    "url" TEXT NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Tabla: establecimiento_fotos
CREATE TABLE IF NOT EXISTS "establecimiento_fotos" (
    "id" SERIAL PRIMARY KEY,
    "establecimientoId" INTEGER NOT NULL REFERENCES "establecimientos"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    "url" TEXT NOT NULL,
    "orden" INTEGER NOT NULL DEFAULT 0,
    "esPortada" BOOLEAN NOT NULL DEFAULT false
);

-- Tabla: establecimiento_servicios (Relación N a N)
CREATE TABLE IF NOT EXISTS "establecimiento_servicios" (
    "establecimientoId" INTEGER NOT NULL REFERENCES "establecimientos"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    "servicioId" INTEGER NOT NULL REFERENCES "servicios"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    PRIMARY KEY ("establecimientoId", "servicioId")
);

-- Tabla: encuestas
CREATE TABLE IF NOT EXISTS "encuestas" (
    "id" SERIAL PRIMARY KEY,
    "titulo" TEXT NOT NULL,
    "descripcion" TEXT,
    "activa" BOOLEAN NOT NULL DEFAULT true,
    "mostrarEnLanding" BOOLEAN NOT NULL DEFAULT false,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Tabla: preguntas
CREATE TABLE IF NOT EXISTS "preguntas" (
    "id" SERIAL PRIMARY KEY,
    "encuestaId" INTEGER NOT NULL REFERENCES "encuestas"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    "pregunta" TEXT NOT NULL,
    "tipoPregunta" "TipoPregunta" NOT NULL DEFAULT 'opcion',
    "obligatoria" BOOLEAN NOT NULL DEFAULT true,
    "orden" INTEGER NOT NULL DEFAULT 0
);

-- Tabla: opciones_pregunta
CREATE TABLE IF NOT EXISTS "opciones_pregunta" (
    "id" SERIAL PRIMARY KEY,
    "preguntaId" INTEGER NOT NULL REFERENCES "preguntas"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    "texto" TEXT NOT NULL,
    "orden" INTEGER NOT NULL DEFAULT 0
);

-- Tabla: respuestas_encuesta
CREATE TABLE IF NOT EXISTS "respuestas_encuesta" (
    "id" SERIAL PRIMARY KEY,
    "encuestaId" INTEGER NOT NULL REFERENCES "encuestas"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    "fechaRespuesta" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Tabla: detalle_respuestas
CREATE TABLE IF NOT EXISTS "detalle_respuestas" (
    "id" SERIAL PRIMARY KEY,
    "respuestaEncuestaId" INTEGER NOT NULL REFERENCES "respuestas_encuesta"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    "preguntaId" INTEGER NOT NULL REFERENCES "preguntas"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    "opcionId" INTEGER REFERENCES "opciones_pregunta"("id") ON DELETE SET NULL ON UPDATE CASCADE,
    "respuestaTexto" TEXT
);

-- ==============================================================================
-- 3. DATOS INICIALES (SEED DATA)
-- ==============================================================================

-- 3.1. USUARIOS DEL SISTEMA
-- Contraseña para admin: admin2026
-- Contraseña para gestor: gestor2026
INSERT INTO "usuarios" ("correo", "nombreCompleto", "passwordHash", "rol", "activo", "debeCambiarPassword")
VALUES 
('admin@turismo.magdalena.gov.co', 'Administrador del Sistema', 'scrypt$4e9e4f5277a433286c79b601105b9a73$c106ae1c373a344428c0d6607ede3b4afd3b25aca7b9288b30e8031823fd9460a356a5f70be2d3be8e6793a65b72292fa96d885f2d16fd8c158cc10fc814ccb2', 'ADMIN', true, false),
('gestor@turismo.magdalena.gov.co', 'Gestor de Turismo y Contenidos', 'scrypt$099eb0262a1d53abbf4b2dc2f1aed61f$5a006552f468fc3c2eab52fd32247e389ebee0f36a745e6ff5595406852fe695fd2e89aa3ef5c1ef67f2af7abe03ff34dc6d307e6ceb772eaec6786bbc1cef8d', 'GESTOR', true, false)
ON CONFLICT ("correo") DO NOTHING;

-- 3.2. MUNICIPIOS DEL MAGDALENA
INSERT INTO "municipios" ("nombre", "ciudad", "departamento")
VALUES
('Plato', 'Plato', 'Magdalena'),
('Santa Marta', 'Santa Marta', 'Magdalena'),
('Ciénaga', 'Ciénaga', 'Magdalena'),
('Aracataca', 'Aracataca', 'Magdalena'),
('El Banco', 'El Banco', 'Magdalena'),
('Fundación', 'Fundación', 'Magdalena'),
('Pivijay', 'Pivijay', 'Magdalena'),
('Zona Bananera', 'Zona Bananera', 'Magdalena'),
('Salamina', 'Salamina', 'Magdalena'),
('Sitio Nuevo', 'Sitio Nuevo', 'Magdalena'),
('Guamal', 'Guamal', 'Magdalena'),
('San Sebastián de Buenavista', 'San Sebastián de Buenavista', 'Magdalena'),
('Chibolo', 'Chibolo', 'Magdalena'),
('Tenerife', 'Tenerife', 'Magdalena'),
('Nueva Granada', 'Nueva Granada', 'Magdalena'),
('Remolino', 'Remolino', 'Magdalena'),
('Concordia', 'Concordia', 'Magdalena')
ON CONFLICT ("nombre") DO NOTHING;

-- 3.3. SERVICIOS Y COMODIDADES
INSERT INTO "servicios" ("nombre", "nombreEn", "icono")
VALUES
('Piscina', 'Pool', 'pool'),
('Aire acondicionado', 'Air Conditioning', 'ac'),
('Parqueadero privado', 'Private Parking', 'parking'),
('Parqueadero', 'Parking', 'parking'),
('Wifi de alta velocidad', 'High-Speed Wi-Fi', 'wifi'),
('Wifi', 'Wi-Fi', 'wifi'),
('Restaurante / Bar', 'Restaurant / Bar', 'restaurant'),
('Restaurante', 'Restaurant', 'restaurant'),
('Vista al río', 'River View', 'river_view'),
('Zona campestre', 'Countryside Area', 'countryside'),
('Recepción 24 horas', '24-Hour Front Desk', 'front_desk'),
('Desayuno incluido', 'Breakfast Included', 'breakfast')
ON CONFLICT ("nombre") DO NOTHING;

-- 3.4. ESTABLECIMIENTOS INICIALES (Hoteles, Restaurantes, Cabañas de Plato)
INSERT INTO "establecimientos" (
    "id", "tipo", "nombre", "municipioCodigo", "estrellas", "resena", "resenaEn",
    "whatsapp", "facebookUrl", "instagramUrl", "xUrl", "ubicacionUrl", "latitud", "longitud", "disponible", "usuarioId"
) VALUES 
(1, 'HOTEL', 'Hotel Los Recuerdos', 'Plato', 4, 
 'Tradición y confort en el corazón de Plato. Habitaciones amplias con aire acondicionado, piscina para refrescarse del clima cálido, restaurante de comida típica y parqueadero seguro.',
 'Tradition and comfort in the heart of Plato. Spacious air-conditioned rooms, a refreshing outdoor pool, typical regional restaurant, and secure parking.',
 '573000000001', 'https://www.facebook.com/hotellosrecuerdosplato', 'https://www.instagram.com/hotellosrecuerdos', NULL,
 'https://www.google.com/maps/search/?api=1&query=Hotel+Los+Recuerdos+Plato+Magdalena', 9.7925, -74.7812, true, 1),

(2, 'HOTEL', 'Hotel San Martín', 'Plato', 3,
 'Hospedaje céntrico y acogedor, a solo pasos de la plaza principal y del comercio. Ideal para estancias de negocios o turismo durante las fiestas de los 400 años.',
 'Central and welcoming stay, just steps from the main square and downtown commerce. Ideal for business or leisure travelers visiting Plato.',
 '573000000002', 'https://www.facebook.com/hotelsanmartinplato', 'https://www.instagram.com/hotelsanmartinplato', NULL,
 'https://www.google.com/maps/search/?api=1&query=Hotel+San+Martin+Plato+Magdalena', 9.7891, -74.784, true, 1),

(3, 'HOTEL', 'Hotel Posada del Río', 'Plato', 3,
 'Tranquilidad frente al majestuoso río Magdalena. Hermosas vistas del atardecer ribereño, zonas de descanso campestres y la mejor atención de la región.',
 'Tranquility facing the majestic Magdalena River. Beautiful river sunset views, countryside relaxation areas, and the warmest local hospitality.',
 '573000000003', 'https://www.facebook.com/posadadelrioplato', 'https://www.instagram.com/posadadelrioplato', NULL,
 'https://www.google.com/maps/search/?api=1&query=Posada+del+Rio+Plato+Magdalena', 9.794, -74.7865, false, 1),

(4, 'RESTAURANTE', 'Restaurante Fogón del Magdalena', 'Plato', 5,
 'Cocina tradicional ribereña frente al río Grande: bocachico en cabrito, viuda de pescado, cayeye con queso costeño y jugos de corozo fresco.',
 'Traditional riverside cuisine along the Magdalena: roasted bocachico fish, local viuda stew, plantain cayeye with coastal cheese, and fresh corozo juice.',
 '573000000004', NULL, 'https://www.instagram.com/fogondelmagdalena', NULL,
 'https://www.google.com/maps/search/?api=1&query=Plato+Magdalena+Restaurante+Fogon', 9.7918, -74.7848, true, 1),

(5, 'RESTAURANTE', 'Asados & Sabores El Caimán', 'Plato', 4,
 'Cortes al carbón, sancocho de gallina criolla y arepas de huevo artesanales a pocos pasos del Parque del Hombre Caimán en ambiente familiar.',
 'Charcoal-grilled cuts, traditional creole hen stew, and handmade arepas de huevo steps from Hombre Caimán Park in a warm family atmosphere.',
 '573000000005', 'https://www.facebook.com/asadoselcaimanplato', 'https://www.instagram.com/asadoselcaimanplato', NULL,
 'https://www.google.com/maps/search/?api=1&query=Parque+Hombre+Caiman+Plato+Magdalena', 9.7909, -74.7853, true, 1),

(6, 'RESTAURANTE', 'Café & Dulcería La Inmaculada', 'Plato', 4,
 'Dulcería típica plateña, enyucado horneado, cocadas, café de la sierra y desayunos tradicionales con vista a la plaza central.',
 'Authentic Plato sweets, baked enyucado, coconut candies, Sierra coffee, and hearty traditional breakfasts overlooking the main plaza.',
 '573000000006', NULL, 'https://www.instagram.com/cafelainmaculadaplato', NULL,
 'https://www.google.com/maps/search/?api=1&query=Iglesia+Inmaculada+Concepcion+Plato+Magdalena', 9.7905, -74.7851, true, 1),

(7, 'CABANA', 'Cabañas Brisas de la Ciénaga', 'Plato', 5,
 'Cabañas ecológicas de madera y palma rodeadas de espejos de agua, amaneceres tranquilos, hamacas privadas y recorridos guiados en canoa.',
 'Eco-friendly wood and palm cabins surrounded by tranquil wetlands, peaceful sunrises, private hammocks, and guided canoe tours.',
 '573000000007', NULL, 'https://www.instagram.com/brisasdelacienagaplato', NULL,
 'https://www.google.com/maps/search/?api=1&query=Cienaga+Plato+Magdalena', 9.7962, -74.7891, true, 1),

(8, 'CABANA', 'Finca Eco-Cabañas El Manglar', 'Plato', 4,
 'Refugio campestre ideal para familias y grupos en la tierra del Caimán: amplios jardines, piscina al aire libre, cocina equipada y fogata nocturna.',
 'Countryside retreat ideal for families and groups in the land of the Caimán: spacious gardens, outdoor pool, full kitchen, and evening firepit.',
 '573000000008', 'https://www.facebook.com/fincaelmanglarplato', NULL, NULL,
 'https://www.google.com/maps/search/?api=1&query=Finca+Plato+Magdalena', 9.7875, -74.7808, true, 1),

(9, 'CABANA', 'Cabañas Mirador del Puente', 'Plato', 4,
 'Cabañas elevadas con terraza privada hacia el Puente Antonio Escobar Camargo, diseñadas para descansar escuchando la brisa del Magdalena.',
 'Elevated cabins with private terraces facing the Antonio Escobar Camargo Bridge, designed for peaceful stays in the Magdalena River breeze.',
 '573000000009', NULL, 'https://www.instagram.com/miradordelpuenteplato', NULL,
 'https://www.google.com/maps/search/?api=1&query=Puente+Plato+Magdalena', 9.7931, -74.7924, false, 1)
ON CONFLICT ("id") DO NOTHING;

-- Ajustar la secuencia de IDs de establecimientos
SELECT setval('establecimientos_id_seq', (SELECT COALESCE(MAX(id), 1) FROM "establecimientos"));

-- 3.5. FOTOS DE ESTABLECIMIENTOS
INSERT INTO "establecimiento_fotos" ("establecimientoId", "url", "orden", "esPortada")
VALUES
(1, 'cultura-plato.jpg', 0, true),
(1, 'iglesia-plato.jpg', 1, false),
(1, 'hombre-caiman.jpg', 2, false),
(2, 'iglesia-fachada.jpg', 0, true),
(2, 'collage-plato.jpg', 1, false),
(3, 'iglesia-plato.jpg', 0, true),
(3, 'cultura-plato.jpg', 1, false),
(4, 'cultura/cultura-rio-atardecer.jpg', 0, true),
(4, 'cultura-plato.jpg', 1, false),
(5, 'hombre-caiman.jpg', 0, true),
(5, 'collage-plato.jpg', 1, false),
(6, 'iglesia-fachada.jpg', 0, true),
(6, 'cultura/cultura-plaza-aerea.jpg', 1, false),
(7, 'cultura/cultura-pueblo-cienaga.jpg', 0, true),
(7, 'cultura/cultura-canoas-rio.jpg', 1, false),
(8, 'cultura/cultura-ocaso-iglesia-rio.jpg', 0, true),
(8, 'cultura/cultura-puente-magdalena.jpg', 1, false),
(9, 'cultura/cultura-puente-magdalena.jpg', 0, true),
(9, 'cultura/cultura-rio-atardecer.jpg', 1, false)
ON CONFLICT DO NOTHING;

-- 3.6. ASOCIACIÓN ESTABLECIMIENTO - SERVICIOS
INSERT INTO "establecimiento_servicios" ("establecimientoId", "servicioId")
SELECT e.id, s.id
FROM (VALUES
    (1, 'Piscina'), (1, 'Aire acondicionado'), (1, 'Restaurante'), (1, 'Parqueadero'), (1, 'Wifi'),
    (2, 'Wifi de alta velocidad'), (2, 'Aire acondicionado'),
    (3, 'Vista al río'), (3, 'Zona campestre'), (3, 'Wifi'),
    (4, 'Vista al río'), (4, 'Restaurante'), (4, 'Aire acondicionado'), (4, 'Wifi'),
    (5, 'Restaurante'), (5, 'Parqueadero'), (5, 'Aire acondicionado'), (5, 'Wifi'),
    (6, 'Restaurante'), (6, 'Wifi'), (6, 'Aire acondicionado'),
    (7, 'Vista al río'), (7, 'Zona campestre'), (7, 'Piscina'), (7, 'Aire acondicionado'), (7, 'Parqueadero'),
    (8, 'Piscina'), (8, 'Zona campestre'), (8, 'Parqueadero'), (8, 'Wifi'), (8, 'Aire acondicionado'),
    (9, 'Vista al río'), (9, 'Aire acondicionado'), (9, 'Wifi')
) AS v(establecimientoId, servicioNombre)
JOIN "establecimientos" e ON e.id = v.establecimientoId
JOIN "servicios" s ON s.nombre = v.servicioNombre
ON CONFLICT DO NOTHING;

-- 3.7. ENCUESTA INICIAL Y PREGUNTAS
INSERT INTO "encuestas" ("id", "titulo", "descripcion", "activa", "mostrarEnLanding")
VALUES (1, 'Encuesta de Satisfacción Turística - Magdalena', 'Queremos conocer tu opinión para seguir mejorando la oferta turística y cultural de nuestra región.', true, true)
ON CONFLICT ("id") DO NOTHING;

SELECT setval('encuestas_id_seq', (SELECT COALESCE(MAX(id), 1) FROM "encuestas"));

INSERT INTO "preguntas" ("id", "encuestaId", "pregunta", "tipoPregunta", "obligatoria", "orden")
VALUES 
(1, 1, '¿Cómo calificarías tu experiencia general en los destinos del Magdalena?', 'calificacion', true, 1),
(2, 1, '¿Cuál fue el motivo principal de tu visita?', 'opcion', true, 2),
(3, 1, '¿Qué tipo de hospedaje prefieres utilizar?', 'opcion', true, 3),
(4, 1, '¿Qué sugerencias o recomendaciones tienes para mejorar los servicios turísticos?', 'texto', false, 4)
ON CONFLICT ("id") DO NOTHING;

SELECT setval('preguntas_id_seq', (SELECT COALESCE(MAX(id), 1) FROM "preguntas"));

INSERT INTO "opciones_pregunta" ("preguntaId", "texto", "orden")
VALUES
(2, 'Vacaciones, descanso y ecoturismo', 1),
(2, 'Cultura, gastronomía y patrimonio', 2),
(2, 'Negocios, trabajo o eventos', 3),
(2, 'Visita a familiares y amigos', 4),
(3, 'Hotel convencional', 1),
(3, 'Cabaña campestre / Ecolodge', 2),
(3, 'Apartamento turístico', 3)
ON CONFLICT DO NOTHING;
