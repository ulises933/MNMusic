// ========== TYPES ==========
export type UserRole = 'musician' | 'organizer' | 'user';
export type EventType = 'wedding' | 'bar' | 'restaurant' | 'festival' | 'corporate' | 'private';
export type EventStatus = 'draft' | 'published' | 'closed';
export type ApplicationStatus = 'pending' | 'accepted' | 'rejected';
export type Genre = 'Rock' | 'Jazz' | 'Pop' | 'Clásica' | 'Reggaeton' | 'Salsa' | 'Blues' | 'Folk' | 'Electrónica' | 'R&B';
export type Instrument = 'Guitarra' | 'Bajo' | 'Batería' | 'Teclado' | 'Voz' | 'Saxofón' | 'Violín' | 'Trompeta' | 'DJ' | 'Percusión';

export interface Musician {
  id: string;
  name: string;
  artistName: string;
  avatar: string;
  bio: string;
  genres: Genre[];
  instruments: Instrument[];
  baseRate: number;
  city: string;
  rating: number;
  reviewCount: number;
  portfolio: { title: string; type: 'video' | 'link'; url: string }[];
  reviews: { author: string; rating: number; comment: string; date: string }[];
  // Extended profile fields
  phone?: string;
  email?: string;
  website?: string;
  socialMedia?: { platform: string; url: string }[];
  experience?: string;
  education?: string;
  languages?: string[];
  availability?: string;
  travelRadius?: string;
  equipment?: string[];
  references?: { name: string; contact: string; relation: string }[];
}

export interface Event {
  id: string;
  title: string;
  type: EventType;
  date: string;
  time: string;
  endTime: string;
  city: string;
  venue: string;
  description: string;
  payment: number;
  paymentMax?: number;
  genres: Genre[];
  musiciansNeeded: number;
  duration: string;
  dressCode: string;
  soundProvided: boolean;
  instrumentsNeeded: Instrument[];
  organizerId: string;
  organizerName: string;
  status: EventStatus;
  applicationsCount: number;
}

export interface Application {
  id: string;
  eventId: string;
  eventTitle: string;
  musicianId: string;
  musicianName: string;
  musicianAvatar: string;
  message: string;
  proposedRate: number;
  status: ApplicationStatus;
  appliedAt: string;
}

export interface Message {
  id: string;
  senderId: string;
  senderName: string;
  text: string;
  timestamp: string;
  isRead: boolean;
}

export interface Conversation {
  id: string;
  participantName: string;
  participantAvatar: string;
  participantRole: UserRole;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
  messages: Message[];
}

// ========== MOCK DATA ==========

