import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { AbstractControl, FormControl, FormGroup, FormsModule, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { RouterLink, Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { DividerModule } from 'primeng/divider';
import { PasswordModule } from 'primeng/password';
import { ToastModule } from 'primeng/toast';
import { InputTextModule } from 'primeng/inputtext';
import { NotificationService } from '../../../services/notification.service';
import { AuthService } from '../../../services/auth.service';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-verify',
  standalone: true,
  imports: [
    ToastModule,
    FormsModule,
    ReactiveFormsModule,
    ButtonModule,
    DividerModule,
    CommonModule,
    RouterLink,
    PasswordModule,
    InputTextModule
  ],
  providers: [
    MessageService,
    NotificationService
  ],
  templateUrl: './verify.component.html',
  styleUrl: './verify.component.scss'
})
export class VerifyComponent {
  loading = false;

  form: FormGroup = new FormGroup({
    password: new FormControl(null, [Validators.required, Validators.minLength(8), Validators.pattern(/^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[#?!@$%^&*-]).{8,}$/)]),
    passwordConfirm: new FormControl(null, [Validators.required]),
  }, { validators: this.passwordMatchValidator.bind(this) });

  constructor(
    private notificationService: NotificationService,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  get password(): FormControl {
    return this.form.get('password') as FormControl;
  }

  get passwordConfirm(): FormControl {
    return this.form.get('passwordConfirm') as FormControl;
  }

  passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
    const formGroup = control as FormGroup;
    const password = formGroup.get('password')?.value;
    const confirmPassword = formGroup.get('passwordConfirm')?.value;
    return password === confirmPassword ? null : { mismatch: true };
  }

  verify() {
    if (this.form.invalid) {
      this.notificationService.handleWarning('Please fill in all required fields correctly');
      return;
    }

    this.loading = true;
    const token = this.route.snapshot.queryParamMap.get('token');
    
    if (!token) {
      this.notificationService.handleWarning('Invalid or missing token');
      this.loading = false;
      return;
    }

    this.authService.verify({
      token,
      new_password: this.password.value
    }).subscribe({
      next: (response) => {
        if (response.success) {
          this.notificationService.handleSuccess('Password updated successfully');
          this.router.navigate(['/login']);
        } else {
          this.notificationService.handleWarning(response.message || 'Failed to update password');
        }
      },
      error: (error) => {
        this.notificationService.handleError(error, 'An error occurred while updating password');
      },
      complete: () => {
        this.loading = false;
      }
    });
  }
}
