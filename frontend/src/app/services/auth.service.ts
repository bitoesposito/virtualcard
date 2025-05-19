import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { LoginRequest, LoginResponse } from '../models/auth.models';
import { ApiResponse } from '../models/api.models';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly API_URL = `${environment.apiUrl}/auth`;

  constructor(private http: HttpClient) {}

  /**
   * Effettua il login dell'utente
   * @param credentials Credenziali di accesso (email e password)
   * @returns Observable con la risposta del server contenente il token e i dati utente
   */
  login(credentials: LoginRequest): Observable<ApiResponse<LoginResponse>> {
    return this.http.post<ApiResponse<LoginResponse>>(`${this.API_URL}/login`, credentials);
  }

  /**
   * Salva il token JWT nel localStorage
   * @param token Token JWT da salvare
   */
  setToken(token: string): void {
    localStorage.setItem('access_token', token);
  }

  /**
   * Recupera il token JWT dal localStorage
   * @returns Token JWT salvato o null se non presente
   */
  getToken(): string | null {
    return localStorage.getItem('access_token');
  }

  /**
   * Rimuove il token JWT dal localStorage
   */
  logout(): void {
    localStorage.removeItem('access_token');
  }

  /**
   * Verifica se l'utente è autenticato
   * @returns true se il token è presente, false altrimenti
   */
  isAuthenticated(): boolean {
    return !!this.getToken();
  }
} 