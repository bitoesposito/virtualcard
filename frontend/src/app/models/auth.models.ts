import { ApiResponse } from './api.models';
import { User } from './user.models';

/**
 * Request per il login
 * Richiede email e password
 */
export interface LoginRequest {
  email: string;
  password: string;
}

/**
 * Dati restituiti dal login
 * Contiene il token JWT e i dati essenziali dell'utente
 */
export interface LoginData {
  access_token: string;
  user: Pick<User, 'uuid' | 'email' | 'role'>;
}

/**
 * Response del login
 * Ritorna i dati di autenticazione
 */
export type LoginResponse = ApiResponse<LoginData>;

/**
 * Request per il recupero password
 * Richiede solo l'email
 */
export type RecoverPasswordRequest = Pick<LoginRequest, 'email'>;

/**
 * Response del recupero password
 * Ritorna il tempo di validità del token
 */
export type RecoverPasswordResponse = ApiResponse<{ expiresIn: number }>;

/**
 * Request per la verifica del token
 * Richiede il token e la nuova password
 */
export interface VerifyTokenRequest {
  token: string;
  new_password: string;
}

/**
 * Response della verifica token
 * Non ritorna dati
 */
export type VerifyTokenResponse = ApiResponse<null>; 