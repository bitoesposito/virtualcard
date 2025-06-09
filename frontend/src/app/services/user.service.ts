import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { ApiResponse } from '../models/api.models';
import { User, UserDetails, UserEmail } from '../models/user.models';

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

  getPublicUser(slug: string): Observable<ApiResponse<User>> {
    return this.http.get<ApiResponse<User>>(`${this.API_URL}/users/${slug}`)
  }

  getUser(uuid: string): Observable<ApiResponse<UserDetails>> {
    return this.http.get<ApiResponse<UserDetails>>(`${this.API_URL}/users/by-id/${uuid}`, {
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

  updateProfile(profileData: any): Observable<ApiResponse<UserDetails>> {
    return this.http.put<ApiResponse<UserDetails>>(`${this.API_URL}/users/edit`, profileData, {
      headers: this.getHeaders()
    });
  }

  checkSlugAvailability(slug: string): Observable<ApiResponse<{ available: boolean }>> {
    return this.http.get<ApiResponse<{ available: boolean }>>(`${this.API_URL}/users/check-slug/${slug}`, {
      headers: this.getHeaders()
    });
  }

  uploadProfilePicture(file: File, email: string): Observable<ApiResponse<UserDetails>> {
    const formData = new FormData();
    formData.append('photo', file);
    formData.append('email', email);
    return this.http.post<ApiResponse<UserDetails>>(`${this.API_URL}/users/upload-photo`, formData);
  }
} 