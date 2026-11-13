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
    nombre: 'Hotel Cabañas del Río',
    estrellas: 4,
    municipio: 'Plato',
    disponible: true,
    whatsapp: '+57 300 123 4567',
    instagramUrl: 'https://instagram.com/cabanasdelrio',
    facebookUrl: 'https://facebook.com/cabanasdelrio',
    xUrl: 'https://x.com/cabanasdelrio',
    ubicacionUrl: 'https://maps.app.goo.gl/example1',
    latitud: 9.7903,
    longitud: -74.7825,
    resena: 'Hermoso hotel a orillas del Río Magdalena con piscina, restaurante y habitaciones confortables para toda la familia.',
    resenaEn: 'Beautiful hotel on the banks of the Magdalena River featuring a pool, restaurant, and comfortable family rooms.',
    fotos: [
      'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&w=1200&q=80',
    ],
    servicios: ['Piscina', 'Aire acondicionado', 'Parqueadero privado', 'Wifi de alta velocidad', 'Vista al río'],
  },
  {
    tipo: TipoTarjeta.CABANA,
    nombre: 'Cabaña Campestre Los Samanes',
    estrellas: 3,
    municipio: 'Plato',
    disponible: true,
    whatsapp: '+57 311 987 6543',
    instagramUrl: 'https://instagram.com/lossamanescampestre',
    facebookUrl: 'https://facebook.com/lossamanescampestre',
    ubicacionUrl: 'https://maps.app.goo.gl/example2',
    latitud: 9.795,
    longitud: -74.789,
    resena: 'Cabañas ecológicas ideales para descanso en pareja o grupos de amigos, rodeadas de naturaleza y aire puro.',
    resenaEn: 'Eco-friendly cabins surrounded by nature and fresh air, ideal for couples or groups of friends.',
    fotos: [
      'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=1200&q=80',
    ],
    servicios: ['Parqueadero', 'Zona campestre', 'Wifi'],
  },
  {
    tipo: TipoTarjeta.RESTAURANTE,
    nombre: 'Restaurante Bar El Muelle del Río',
    estrellas: 4,
    municipio: 'Plato',
    disponible: true,
    whatsapp: '+57 320 555 1234',
    instagramUrl: 'https://instagram.com/elmuelledelrio',
    facebookUrl: 'https://facebook.com/elmuelledelrio',
    ubicacionUrl: 'https://maps.app.goo.gl/example3',
    latitud: 9.789,
    longitud: -74.781,
    resena: 'Lo mejor de la gastronomía riberana: bocachico frito, viuda de pescado y coctelería tradicional con vista panorámica.',
    resenaEn: 'The finest riverside cuisine: fried bocachico, fish stew, and traditional cocktails with panoramic views.',
    fotos: [
      'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1200&q=80',
    ],
    servicios: ['Restaurante / Bar', 'Vista al río', 'Wifi'],
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
