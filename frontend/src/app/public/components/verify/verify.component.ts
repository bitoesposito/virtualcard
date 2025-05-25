import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { AbstractControl, FormControl, FormGroup, FormsModule, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { RippleModule } from 'primeng/ripple';
import { ToastModule } from 'primeng/toast';
import { NotificationService } from '../../../services/notification.service';
import { AuthService } from '../../../services/auth.service';
import { finalize } from 'rxjs';
import { ApiResponse } from '../../../models/api.models';
import { VerifyRequest } from '../../../models/auth.models';

@Component({
  selector: 'app-verify',
  standalone: true,
  imports: [
    ButtonModule,
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
  templateUrl: './verify.component.html',
  styleUrl: './verify.component.scss'
})
export class VerifyComponent implements OnInit {
  loading = false;
  token: string | null = null;

  form: FormGroup = new FormGroup({
    password: new FormControl(null, [
      Validators.required,
      Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?])[A-Za-z\d!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]{8,}$/)
    ]),
    confirmPassword: new FormControl(null, [Validators.required])
  }, { validators: this.passwordMatchValidator });

  constructor(
    private notificationService: NotificationService,
    private router: Router,
    private route: ActivatedRoute,
    private authService: AuthService
  ) { }

  ngOnInit() {
    this.token = this.route.snapshot.queryParamMap.get('token');
    if (!this.token) {
      this.notificationService.handleError('Invalid or missing token', 'Token Error');
      this.router.navigate(['/login']);
    }
  }

  get password(): FormControl {
    return this.form.get('password') as FormControl;
  }

  get confirmPassword(): FormControl {
    return this.form.get('confirmPassword') as FormControl;
  }

  passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
    const formGroup = control as FormGroup;
    const password = formGroup.get('password')?.value;
    const confirmPassword = formGroup.get('confirmPassword')?.value;
    return password === confirmPassword ? null : { passwordMismatch: true };
  }

  resetPassword() {
    if (this.form.invalid || !this.token) {
      this.notificationService.handleWarning('Please fill in all required fields correctly');
      return;
    }

    this.loading = true;
    const data: VerifyRequest = {
      token: this.token,
      new_password: this.password.value,
      confirm_password: this.confirmPassword.value
    };

    this.authService.verifyToken(data)
      .pipe(
        finalize(() => this.loading = false)
      )
      .subscribe({
        next: (response: ApiResponse<null>) => {
          this.notificationService.handleSuccess('Password has been updated successfully');
          this.router.navigate(['/login']);
        },
        error: (error: any) => {
          this.notificationService.handleError(error, 'An error occurred while updating password');
        }
      });
  }
}
