import { randomBytes, scryptSync } from 'node:crypto';
import { PrismaClient, Rol, TipoTarjeta, TipoPregunta } from '@prisma/client';

const prisma = new PrismaClient();

interface SeedUser {
  correo: string;
  nombreCompleto: string;
  plainPassword: string;
  rol: Rol;
}

interface SeedServicio {
  nombre: string;
  nombreEn: string;
  icono: string;
}

interface SeedHotel {
  tipo: TipoTarjeta;
  nombre: string;
  estrellas: number;
  municipio: string;
  disponible: boolean;
  whatsapp: string;
  facebookUrl?: string;
  instagramUrl?: string;
  xUrl?: string;
  tiktokUrl?: string;
  paginaWebUrl?: string;
  ubicacionUrl: string;
  latitud: number;
  longitud: number;
  resena: string;
  resenaEn: string;
  fotos: string[];
  servicios: string[];
}

/** Hashes a plaintext password using scrypt and a per-user 16-byte random salt. */
function hashPassword(plainText: string): string {
  const salt = randomBytes(16).toString('hex');
  const derivedKey = scryptSync(plainText, salt, 64).toString('hex');
  return `scrypt$${salt}$${derivedKey}`;
}

const DEFAULT_USERS: SeedUser[] = [
  {
    correo: 'admin@turismo.magdalena.gov.co',
    nombreCompleto: 'Administrador del Sistema',
    plainPassword: process.env.SEED_ADMIN_PASSWORD ?? 'admin2026',
    rol: Rol.ADMIN,
  },
  {
    correo: 'gestor@turismo.magdalena.gov.co',
    nombreCompleto: 'Gestor de Turismo y Contenidos',
    plainPassword: process.env.SEED_GESTOR_PASSWORD ?? 'gestor2026',
    rol: Rol.GESTOR,
  },
];

const MUNICIPIOS_MAGDALENA: string[] = [
  'Plato',
  'Santa Marta',
  'Ciénaga',
  'Aracataca',
  'El Banco',
  'Fundación',
  'Pivijay',
  'Zona Bananera',
  'Salamina',
  'Sitio Nuevo',
  'Guamal',
  'San Sebastián de Buenavista',
  'Chibolo',
  'Tenerife',
  'Nueva Granada',
  'Remolino',
  'Concordia',
];

const BASE_SERVICIOS: SeedServicio[] = [
  { nombre: 'Piscina', nombreEn: 'Pool', icono: 'pool' },
  { nombre: 'Aire acondicionado', nombreEn: 'Air Conditioning', icono: 'ac' },
  { nombre: 'Parqueadero privado', nombreEn: 'Private Parking', icono: 'parking' },
  { nombre: 'Parqueadero', nombreEn: 'Parking', icono: 'parking' },
  { nombre: 'Wifi de alta velocidad', nombreEn: 'High-Speed Wi-Fi', icono: 'wifi' },
  { nombre: 'Wifi', nombreEn: 'Wi-Fi', icono: 'wifi' },
  { nombre: 'Restaurante / Bar', nombreEn: 'Restaurant / Bar', icono: 'restaurant' },
  { nombre: 'Restaurante', nombreEn: 'Restaurant', icono: 'restaurant' },
  { nombre: 'Vista al río', nombreEn: 'River View', icono: 'river_view' },
  { nombre: 'Zona campestre', nombreEn: 'Countryside Area', icono: 'countryside' },
  { nombre: 'Recepción 24 horas', nombreEn: '24-Hour Front Desk', icono: 'front_desk' },
  { nombre: 'Desayuno incluido', nombreEn: 'Breakfast Included', icono: 'breakfast' },
];

