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
export interface LoginResponseData {
  access_token: string;
  user: {
    uuid: string;
    email: string;
    role: string;
  };
}

/**
 * Response del login
 * Ritorna i dati di autenticazione
 */
export type LoginResponse = ApiResponse<LoginResponseData>;

/**
 * Request per il recupero password
 * Richiede solo l'email
 */
export interface RecoverRequest {
  email: string;
}

/**
 * Response del recupero password
 * Ritorna il tempo di validità del token
 */
export interface RecoverResponseData {
  expiresIn: number; // Duration in seconds (10 minutes)
}

/**
 * Response del recupero password
 * Ritorna il tempo di validità del token
 */
export type RecoverResponse = ApiResponse<RecoverResponseData>;

/**
 * Request per la verifica del token
 * Richiede il token e la nuova password
 */
export interface VerifyRequest {
  token: string;
  new_password: string;
}

/**
 * Response della verifica token
 * Non ritorna dati
 */
export type VerifyResponse = ApiResponse<null>; 