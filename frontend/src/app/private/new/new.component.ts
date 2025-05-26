import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { CheckboxModule } from 'primeng/checkbox';
import { TooltipModule } from 'primeng/tooltip';
import { SelectModule } from 'primeng/select';
import { ImageModule } from 'primeng/image';
import { NotificationService } from '../../services/notification.service';
import { UserService } from '../../services/user.service';
import { finalize } from 'rxjs';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-new',
  imports: [
    ToastModule,
    FormsModule,
    ReactiveFormsModule,
    InputTextModule,
    ButtonModule,
    RouterModule,
    CheckboxModule,
    TooltipModule,
    SelectModule,
    ImageModule,
    CommonModule
  ],
  providers: [
    NotificationService,
    MessageService
  ],
  templateUrl: './new.component.html',
  styleUrl: './new.component.scss'
})
export class NewComponent implements OnInit {
  loading = false;

  form: FormGroup = new FormGroup({
    email: new FormControl('', [Validators.required, Validators.email])
  });

  constructor(
    private userService: UserService,
    private router: Router,
    private notificationService: NotificationService
  ){}

  ngOnInit(): void {
  }

  create() {
    if (this.form.invalid) {
      this.notificationService.handleWarning('Please fill in all required fields correctly');
      return;
    }

    this.loading = true;
    this.userService.createUser(this.form.get('email')?.value)
      .pipe(
        finalize(() => this.loading = false)
      )
      .subscribe({
        next: (response) => {
          if (response.success) {
            this.notificationService.handleSuccess('User created successfully');
            this.router.navigate(['/private/dashboard']);
          } else {
            this.notificationService.handleError(response.message, 'Failed to create user');
          }
        },
        error: (error) => {
          this.notificationService.handleError(error, 'An error occurred while creating the user');
        }
      });
  }
}