const INITIAL_HOTELES: SeedHotel[] = [
  {
    tipo: TipoTarjeta.HOTEL,
    nombre: 'Hotel Los Recuerdos',
    estrellas: 4,
    municipio: 'Plato',
    disponible: true,
    whatsapp: '573000000001',
    facebookUrl: 'https://www.facebook.com/hotellosrecuerdosplato',
    instagramUrl: 'https://www.instagram.com/hotellosrecuerdos',
    ubicacionUrl: 'https://www.google.com/maps/search/?api=1&query=Hotel+Los+Recuerdos+Plato+Magdalena',
    latitud: 9.7925,
    longitud: -74.7812,
    resena: 'Tradición y confort en el corazón de Plato. Habitaciones amplias con aire acondicionado, piscina para refrescarse del clima cálido, restaurante de comida típica y parqueadero seguro.',
    resenaEn: 'Tradition and comfort in the heart of Plato. Spacious air-conditioned rooms, a refreshing outdoor pool, typical regional restaurant, and secure parking.',
    fotos: ['cultura-plato.jpg', 'iglesia-plato.jpg', 'hombre-caiman.jpg'],
    servicios: ['Piscina', 'Aire acondicionado', 'Restaurante', 'Parqueadero', 'Wifi'],
  },
  {
    tipo: TipoTarjeta.HOTEL,
    nombre: 'Hotel San Martín',
    estrellas: 3,
    municipio: 'Plato',
    disponible: true,
    whatsapp: '573000000002',
    facebookUrl: 'https://www.facebook.com/hotelsanmartinplato',
    instagramUrl: 'https://www.instagram.com/hotelsanmartinplato',
    ubicacionUrl: 'https://www.google.com/maps/search/?api=1&query=Hotel+San+Martin+Plato+Magdalena',
    latitud: 9.7891,
    longitud: -74.784,
    resena: 'Hospedaje céntrico y acogedor, a solo pasos de la plaza principal y del comercio. Ideal para estancias de negocios o turismo durante las fiestas de los 400 años.',
    resenaEn: 'Central and welcoming stay, just steps from the main square and downtown commerce. Ideal for business or leisure travelers visiting Plato.',
    fotos: ['iglesia-fachada.jpg', 'collage-plato.jpg'],
    servicios: ['Wifi de alta velocidad', 'Aire acondicionado'],
  },
  {
    tipo: TipoTarjeta.HOTEL,
    nombre: 'Hotel Posada del Río',
    estrellas: 3,
    municipio: 'Plato',
    disponible: false,
    whatsapp: '573000000003',
    facebookUrl: 'https://www.facebook.com/posadadelrioplato',
    instagramUrl: 'https://www.instagram.com/posadadelrioplato',
    ubicacionUrl: 'https://www.google.com/maps/search/?api=1&query=Posada+del+Rio+Plato+Magdalena',
    latitud: 9.794,
    longitud: -74.7865,
    resena: 'Tranquilidad frente al majestuoso río Magdalena. Hermosas vistas del atardecer ribereño, zonas de descanso campestres y la mejor atención de la región.',
    resenaEn: 'Tranquility facing the majestic Magdalena River. Beautiful river sunset views, countryside relaxation areas, and the warmest local hospitality.',
    fotos: ['iglesia-plato.jpg', 'cultura-plato.jpg'],
    servicios: ['Vista al río', 'Zona campestre', 'Wifi'],
  },
  {
    tipo: TipoTarjeta.RESTAURANTE,
    nombre: 'Restaurante Fogón del Magdalena',
    estrellas: 5,
    municipio: 'Plato',
    disponible: true,
    whatsapp: '573000000004',
    instagramUrl: 'https://www.instagram.com/fogondelmagdalena',
    ubicacionUrl: 'https://www.google.com/maps/search/?api=1&query=Plato+Magdalena+Restaurante+Fogon',
    latitud: 9.7918,
    longitud: -74.7848,
    resena: 'Cocina tradicional ribereña frente al río Grande: bocachico en cabrito, viuda de pescado, cayeye con queso costeño y jugos de corozo fresco.',
    resenaEn: 'Traditional riverside cuisine along the Magdalena: roasted bocachico fish, local viuda stew, plantain cayeye with coastal cheese, and fresh corozo juice.',
    fotos: ['cultura/cultura-rio-atardecer.jpg', 'cultura-plato.jpg'],
    servicios: ['Vista al río', 'Restaurante', 'Aire acondicionado', 'Wifi'],
  },
  {
    tipo: TipoTarjeta.RESTAURANTE,
    nombre: 'Asados & Sabores El Caimán',
    estrellas: 4,
    municipio: 'Plato',
    disponible: true,
    whatsapp: '573000000005',
    facebookUrl: 'https://www.facebook.com/asadoselcaimanplato',
    instagramUrl: 'https://www.instagram.com/asadoselcaimanplato',
    ubicacionUrl: 'https://www.google.com/maps/search/?api=1&query=Parque+Hombre+Caiman+Plato+Magdalena',
    latitud: 9.7909,
    longitud: -74.7853,
    resena: 'Cortes al carbón, sancocho de gallina criolla y arepas de huevo artesanales a pocos pasos del Parque del Hombre Caimán en ambiente familiar.',
    resenaEn: 'Charcoal-grilled cuts, traditional creole hen stew, and handmade arepas de huevo steps from Hombre Caimán Park in a warm family atmosphere.',
    fotos: ['hombre-caiman.jpg', 'collage-plato.jpg'],
    servicios: ['Restaurante', 'Parqueadero', 'Aire acondicionado', 'Wifi'],
  },
  {
    tipo: TipoTarjeta.RESTAURANTE,
    nombre: 'Café & Dulcería La Inmaculada',
    estrellas: 4,
    municipio: 'Plato',
    disponible: true,
    whatsapp: '573000000006',
    instagramUrl: 'https://www.instagram.com/cafelainmaculadaplato',
    ubicacionUrl: 'https://www.google.com/maps/search/?api=1&query=Iglesia+Inmaculada+Concepcion+Plato+Magdalena',
    latitud: 9.7905,
    longitud: -74.7851,
    resena: 'Dulcería típica plateña, enyucado horneado, cocadas, café de la sierra y desayunos tradicionales con vista a la plaza central.',
    resenaEn: 'Authentic Plato sweets, baked enyucado, coconut candies, Sierra coffee, and hearty traditional breakfasts overlooking the main plaza.',
    fotos: ['iglesia-fachada.jpg', 'cultura/cultura-plaza-aerea.jpg'],
    servicios: ['Restaurante', 'Wifi', 'Aire acondicionado'],
  },
  {
    tipo: TipoTarjeta.CABANA,
    nombre: 'Cabañas Brisas de la Ciénaga',
    estrellas: 5,
    municipio: 'Plato',
    disponible: true,
    whatsapp: '573000000007',
    instagramUrl: 'https://www.instagram.com/brisasdelacienagaplato',
    ubicacionUrl: 'https://www.google.com/maps/search/?api=1&query=Cienaga+Plato+Magdalena',
    latitud: 9.7962,
    longitud: -74.7891,
    resena: 'Cabañas ecológicas de madera y palma rodeadas de espejos de agua, amaneceres tranquilos, hamacas privadas y recorridos guiados en canoa.',
    resenaEn: 'Eco-friendly wood and palm cabins surrounded by tranquil wetlands, peaceful sunrises, private hammocks, and guided canoe tours.',
    fotos: ['cultura/cultura-pueblo-cienaga.jpg', 'cultura/cultura-canoas-rio.jpg'],
    servicios: ['Vista al río', 'Zona campestre', 'Piscina', 'Aire acondicionado', 'Parqueadero'],
  },
  {
    tipo: TipoTarjeta.CABANA,
    nombre: 'Finca Eco-Cabañas El Manglar',
    estrellas: 4,
    municipio: 'Plato',
    disponible: true,
    whatsapp: '573000000008',
    facebookUrl: 'https://www.facebook.com/fincaelmanglarplato',
    ubicacionUrl: 'https://www.google.com/maps/search/?api=1&query=Finca+Plato+Magdalena',
    latitud: 9.7875,
    longitud: -74.7808,
    resena: 'Refugio campestre ideal para familias y grupos en la tierra del Caimán: amplios jardines, piscina al aire libre, cocina equipada y fogata nocturna.',
    resenaEn: 'Countryside retreat ideal for families and groups in the land of the Caimán: spacious gardens, outdoor pool, full kitchen, and evening firepit.',
    fotos: ['cultura/cultura-ocaso-iglesia-rio.jpg', 'cultura/cultura-puente-magdalena.jpg'],
    servicios: ['Piscina', 'Zona campestre', 'Parqueadero', 'Wifi', 'Aire acondicionado'],
  },
  {
    tipo: TipoTarjeta.CABANA,
    nombre: 'Cabañas Mirador del Puente',
    estrellas: 4,
    municipio: 'Plato',
    disponible: false,
    whatsapp: '573000000009',
    instagramUrl: 'https://www.instagram.com/miradordelpuenteplato',
    ubicacionUrl: 'https://www.google.com/maps/search/?api=1&query=Puente+Plato+Magdalena',
    latitud: 9.7931,
    longitud: -74.7924,
    resena: 'Cabañas elevadas con terraza privada hacia el Puente Antonio Escobar Camargo, diseñadas para descansar escuchando la brisa del Magdalena.',
    resenaEn: 'Elevated cabins with private terraces facing the Antonio Escobar Camargo Bridge, designed for peaceful stays in the Magdalena River breeze.',
    fotos: ['cultura/cultura-puente-magdalena.jpg', 'cultura/cultura-rio-atardecer.jpg'],
    servicios: ['Vista al río', 'Aire acondicionado', 'Wifi'],
  },
];

