import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
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
export class LoginComponent {
  loading = false;

  form: FormGroup = new FormGroup({
    email: new FormControl(null, [Validators.required, Validators.pattern(/^[a-z0-9!#$%&'*+\/=?^_`{|}~.-]+@[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)*$/i)]),
    password: new FormControl(null, [Validators.required])
  })

  constructor(
    private notificationService: NotificationService,
    private router: Router,
    private authService: AuthService
  ) { }

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
          console.log(response, 'success');
        },
        error: (error) => {
          this.notificationService.handleError(error, 'An error occurred during login');
        }
      });
  }
}
