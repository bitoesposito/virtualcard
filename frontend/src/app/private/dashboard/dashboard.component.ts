import { Component } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { InputGroupModule } from 'primeng/inputgroup';
import { InputGroupAddonModule } from 'primeng/inputgroupaddon';
import { InputTextModule } from 'primeng/inputtext';
import { CommonModule } from '@angular/common';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { PaginatorModule } from 'primeng/paginator';
import { Router, RouterModule } from '@angular/router';
import { ConfirmationService, MessageService } from 'primeng/api';
import { jwtDecode } from 'jwt-decode';
import { NotificationService } from '../../services/notification.service';
import { ToastModule } from 'primeng/toast';
import { UserService } from '../../services/user.service';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { TooltipModule } from 'primeng/tooltip';
import { DialogModule } from 'primeng/dialog';
import { finalize } from 'rxjs';

@Component({
  selector: 'app-dashboard',
  imports: [
    ButtonModule,
    InputGroupModule,
    InputGroupAddonModule,
    InputTextModule,
    CommonModule,
    FormsModule,
    PaginatorModule,
    RouterModule,
    ToastModule,
    ConfirmDialogModule,
    TooltipModule,
    DialogModule,
    FormsModule,
    ReactiveFormsModule
  ],
  providers: [
    MessageService,
    NotificationService,
    ConfirmationService
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent {

  users: any[] = [];
  paginator: any[] = [];
  currentUserEmail: string = ''
  showNewUserDialog: boolean = false

  loading = false;

  form: FormGroup = new FormGroup({
    email: new FormControl('', [Validators.required, Validators.pattern(/^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,4}$/)])
  });

  constructor(
    private notificationService: NotificationService,
    private router: Router,
    private userService: UserService,
    private confirmationService: ConfirmationService
  ) {
    this.setCurrentUserEmail();
    this.getUsers();
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
        this.create();
      },
      reject: () => {
        this.form.reset();
        this.showNewUserDialog = false;
      },
    });
  }

  create() {
    if (this.form.invalid) {
      this.notificationService.handleWarning('Please fill in all required fields correctly');
      return;
    }

    this.loading = true;
    this.userService.createUser(this.form.get('email')?.value)
      .pipe(
        finalize(() => {
          this.loading = false;
          this.showNewUserDialog = false; // Close modal after operation
          this.form.reset(); // Reset form
        })
      )
      .subscribe({
        next: (response) => {
          if (response.success) {
            this.notificationService.handleSuccess('User created successfully');
            this.getUsers(); // Refresh user list
          } else {
            this.notificationService.handleError(response.message, 'Failed to create user');
          }
        },
        error: (error) => {
          this.notificationService.handleError(error, 'An error occurred while creating the user');
        }
      });
  }

  deleteUserDialog(event: Event, email: string) {
    this.confirmationService.confirm({
      target: event.target as EventTarget,
      message: 'Sei sicuro di voler eliminare l\'utente?',
      header: 'Elimina utente',
      closable: true,
      closeOnEscape: true,
      icon: 'pi pi-exclamation-circle',
      rejectButtonProps: {
        label: 'annulla',
        severity: 'secondary',
        outlined: true,
      },
      acceptButtonProps: {
        label: 'Elimina',
        severity: 'danger'
      },
      accept: () => {
        this.loading = true;
        this.deleteUser(email);
      },
      reject: () => {
        // No action needed on reject
      },
    });
  }

  setCurrentUserEmail() {
    const token = localStorage.getItem('access_token');
    if (token) {
      const decoded: any = jwtDecode(token);
      this.currentUserEmail = decoded.email;
    }
  }

  getUsers() {
    this.userService.getUsers().subscribe({
      next: (response) => {
        if (response.success) {
          this.users = response.data || [];
        } else {
          this.notificationService.showMessage('error', response.message || 'Errore nel recupero degli utenti');
        }
      },
      error: (error) => {
        this.notificationService.handleError(error, 'Errore nel recupero degli utenti');
      }
    });
  }

  deleteUser(email: string) {
    this.userService.deleteUser(email)
      .pipe(
        finalize(() => this.loading = false)
      )
      .subscribe({
        next: (response) => {
          if (response.success) {
            this.notificationService.showMessage('success', 'Utente eliminato con successo');
            this.getUsers(); // Refresh user list
          } else {
            this.notificationService.showMessage('error', response.message || 'Errore nell\'eliminazione dell\'utente');
          }
        },
        error: (error) => {
          this.notificationService.handleError(error, 'Errore nell\'eliminazione dell\'utente');
        }
      });
  }

  disconnect() {
    localStorage.removeItem('access_token');
    this.router.navigate(['/login']);
  }

  toggleNewUserDialog() {
    this.showNewUserDialog = !this.showNewUserDialog
  }
}