async function seedUsuarios(): Promise<Map<Rol, number>> {
  const userIdsByRole = new Map<Rol, number>();

  for (const user of DEFAULT_USERS) {
    const record = await prisma.usuario.upsert({
      where: { correo: user.correo },
      update: {
        nombreCompleto: user.nombreCompleto,
        passwordHash: hashPassword(user.plainPassword),
        rol: user.rol,
        activo: true,
      },
      create: {
        correo: user.correo,
        nombreCompleto: user.nombreCompleto,
        passwordHash: hashPassword(user.plainPassword),
        rol: user.rol,
        activo: true,
      },
    });
    userIdsByRole.set(user.rol, record.id);
  }

  return userIdsByRole;
}

async function seedMunicipios(): Promise<Map<string, string>> {
  const municipioIdsByName = new Map<string, string>();

  for (const nombre of MUNICIPIOS_MAGDALENA) {
    const record = await prisma.municipio.upsert({
      where: { nombre },
      update: {
        ciudad: nombre,
        departamento: 'Magdalena',
      },
      create: {
        nombre,
        ciudad: nombre,
        departamento: 'Magdalena',
      },
    });
    municipioIdsByName.set(nombre, record.id);
  }

  return municipioIdsByName;
}

async function seedServicios(): Promise<Map<string, number>> {
  const servicioIdsByName = new Map<string, number>();

  for (const servicio of BASE_SERVICIOS) {
    const record = await prisma.servicio.upsert({
      where: { nombre: servicio.nombre },
      update: {
        nombreEn: servicio.nombreEn,
        icono: servicio.icono,
      },
      create: {
        nombre: servicio.nombre,
        nombreEn: servicio.nombreEn,
        icono: servicio.icono,
      },
    });
    servicioIdsByName.set(servicio.nombre, record.id);
  }

  return servicioIdsByName;
}

