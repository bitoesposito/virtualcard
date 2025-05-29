import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { ToastModule } from 'primeng/toast';
import { ConfirmationService, MessageService } from 'primeng/api';
import { CheckboxModule } from 'primeng/checkbox';
import { TooltipModule } from 'primeng/tooltip';
import { SelectModule } from 'primeng/select';
import { ImageModule } from 'primeng/image';
import { NotificationService } from '../../services/notification.service';
import { UserService } from '../../services/user.service';
import { finalize } from 'rxjs';
import { CommonModule } from '@angular/common';
import { ConfirmDialogModule } from 'primeng/confirmdialog';

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
    CommonModule,
    ConfirmDialogModule
  ],
  providers: [
    NotificationService,
    MessageService,
    ConfirmationService
  ],
  templateUrl: './new.component.html',
  styleUrl: './new.component.scss'
})
export class NewComponent implements OnInit {
  loading = false;

  form: FormGroup = new FormGroup({
    email: new FormControl('', [Validators.required, Validators.pattern(/^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,4}$/)])
  });

  constructor(
    private userService: UserService,
    private router: Router,
    private notificationService: NotificationService,
    private confirmationService: ConfirmationService
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

  confirmCreationDialog(event: Event) {
    this.confirmationService.confirm({
      target: event.target as EventTarget,
      message: 'Conferma di voler procedere con la creazione',
      header: 'Crea utente',
      closable: true,
      closeOnEscape: true,
      icon: 'pi pi-exclamation-circle',
      rejectButtonProps: {
        label: 'annulla',
        severity: 'secondary',
        outlined: true,
      },
      acceptButtonProps: {
        label: 'Conferma',
      },
      accept: () => {
        this.create()
        setTimeout(() => {
          this.router.navigate(['/private/dashboard'])
        }, 2000)
      },
      reject: () => {
      },
    });
  }
}
