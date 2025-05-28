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
 * Response del recupero password
 * Ritorna il tempo di validità del token
 */
export interface RecoverResponse {
  expiresIn: number; // Duration in seconds (10 minutes)
}

/**
 * Body per l'invio della richiesta della verifica del token
 * Richiede il token e la nuova password
 */
export interface VerifyRequest {
  token: string;
  new_password: string;
  confirm_password: string;
}