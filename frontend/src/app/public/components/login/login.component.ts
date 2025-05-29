import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { CheckboxModule } from 'primeng/checkbox';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { RippleModule } from 'primeng/ripple';
import { ToastModule } from 'primeng/toast';
import { NotificationService } from '../../../services/notification.service';
import { AuthService } from '../../../services/auth.service';
import { finalize } from 'rxjs';
import { jwtDecode } from 'jwt-decode';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    ButtonModule, 
    CheckboxModule, 
    InputTextModule, 
    PasswordModule, 
    FormsModule, 
    RouterModule, 
    RippleModule,
    CommonModule,
    ToastModule,
    ReactiveFormsModule
  ],
  providers: [
    MessageService,
    NotificationService
  ],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent implements OnInit {
  loading = false;

  form: FormGroup = new FormGroup({
    email: new FormControl(null, [Validators.pattern(/^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,4}$/)]),
    password: new FormControl(null, [
      Validators.required,
      Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?])[A-Za-z\d!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]{8,}$/)
    ])
  })

  constructor(
    private notificationService: NotificationService,
    private router: Router,
    private authService: AuthService
  ) {}

  ngOnInit() {
    this.checkTokenAndRedirect();
    setTimeout(() => {
      this.checkNotifications();
    }, 100);
  }

  private checkTokenAndRedirect() {
    const token = localStorage.getItem('access_token');

    if (token) {
      try {
        const decoded: any = jwtDecode(token);

        if (decoded.exp && Date.now() < decoded.exp * 1000) {
          if (decoded.role === 'admin') {
            this.router.navigate(['/private/dashboard']);
          } else {
            this.router.navigate(['/private/edit']);
          }
        } else {
          localStorage.removeItem('access_token');
        }
      } catch (error) {
        console.error('Error decoding token:', error);
        localStorage.removeItem('access_token');
      }
    } else {
    }
  }

  private checkNotifications() {
    const showNotification = localStorage.getItem('show_password_reset_notification');
    const showRecoveryNotification = localStorage.getItem('show_password_recovery_notification');
    if (showNotification === 'true') {
      this.notificationService.handleSuccess('Password resettata con successo.');
      localStorage.removeItem('show_password_reset_notification');
    }
    if (showRecoveryNotification === 'true') {
      this.notificationService.handleSuccess('Se l\'email è registrata, riceverai un link per reimpostare la password.');
      localStorage.removeItem('show_password_recovery_notification');
    }
  }

  get email(): FormControl {
    return this.form.get('email') as FormControl
  }

  get password(): FormControl {
    return this.form.get('password') as FormControl
  }

  login() {
    if (this.form.invalid) {
      this.notificationService.handleWarning('Please fill in all required fields correctly');
      return;
    }

    this.loading = true;
    const credentials = {
      email: this.email.value,
      password: this.password.value
    };

    this.authService.login(credentials)
      .pipe(
        finalize(() => this.loading = false)
      )
      .subscribe({
        next: (response) => {
          this.notificationService.handleApiResponse(response, 'Login failed');
          
          if (response.success && response.data) {
            this.authService.setToken(response.data.access_token);
            // Redirect based on user role
            if (response.data.user.role === 'admin') {
              this.router.navigate(['/private/dashboard']);
            } else {
              this.router.navigate(['/private/edit']);
            }
          }
        },
        error: (error) => {
          this.notificationService.handleError(error, 'An error occurred during login');
        }
      });
  }
}