export const musicians: Musician[] = [
  { id: 'm1', name: 'Carlos Rivera', artistName: 'Carlos R.', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=carlos', bio: 'Guitarrista y vocalista con 10 años de experiencia en eventos en vivo. Especializado en rock acústico y covers pop para bodas y eventos corporativos.', genres: ['Rock', 'Pop', 'Blues'], instruments: ['Guitarra', 'Voz'], baseRate: 150, city: 'Madrid', rating: 4.8, reviewCount: 24, phone: '+34 612 345 678', email: 'carlos@email.com', website: 'https://carlosr.music', socialMedia: [{ platform: 'Instagram', url: '#' }, { platform: 'YouTube', url: '#' }, { platform: 'Spotify', url: '#' }], experience: '10 años tocando en vivo. +200 eventos realizados. Colaboraciones con bandas locales de Madrid.', education: 'Grado en Interpretación Musical — Conservatorio de Madrid (2016)', languages: ['Español', 'Inglés'], availability: 'Fines de semana y noches entre semana', travelRadius: 'Madrid y alrededores (hasta 100km)', equipment: ['Guitarra acústica Martin D-28', 'Guitarra eléctrica Fender Stratocaster', 'Amplificador portátil Bose S1 Pro', 'Micrófono Shure SM58'], references: [{ name: 'Ana Martín', contact: 'ana@events.com', relation: 'Organizadora de eventos' }], portfolio: [{ title: 'Live en Café Central', type: 'video', url: '#' }, { title: 'Demo Acústico', type: 'link', url: '#' }, { title: 'Cover Session — Pop Hits', type: 'video', url: '#' }], reviews: [{ author: 'Ana M.', rating: 5, comment: 'Increíble actuación, muy profesional. La música fue perfecta para nuestra boda.', date: '2025-12-15' }, { author: 'Luis G.', rating: 4, comment: 'Gran sonido, puntual y amable. Repetiríamos sin duda.', date: '2025-11-20' }, { author: 'Marta S.', rating: 5, comment: 'Carlos hizo de nuestro evento algo especial. Muy recomendado.', date: '2025-10-05' }] },
  { id: 'm2', name: 'María López', artistName: 'María Jazz', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=maria', bio: 'Saxofonista de jazz con formación en Berklee. Especializada en jazz contemporáneo y fusión.', genres: ['Jazz', 'Blues', 'R&B'], instruments: ['Saxofón', 'Voz'], baseRate: 200, city: 'Barcelona', rating: 4.9, reviewCount: 31, phone: '+34 623 456 789', email: 'maria@jazz.com', socialMedia: [{ platform: 'Instagram', url: '#' }], experience: '12 años de experiencia profesional. Giras internacionales por Europa.', education: 'Berklee College of Music — Performance Major (2014)', languages: ['Español', 'Inglés', 'Francés'], availability: 'Disponible toda la semana', travelRadius: 'Toda España', equipment: ['Saxofón alto Selmer Paris', 'Saxofón tenor Yamaha YTS-62'], portfolio: [{ title: 'Jazz Night Barcelona', type: 'video', url: '#' }], reviews: [{ author: 'Pedro F.', rating: 5, comment: 'Talento puro, llenó el escenario.', date: '2025-12-01' }] },
  { id: 'm3', name: 'Andrés Morales', artistName: 'DJ Andrés', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=andres', bio: 'DJ y productor electrónico especializado en eventos corporativos y fiestas privadas.', genres: ['Electrónica', 'Pop', 'Reggaeton'], instruments: ['DJ', 'Teclado'], baseRate: 250, city: 'Valencia', rating: 4.6, reviewCount: 18, email: 'dj.andres@email.com', socialMedia: [{ platform: 'Instagram', url: '#' }, { platform: 'SoundCloud', url: '#' }], experience: '8 años como DJ profesional. Residencias en clubs de Valencia.', languages: ['Español', 'Inglés'], availability: 'Viernes a domingo', travelRadius: 'Valencia y Alicante', equipment: ['Pioneer CDJ-3000 x2', 'DJM-900NXS2', 'Sistema PA QSC'], portfolio: [{ title: 'Set Festival Valencia', type: 'video', url: '#' }], reviews: [{ author: 'Sara K.', rating: 5, comment: 'Hizo que toda la fiesta bailara.', date: '2025-10-15' }] },
  { id: 'm4', name: 'Lucía Fernández', artistName: 'Lucía Strings', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=lucia', bio: 'Violinista clásica con experiencia en bodas y eventos elegantes. También toco música contemporánea.', genres: ['Clásica', 'Pop', 'Folk'], instruments: ['Violín'], baseRate: 180, city: 'Sevilla', rating: 4.7, reviewCount: 15, email: 'lucia@strings.com', experience: '15 años de formación clásica y 6 años en eventos.', education: 'Real Conservatorio Superior de Música de Madrid', languages: ['Español'], availability: 'Fines de semana', travelRadius: 'Andalucía', portfolio: [{ title: 'Boda en Alcázar', type: 'video', url: '#' }], reviews: [{ author: 'Marta R.', rating: 5, comment: 'Perfecta para nuestra boda.', date: '2025-09-20' }] },
  { id: 'm5', name: 'Javier Torres', artistName: 'Javi Drums', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=javier', bio: 'Baterista versátil, de rock a jazz. Disponible para sesiones y giras.', genres: ['Rock', 'Jazz', 'Pop'], instruments: ['Batería', 'Percusión'], baseRate: 120, city: 'Madrid', rating: 4.5, reviewCount: 12, email: 'javi@drums.com', experience: '7 años tocando en bandas y como sesionista.', languages: ['Español', 'Inglés'], availability: 'Flexible', travelRadius: 'Madrid', equipment: ['Kit Pearl Masters', 'Set de platillos Zildjian A Custom'], portfolio: [{ title: 'Session con banda local', type: 'video', url: '#' }], reviews: [] },
  { id: 'm6', name: 'Elena Ruiz', artistName: 'Elena Voz', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=elena', bio: 'Cantante de salsa y música latina con banda propia. Energía pura en el escenario.', genres: ['Salsa', 'Reggaeton', 'Pop'], instruments: ['Voz', 'Percusión'], baseRate: 170, city: 'Málaga', rating: 4.8, reviewCount: 22, email: 'elena@voz.com', socialMedia: [{ platform: 'Instagram', url: '#' }, { platform: 'TikTok', url: '#' }], experience: '9 años de carrera musical. Ganadora de Talento Latino 2023.', languages: ['Español', 'Inglés', 'Portugués'], availability: 'Toda la semana excepto lunes', travelRadius: 'Toda España', portfolio: [{ title: 'Noche Latina Málaga', type: 'video', url: '#' }], reviews: [{ author: 'Jorge L.', rating: 5, comment: 'Energía increíble en el escenario.', date: '2025-11-10' }] },
  { id: 'm7', name: 'Pablo Sánchez', artistName: 'Pablo Keys', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=pablo', bio: 'Tecladista y compositor. Especialista en eventos cocktail y lounge.', genres: ['Jazz', 'Pop', 'Clásica'], instruments: ['Teclado', 'Voz'], baseRate: 160, city: 'Bilbao', rating: 4.4, reviewCount: 9, email: 'pablo@keys.com', experience: '6 años en eventos y hostelería musical.', languages: ['Español', 'Euskera'], availability: 'Fines de semana y festivos', travelRadius: 'País Vasco y Cantabria', portfolio: [], reviews: [] },
  { id: 'm8', name: 'Diana Castro', artistName: 'Diana Folk', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=diana', bio: 'Cantautora folk con guitarra acústica. Perfecta para ambientes íntimos y al aire libre.', genres: ['Folk', 'Pop', 'Blues'], instruments: ['Guitarra', 'Voz'], baseRate: 130, city: 'Granada', rating: 4.9, reviewCount: 28, email: 'diana@folk.com', website: 'https://dianafolk.es', socialMedia: [{ platform: 'Instagram', url: '#' }, { platform: 'Spotify', url: '#' }], experience: '8 años como cantautora. 3 álbumes publicados.', education: 'Autodidacta con masterclass en Berklee Online', languages: ['Español', 'Inglés'], availability: 'Flexible', travelRadius: 'Andalucía y Madrid', equipment: ['Guitarra Taylor 814ce', 'Loop Station Boss RC-505'], portfolio: [{ title: 'Acústico en La Tertulia', type: 'video', url: '#' }, { title: 'Sesión en directo — Festival Folk', type: 'video', url: '#' }], reviews: [{ author: 'Carmen P.', rating: 5, comment: 'Voz que te atrapa desde la primera nota.', date: '2025-12-05' }] },
  { id: 'm9', name: 'Roberto Díaz', artistName: 'Rob Brass', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=roberto', bio: 'Trompetista con formación clásica y pasión por el jazz latino.', genres: ['Jazz', 'Clásica', 'Salsa'], instruments: ['Trompeta'], baseRate: 190, city: 'Zaragoza', rating: 4.6, reviewCount: 14, email: 'rob@brass.com', experience: '11 años en orquestas y combos de jazz.', education: 'Conservatorio Superior de Aragón', languages: ['Español'], availability: 'Noches y fines de semana', travelRadius: 'Aragón y Cataluña', equipment: ['Trompeta Bach Stradivarius 37'], portfolio: [{ title: 'Big Band Zaragoza', type: 'video', url: '#' }], reviews: [] },
  { id: 'm10', name: 'Sofía Martín', artistName: 'Sofía Bass', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=sofia', bio: 'Bajista de rock y funk. Groove que mueve. Sesionista y profesora de bajo.', genres: ['Rock', 'R&B', 'Pop'], instruments: ['Bajo', 'Voz'], baseRate: 140, city: 'Madrid', rating: 4.7, reviewCount: 19, email: 'sofia@bass.com', socialMedia: [{ platform: 'Instagram', url: '#' }], experience: '9 años como bajista profesional. Profesora en escuela de música.', education: 'Taller de Músics — Barcelona', languages: ['Español', 'Inglés'], availability: 'Fines de semana', travelRadius: 'Madrid y Castilla', equipment: ['Fender Jazz Bass', 'Amplificador Markbass'], portfolio: [{ title: 'Funk Night Madrid', type: 'video', url: '#' }], reviews: [{ author: 'Tomás G.', rating: 4, comment: 'Excelente bajista, muy groovy.', date: '2025-11-01' }] },
];

export const events: Event[] = [
  { id: 'e1', title: 'Boda García-Martínez', type: 'wedding', date: '2026-04-15', time: '18:00', endTime: '01:00', city: 'Madrid', venue: 'Finca El Olivar', description: 'Boda elegante para 200 invitados. Se necesita banda completa para ceremonia y fiesta.', payment: 800, paymentMax: 1200, genres: ['Pop', 'Jazz', 'Clásica'], musiciansNeeded: 4, duration: '7h', dressCode: 'Formal', soundProvided: true, instrumentsNeeded: ['Guitarra', 'Teclado', 'Violín', 'Voz'], organizerId: 'o1', organizerName: 'EventosPro Madrid', status: 'published', applicationsCount: 6 },
  { id: 'e2', title: 'Jazz Night — Blue Note Bar', type: 'bar', date: '2026-03-22', time: '21:00', endTime: '00:00', city: 'Barcelona', venue: 'Blue Note Bar', description: 'Noche de jazz en vivo. Ambiente íntimo, buena acústica.', payment: 200, genres: ['Jazz', 'Blues'], musiciansNeeded: 2, duration: '3h', dressCode: 'Smart casual', soundProvided: true, instrumentsNeeded: ['Saxofón', 'Teclado'], organizerId: 'o2', organizerName: 'Blue Note BCN', status: 'published', applicationsCount: 4 },
  { id: 'e3', title: 'Festival de Verano Playa', type: 'festival', date: '2026-07-10', time: '16:00', endTime: '23:00', city: 'Valencia', venue: 'Playa de la Malvarrosa', description: 'Festival al aire libre con múltiples escenarios. Buscamos DJs y bandas.', payment: 500, paymentMax: 1500, genres: ['Electrónica', 'Pop', 'Reggaeton'], musiciansNeeded: 6, duration: '7h', dressCode: 'Casual', soundProvided: true, instrumentsNeeded: ['DJ', 'Voz', 'Guitarra'], organizerId: 'o3', organizerName: 'SummerVibes SL', status: 'published', applicationsCount: 12 },
  { id: 'e4', title: 'Cena Gala Corporativa', type: 'corporate', date: '2026-05-20', time: '20:00', endTime: '23:30', city: 'Madrid', venue: 'Hotel Ritz', description: 'Cena de gala para empresa tecnológica. Música de fondo elegante.', payment: 600, genres: ['Jazz', 'Clásica'], musiciansNeeded: 3, duration: '3.5h', dressCode: 'Black tie', soundProvided: true, instrumentsNeeded: ['Violín', 'Teclado', 'Voz'], organizerId: 'o1', organizerName: 'EventosPro Madrid', status: 'published', applicationsCount: 3 },
  { id: 'e5', title: 'Fiesta Privada Cumpleaños', type: 'private', date: '2026-04-02', time: '22:00', endTime: '04:00', city: 'Sevilla', venue: 'Villa Particular', description: 'Fiesta de cumpleaños 30. Ambiente festivo, mucho baile.', payment: 350, genres: ['Reggaeton', 'Salsa', 'Pop'], musiciansNeeded: 2, duration: '6h', dressCode: 'Casual elegante', soundProvided: false, instrumentsNeeded: ['DJ', 'Voz'], organizerId: 'o4', organizerName: 'Laura Jiménez', status: 'published', applicationsCount: 5 },
  { id: 'e6', title: 'Brunch Dominical con Música', type: 'restaurant', date: '2026-03-30', time: '12:00', endTime: '15:00', city: 'Barcelona', venue: 'Restaurante El Jardín', description: 'Brunch con música acústica en vivo. Ambiente relajado.', payment: 150, genres: ['Folk', 'Pop', 'Jazz'], musiciansNeeded: 1, duration: '3h', dressCode: 'Casual', soundProvided: false, instrumentsNeeded: ['Guitarra', 'Voz'], organizerId: 'o2', organizerName: 'Blue Note BCN', status: 'published', applicationsCount: 8 },
  { id: 'e7', title: 'Boda Elegante en Playa', type: 'wedding', date: '2026-06-28', time: '17:00', endTime: '02:00', city: 'Málaga', venue: 'Beach Club Marbella', description: 'Boda en la playa con ceremonia al atardecer. Necesitamos violinista para ceremonia y DJ para fiesta.', payment: 900, paymentMax: 1400, genres: ['Clásica', 'Pop', 'Electrónica'], musiciansNeeded: 3, duration: '9h', dressCode: 'Formal playa', soundProvided: true, instrumentsNeeded: ['Violín', 'DJ', 'Voz'], organizerId: 'o5', organizerName: 'Bodas del Sur', status: 'published', applicationsCount: 7 },
  { id: 'e8', title: 'Rock en el Garaje', type: 'bar', date: '2026-04-10', time: '22:00', endTime: '01:30', city: 'Madrid', venue: 'Sala Garaje Beat', description: 'Noche de rock en vivo. Buscamos banda de rock/blues con energía.', payment: 300, genres: ['Rock', 'Blues'], musiciansNeeded: 4, duration: '3.5h', dressCode: 'Casual', soundProvided: true, instrumentsNeeded: ['Guitarra', 'Bajo', 'Batería', 'Voz'], organizerId: 'o6', organizerName: 'Garaje Beat Club', status: 'draft', applicationsCount: 0 },
  { id: 'e9', title: 'Evento Corporativo Tech', type: 'corporate', date: '2026-05-05', time: '19:00', endTime: '22:00', city: 'Bilbao', venue: 'Palacio Euskalduna', description: 'Lanzamiento de producto tech. DJ para cocktail y networking.', payment: 450, genres: ['Electrónica', 'Pop'], musiciansNeeded: 1, duration: '3h', dressCode: 'Business casual', soundProvided: true, instrumentsNeeded: ['DJ'], organizerId: 'o3', organizerName: 'SummerVibes SL', status: 'published', applicationsCount: 2 },
  { id: 'e10', title: 'Festival Flamenco Fusión', type: 'festival', date: '2026-08-15', time: '20:00', endTime: '02:00', city: 'Granada', venue: 'Jardines del Generalife', description: 'Festival de flamenco fusión con artistas locales e internacionales.', payment: 700, paymentMax: 2000, genres: ['Folk', 'Jazz', 'Salsa'], musiciansNeeded: 5, duration: '6h', dressCode: 'Casual', soundProvided: true, instrumentsNeeded: ['Guitarra', 'Percusión', 'Voz', 'Trompeta'], organizerId: 'o5', organizerName: 'Bodas del Sur', status: 'published', applicationsCount: 9 },
  { id: 'e11', title: 'Cena Romántica Restaurante', type: 'restaurant', date: '2026-03-14', time: '20:00', endTime: '23:00', city: 'Sevilla', venue: 'Restaurante La Luna', description: 'Cena de San Valentín tardío. Música suave y romántica.', payment: 180, genres: ['Jazz', 'Clásica', 'Pop'], musiciansNeeded: 1, duration: '3h', dressCode: 'Elegante', soundProvided: false, instrumentsNeeded: ['Guitarra', 'Voz'], organizerId: 'o4', organizerName: 'Laura Jiménez', status: 'closed', applicationsCount: 3 },
  { id: 'e12', title: 'Fiesta de Año Nuevo', type: 'private', date: '2026-12-31', time: '22:00', endTime: '06:00', city: 'Madrid', venue: 'Terraza Gran Vía', description: 'Gran fiesta de fin de año. Buscamos DJ y cantante para la noche más épica.', payment: 1000, paymentMax: 2000, genres: ['Electrónica', 'Pop', 'Reggaeton', 'Salsa'], musiciansNeeded: 3, duration: '8h', dressCode: 'Gala', soundProvided: true, instrumentsNeeded: ['DJ', 'Voz', 'Percusión'], organizerId: 'o6', organizerName: 'Garaje Beat Club', status: 'draft', applicationsCount: 0 },
];

export const applications: Application[] = [
  { id: 'a1', eventId: 'e1', eventTitle: 'Boda García-Martínez', musicianId: 'm1', musicianName: 'Carlos R.', musicianAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=carlos', message: 'Me encantaría tocar en su boda. Tengo amplia experiencia en ceremonias.', proposedRate: 200, status: 'pending', appliedAt: '2026-02-15' },
  { id: 'a2', eventId: 'e1', eventTitle: 'Boda García-Martínez', musicianId: 'm4', musicianName: 'Lucía Strings', musicianAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=lucia', message: 'Violinista especializada en bodas. Repertorio clásico y moderno.', proposedRate: 250, status: 'accepted', appliedAt: '2026-02-14' },
  { id: 'a3', eventId: 'e2', eventTitle: 'Jazz Night — Blue Note Bar', musicianId: 'm2', musicianName: 'María Jazz', musicianAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=maria', message: 'El jazz es mi pasión. Disponible para todas las fechas.', proposedRate: 200, status: 'accepted', appliedAt: '2026-02-20' },
  { id: 'a4', eventId: 'e2', eventTitle: 'Jazz Night — Blue Note Bar', musicianId: 'm7', musicianName: 'Pablo Keys', musicianAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=pablo', message: 'Tecladista de jazz con repertorio extenso de standards.', proposedRate: 180, status: 'pending', appliedAt: '2026-02-21' },
  { id: 'a5', eventId: 'e3', eventTitle: 'Festival de Verano Playa', musicianId: 'm3', musicianName: 'DJ Andrés', musicianAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=andres', message: 'DJ con experiencia en festivales. Sets de 2-3 horas.', proposedRate: 400, status: 'pending', appliedAt: '2026-03-01' },
  { id: 'a6', eventId: 'e3', eventTitle: 'Festival de Verano Playa', musicianId: 'm6', musicianName: 'Elena Voz', musicianAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=elena', message: 'Cantante versátil, perfecta para festival.', proposedRate: 300, status: 'pending', appliedAt: '2026-03-02' },
  { id: 'a7', eventId: 'e4', eventTitle: 'Cena Gala Corporativa', musicianId: 'm4', musicianName: 'Lucía Strings', musicianAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=lucia', message: 'Violinista ideal para ambientes corporativos elegantes.', proposedRate: 220, status: 'accepted', appliedAt: '2026-02-25' },
  { id: 'a8', eventId: 'e5', eventTitle: 'Fiesta Privada Cumpleaños', musicianId: 'm3', musicianName: 'DJ Andrés', musicianAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=andres', message: 'Sets de fiesta que no paran. Reggaeton, electrónica, lo que pidas.', proposedRate: 350, status: 'rejected', appliedAt: '2026-02-28' },
  { id: 'a9', eventId: 'e5', eventTitle: 'Fiesta Privada Cumpleaños', musicianId: 'm6', musicianName: 'Elena Voz', musicianAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=elena', message: 'Salsa y reggaeton en vivo. Haré que todos bailen.', proposedRate: 280, status: 'accepted', appliedAt: '2026-02-27' },
  { id: 'a10', eventId: 'e6', eventTitle: 'Brunch Dominical con Música', musicianId: 'm8', musicianName: 'Diana Folk', musicianAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=diana', message: 'Acústico perfecto para brunch. Repertorio folk y pop suave.', proposedRate: 150, status: 'pending', appliedAt: '2026-03-05' },
  { id: 'a11', eventId: 'e6', eventTitle: 'Brunch Dominical con Música', musicianId: 'm1', musicianName: 'Carlos R.', musicianAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=carlos', message: 'Guitarra acústica y voz para ambiente relajado.', proposedRate: 160, status: 'pending', appliedAt: '2026-03-06' },
  { id: 'a12', eventId: 'e7', eventTitle: 'Boda Elegante en Playa', musicianId: 'm4', musicianName: 'Lucía Strings', musicianAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=lucia', message: 'Encantada de tocar en una boda en la playa.', proposedRate: 280, status: 'pending', appliedAt: '2026-03-10' },
  { id: 'a13', eventId: 'e7', eventTitle: 'Boda Elegante en Playa', musicianId: 'm3', musicianName: 'DJ Andrés', musicianAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=andres', message: 'DJ para la fiesta post-ceremonia. Sets tropicales y modernos.', proposedRate: 400, status: 'pending', appliedAt: '2026-03-11' },
  { id: 'a14', eventId: 'e9', eventTitle: 'Evento Corporativo Tech', musicianId: 'm3', musicianName: 'DJ Andrés', musicianAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=andres', message: 'Especialista en eventos tech. Sets modernos y elegantes.', proposedRate: 450, status: 'pending', appliedAt: '2026-03-15' },
  { id: 'a15', eventId: 'e10', eventTitle: 'Festival Flamenco Fusión', musicianId: 'm9', musicianName: 'Rob Brass', musicianAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=roberto', message: 'Trompetista con experiencia en flamenco fusión y jazz latino.', proposedRate: 350, status: 'pending', appliedAt: '2026-03-20' },
];

export const conversations: Conversation[] = [
  {
    id: 'c1', participantName: 'EventosPro Madrid', participantAvatar: 'https://api.dicebear.com/7.x/initials/svg?seed=EP', participantRole: 'organizer', lastMessage: '¿Podrías enviarme tu rider técnico?', lastMessageTime: '2026-03-01 14:30', unreadCount: 2,
    messages: [
      { id: 'msg1', senderId: 'o1', senderName: 'EventosPro Madrid', text: 'Hola Carlos, nos interesa tu perfil para la boda.', timestamp: '2026-03-01 10:00', isRead: true },
      { id: 'msg2', senderId: 'm1', senderName: 'Carlos R.', text: '¡Genial! Estoy disponible para esa fecha.', timestamp: '2026-03-01 11:15', isRead: true },
      { id: 'msg3', senderId: 'o1', senderName: 'EventosPro Madrid', text: '¿Podrías enviarme tu rider técnico?', timestamp: '2026-03-01 14:30', isRead: false },
      { id: 'msg4', senderId: 'o1', senderName: 'EventosPro Madrid', text: 'También necesitaríamos tu lista de canciones sugeridas.', timestamp: '2026-03-01 14:32', isRead: false },
    ],
  },
  {
    id: 'c2', participantName: 'Blue Note BCN', participantAvatar: 'https://api.dicebear.com/7.x/initials/svg?seed=BN', participantRole: 'organizer', lastMessage: 'Perfecto, te esperamos el sábado.', lastMessageTime: '2026-02-28 18:00', unreadCount: 0,
    messages: [
      { id: 'msg5', senderId: 'o2', senderName: 'Blue Note BCN', text: 'María, tu aplicación para Jazz Night ha sido aceptada.', timestamp: '2026-02-28 15:00', isRead: true },
      { id: 'msg6', senderId: 'm2', senderName: 'María Jazz', text: '¡Maravilloso! ¿A qué hora debo llegar para prueba de sonido?', timestamp: '2026-02-28 16:30', isRead: true },
      { id: 'msg7', senderId: 'o2', senderName: 'Blue Note BCN', text: 'Perfecto, te esperamos el sábado.', timestamp: '2026-02-28 18:00', isRead: true },
    ],
  },
  {
    id: 'c3', participantName: 'Laura Jiménez', participantAvatar: 'https://api.dicebear.com/7.x/initials/svg?seed=LJ', participantRole: 'organizer', lastMessage: '¿Tienes equipo de sonido propio?', lastMessageTime: '2026-03-02 09:00', unreadCount: 1,
    messages: [
      { id: 'msg8', senderId: 'o4', senderName: 'Laura Jiménez', text: 'Hola Elena, me encanta tu perfil para mi fiesta.', timestamp: '2026-03-01 20:00', isRead: true },
      { id: 'msg9', senderId: 'm6', senderName: 'Elena Voz', text: 'Gracias Laura, me encantaría participar.', timestamp: '2026-03-02 08:00', isRead: true },
      { id: 'msg10', senderId: 'o4', senderName: 'Laura Jiménez', text: '¿Tienes equipo de sonido propio?', timestamp: '2026-03-02 09:00', isRead: false },
    ],
  },
  {
    id: 'c4', participantName: 'Carlos R.', participantAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=carlos', participantRole: 'musician', lastMessage: 'Te envío el presupuesto detallado mañana.', lastMessageTime: '2026-02-27 22:00', unreadCount: 0,
    messages: [
      { id: 'msg11', senderId: 'o1', senderName: 'EventosPro Madrid', text: 'Carlos, ¿podrías darnos un presupuesto para 4 horas?', timestamp: '2026-02-27 16:00', isRead: true },
      { id: 'msg12', senderId: 'm1', senderName: 'Carlos R.', text: 'Te envío el presupuesto detallado mañana.', timestamp: '2026-02-27 22:00', isRead: true },
    ],
  },
  {
    id: 'c5', participantName: 'SummerVibes SL', participantAvatar: 'https://api.dicebear.com/7.x/initials/svg?seed=SV', participantRole: 'organizer', lastMessage: 'El festival será épico este año 🎶', lastMessageTime: '2026-03-02 12:00', unreadCount: 3,
    messages: [
      { id: 'msg13', senderId: 'o3', senderName: 'SummerVibes SL', text: 'DJ Andrés, buscamos DJs para el escenario principal.', timestamp: '2026-03-01 09:00', isRead: true },
      { id: 'msg14', senderId: 'm3', senderName: 'DJ Andrés', text: '¡Estoy dentro! ¿Qué horario tendría?', timestamp: '2026-03-01 10:00', isRead: true },
      { id: 'msg15', senderId: 'o3', senderName: 'SummerVibes SL', text: 'De 20:00 a 22:00, slot de cierre.', timestamp: '2026-03-02 11:00', isRead: false },
      { id: 'msg16', senderId: 'o3', senderName: 'SummerVibes SL', text: 'El festival será épico este año 🎶', timestamp: '2026-03-02 12:00', isRead: false },
    ],
  },
  {
    id: 'c6', participantName: 'Diana Folk', participantAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=diana', participantRole: 'musician', lastMessage: 'Adjunto mi portfolio actualizado.', lastMessageTime: '2026-03-01 16:00', unreadCount: 0,
    messages: [
      { id: 'msg17', senderId: 'o2', senderName: 'Blue Note BCN', text: 'Diana, nos gustaría invitarte al brunch del domingo.', timestamp: '2026-03-01 14:00', isRead: true },
      { id: 'msg18', senderId: 'm8', senderName: 'Diana Folk', text: 'Adjunto mi portfolio actualizado.', timestamp: '2026-03-01 16:00', isRead: true },
    ],
  },
];

// ========== HELPERS ==========
export const eventTypeLabels: Record<EventType, string> = {
  wedding: 'Boda', bar: 'Bar', restaurant: 'Restaurante',
  festival: 'Festival', corporate: 'Corporativo', private: 'Privado',
};

export const eventTypeColors: Record<EventType, string> = {
  wedding: 'bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-300',
  bar: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
  restaurant: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300',
  festival: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
  corporate: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  private: 'bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-300',
};

export const statusLabels: Record<EventStatus, string> = {
  draft: 'Borrador', published: 'Publicado', closed: 'Cerrado',
};

export const statusColors: Record<EventStatus, string> = {
  draft: 'bg-muted text-muted-foreground',
  published: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300',
  closed: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
};

export const applicationStatusLabels: Record<ApplicationStatus, string> = {
  pending: 'Pendiente', accepted: 'Aceptada', rejected: 'Rechazada',
};

export const applicationStatusColors: Record<ApplicationStatus, string> = {
  pending: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
  accepted: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300',
  rejected: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
};
