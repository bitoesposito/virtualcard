import { Component } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { InputGroupModule } from 'primeng/inputgroup';
import { InputGroupAddonModule } from 'primeng/inputgroupaddon';
import { InputTextModule } from 'primeng/inputtext';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PaginatorModule } from 'primeng/paginator';
import { Router, RouterModule } from '@angular/router';
import { MessageService } from 'primeng/api';
import { jwtDecode } from 'jwt-decode';
import { NotificationService } from '../../services/notification.service';

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
    RouterModule
  ],
  providers: [
    MessageService,
    NotificationService
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent {

  users: any[] = [];
  paginator: any[] = [];
  currentUserEmail: string | null = null;

  constructor(
    private notificationService: NotificationService,
    private router: Router
  ) {
    this.setCurrentUserEmail();
    this.getUsers();
  }

  setCurrentUserEmail() {
    const token = localStorage.getItem('access_token');
    if (token) {
      const decoded: any = jwtDecode(token);
      this.currentUserEmail = decoded.email;
    }
  }
  
  getUsers() {
  }

  deleteUser(email: string) {
  }

  disconnect() {
  }
}
