import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { RippleModule } from 'primeng/ripple';
import { ToastModule } from 'primeng/toast';
import { NotificationService } from '../../../services/notification.service';
import { AuthService } from '../../../services/auth.service';
import { finalize } from 'rxjs';
import { ApiResponse } from '../../../models/api.models';

@Component({
  selector: 'app-recover',
  standalone: true,
  imports: [
    ButtonModule,
    InputTextModule,
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
  templateUrl: './recover.component.html',
  styleUrl: './recover.component.scss'
})
export class RecoverComponent {
  loading = false;

  form: FormGroup = new FormGroup({
    email: new FormControl(null, [Validators.required, Validators.pattern(/^[a-z0-9!#$%&'*+\/=?^_`{|}~.-]+@[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)*$/i)])
  });

  constructor(
    private notificationService: NotificationService,
    private router: Router,
    private authService: AuthService
  ) { }

  get email(): FormControl {
    return this.form.get('email') as FormControl;
  }

  recover() {
    if (this.form.invalid) {
      this.notificationService.handleWarning('Please enter a valid email address');
      return;
    }

    this.loading = true;
    const email = this.email.value;

    this.authService.recoverPassword(email)
      .pipe(
        finalize(() => this.loading = false)
      )
      .subscribe({
        next: () => {
          this.notificationService.handleSuccess('If the email address is registered, you will receive a password reset link');
          this.router.navigate(['/login']);
        },
        error: (error: any) => {
          this.notificationService.handleError(error, 'An error occurred during password recovery');
        }
      });
  }
}