async function seedHoteles(
  adminUserId: number | undefined,
  servicioIdsByName: Map<string, number>,
): Promise<number> {
  let createdCount = 0;

  for (const hotel of INITIAL_HOTELES) {
    const existing = await prisma.establecimiento.findFirst({
      where: { nombre: hotel.nombre },
      select: { id: true },
    });
    if (existing) {
      continue;
    }

    const serviceLinks = hotel.servicios
      .map((nombre) => servicioIdsByName.get(nombre))
      .filter((id): id is number => typeof id === 'number')
      .map((servicioId) => ({ servicioId }));

    await prisma.establecimiento.create({
      data: {
        tipo: hotel.tipo,
        nombre: hotel.nombre,
        municipioCodigo: hotel.municipio,
        estrellas: hotel.estrellas,
        resena: hotel.resena,
        resenaEn: hotel.resenaEn,
        whatsapp: hotel.whatsapp,
        facebookUrl: hotel.facebookUrl ?? null,
        instagramUrl: hotel.instagramUrl ?? null,
        xUrl: hotel.xUrl ?? null,
        ubicacionUrl: hotel.ubicacionUrl,
        latitud: hotel.latitud,
        longitud: hotel.longitud,
        disponible: hotel.disponible,
        usuarioId: adminUserId ?? null,
        fotos: {
          create: hotel.fotos.map((url, orden) => ({
            url,
            orden,
            esPortada: orden === 0,
          })),
        },
        servicios: {
          create: serviceLinks,
        },
      },
    });
    createdCount += 1;
  }

  return createdCount;
}

