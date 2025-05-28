import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { ApiResponse } from '../models/api.models';
import { UserDetails, UserEmail } from '../models/user.models';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private readonly API_URL = environment.apiUrl;

  constructor(private http: HttpClient) {}

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('access_token');
    return new HttpHeaders().set('Authorization', `Bearer ${token}`);
  }

  getUsers(): Observable<ApiResponse<UserDetails[]>> {
    return this.http.get<ApiResponse<UserDetails[]>>(`${this.API_URL}/users/list`, {
      headers: this.getHeaders()
    });
  }

  deleteUser(email: string): Observable<ApiResponse<null>> {
    return this.http.delete<ApiResponse<null>>(`${this.API_URL}/users/delete`, {
      headers: this.getHeaders(),
      body: {email}
    });
  }

  createUser(email: string): Observable<ApiResponse<UserEmail>> {
    return this.http.post<ApiResponse<UserEmail>>(`${this.API_URL}/users/create`, {email}, {
      headers: this.getHeaders()
    });
  }
} 