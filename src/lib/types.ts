// Shared types used across the app - mirrors DB schema
export type UserRole = 'musician' | 'organizer' | 'user';
export type EventType = 'wedding' | 'bar' | 'restaurant' | 'festival' | 'corporate' | 'private';
export type EventStatus = 'draft' | 'published' | 'closed';
export type ApplicationStatus = 'pending' | 'accepted' | 'rejected';

export interface Profile {
  id: string;
  user_id: string;
  role: UserRole;
  display_name: string;
  avatar_url: string | null;
  city: string | null;
  phone: string | null;
  bio: string | null;
}

export interface ArtistProfile {
  id: string;
  user_id: string;
  artist_name: string;
  base_rate: number;
  genres: string[];
  instruments: string[];
  experience: string | null;
  education: string | null;
  languages: string[];
  availability: string | null;
  travel_radius: string | null;
  equipment: string[];
  website: string | null;
  social_media: { platform: string; url: string }[];
}

export interface DbEvent {
  id: string;
  organizer_id: string;
  title: string;
  type: EventType;
  date: string;
  time: string;
  end_time: string | null;
  city: string;
  venue: string;
  description: string;
  payment: number;
  payment_max: number | null;
  genres: string[];
  musicians_needed: number;
  duration: string;
  dress_code: string;
  sound_provided: boolean;
  instruments_needed: string[];
  status: EventStatus;
  created_at: string;
}

export interface DbApplication {
  id: string;
  event_id: string;
  musician_id: string;
  message: string;
  proposed_rate: number;
  status: ApplicationStatus;
  created_at: string;
}

export interface DbReview {
  id: string;
  artist_id: string;
  reviewer_id: string;
  rating: number;
  comment: string;
  created_at: string;
}

export interface PortfolioItem {
  id: string;
  artist_id: string;
  title: string;
  type: string;
  url: string;
}

// Helper maps
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

export const allGenres = ['Rock', 'Jazz', 'Pop', 'Clásica', 'Reggaeton', 'Salsa', 'Blues', 'Folk', 'Electrónica', 'R&B'];
export const allInstruments = ['Guitarra', 'Bajo', 'Batería', 'Teclado', 'Voz', 'Saxofón', 'Violín', 'Trompeta', 'DJ', 'Percusión'];
