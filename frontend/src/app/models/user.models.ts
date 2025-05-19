import { ApiResponse } from './api.models';

/**
 * Ruoli disponibili nel sistema
 */
export type UserRole = 'ADMIN' | 'USER';

/**
 * Interfaccia principale dell'utente
 * Contiene tutti i campi possibili di un utente nel sistema
 */
export interface User {
  // Campi di sistema
  uuid: string;
  email: string;
  role: UserRole;
  isConfigured: boolean;
  createdAt: string;
  updatedAt: string;

  // Campi personali
  name?: string;
  surname?: string;
  
  // Campi di contatto
  areaCode?: string;
  phone?: string;
  website?: string;
  
  // Campi di configurazione
  slug?: string;
  isVcardEnabled: boolean;
  isWhatsappEnabled: boolean;
  isWebsiteEnabled: boolean;
}

/**
 * Request per la creazione di un nuovo utente
 * Richiede solo l'email, gli altri campi sono opzionali
 */
export type CreateUserRequest = Pick<User, 'email'>;

/**
 * Request per la modifica di un utente
 * Tutti i campi sono opzionali e non possono modificare i campi di sistema
 */
export type EditUserRequest = Partial<Omit<User, 
  'uuid' | 'email' | 'role' | 'isConfigured' | 'createdAt' | 'updatedAt'
>>;

/**
 * Response per la creazione di un utente
 * Ritorna l'email dell'utente creato
 */
export type CreateUserResponse = ApiResponse<Pick<User, 'email'>>;

/**
 * Response per la modifica di un utente
 * Ritorna l'utente aggiornato
 */
export type EditUserResponse = ApiResponse<User>;

/**
 * Response per il recupero di un singolo utente
 * Ritorna i dati dell'utente richiesto
 */
export type GetUserResponse = ApiResponse<User>;

/**
 * Response per il recupero della lista utenti
 * Ritorna un array di utenti
 */
export type ListUsersResponse = ApiResponse<User[]>;

/**
 * Response per l'eliminazione di un utente
 * Non ritorna dati
 */
export type DeleteUserResponse = ApiResponse<null>;