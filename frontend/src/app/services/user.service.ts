import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { ApiResponse } from '../models/api.models';
import { User, UserDetails, UserEmail } from '../models/user.models';
import { map } from 'rxjs/operators';

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

  private ensureHttps(url: string | undefined): string | undefined {
    if (!url) return url;
    if (url.startsWith('http://')) {
      return url.replace('http://', 'https://');
    }
    return url;
  }

  getUsers(): Observable<ApiResponse<UserDetails[]>> {
    return this.http.get<ApiResponse<UserDetails[]>>(`${this.API_URL}/users/list`, {
      headers: this.getHeaders()
    }).pipe(
      map(response => {
        if (response.data) {
          response.data = response.data.map(user => ({
            ...user,
            profile_photo: this.ensureHttps(user.profile_photo)
          }));
        }
        return response;
      })
    );
  }

  getPublicUser(slug: string): Observable<ApiResponse<User>> {
    return this.http.get<ApiResponse<User>>(`${this.API_URL}/users/${slug}`).pipe(
      map(response => {
        if (response.data) {
          response.data.profilePhoto = this.ensureHttps(response.data.profilePhoto);
        }
        return response;
      })
    );
  }

  getUser(uuid: string): Observable<ApiResponse<UserDetails>> {
    return this.http.get<ApiResponse<UserDetails>>(`${this.API_URL}/users/by-id/${uuid}`, {
      headers: this.getHeaders()
    }).pipe(
      map(response => {
        if (response.data) {
          response.data.profile_photo = this.ensureHttps(response.data.profile_photo);
        }
        return response;
      })
    );
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