async function seedEncuesta(): Promise<void> {
  const existing = await prisma.encuesta.findFirst();
  if (existing) return;

  await prisma.encuesta.create({
    data: {
      titulo: 'Encuesta de Satisfacción Turística - Magdalena',
      descripcion: 'Queremos conocer tu opinión para seguir mejorando la oferta turística y cultural de nuestra región.',
      activa: true,
      mostrarEnLanding: true,
      preguntas: {
        create: [
          {
            pregunta: '¿Cómo calificarías tu experiencia general en los destinos del Magdalena?',
            tipoPregunta: TipoPregunta.calificacion,
            obligatoria: true,
            orden: 1,
          },
          {
            pregunta: '¿Cuál fue el motivo principal de tu visita?',
            tipoPregunta: TipoPregunta.opcion,
            obligatoria: true,
            orden: 2,
            opciones: {
              create: [
                { texto: 'Vacaciones, descanso y ecoturismo', orden: 1 },
                { texto: 'Cultura, gastronomía y patrimonio', orden: 2 },
                { texto: 'Negocios, trabajo o eventos', orden: 3 },
                { texto: 'Visita a familiares y amigos', orden: 4 },
              ],
            },
          },
          {
            pregunta: '¿Qué tipo de hospedaje prefieres utilizar?',
            tipoPregunta: TipoPregunta.opcion,
            obligatoria: true,
            orden: 3,
            opciones: {
              create: [
                { texto: 'Hotel convencional', orden: 1 },
                { texto: 'Cabaña campestre / Ecolodge', orden: 2 },
                { texto: 'Apartamento turístico', orden: 3 },
              ],
            },
          },
          {
            pregunta: '¿Qué sugerencias o recomendaciones tienes para mejorar los servicios turísticos?',
            tipoPregunta: TipoPregunta.texto,
            obligatoria: false,
            orden: 4,
          },
        ],
      },
    },
  });
}

async function main(): Promise<void> {
  const userIdsByRole = await seedUsuarios();
  const municipioIdsByName = await seedMunicipios();
  const servicioIdsByName = await seedServicios();
  const createdHoteles = await seedHoteles(
    userIdsByRole.get(Rol.ADMIN),
    servicioIdsByName,
  );
  await seedEncuesta();

  console.log(
    `Seed completado: ${userIdsByRole.size} usuarios, ${municipioIdsByName.size} municipios, ${servicioIdsByName.size} servicios, ${createdHoteles} establecimientos nuevos y encuesta inicial creados.`,
  );
}

main()
  .catch((error: unknown) => {
    console.error('Error ejecutando el seed:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
