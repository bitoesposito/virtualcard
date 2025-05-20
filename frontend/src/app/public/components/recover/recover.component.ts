import { Component } from '@angular/core';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { PasswordModule } from 'primeng/password';
import { ToastModule } from 'primeng/toast';
import { InputTextModule } from 'primeng/inputtext';
import { MessageService } from 'primeng/api';
import { NotificationService } from '../../../services/notification.service';

@Component({
  selector: 'app-recover',
  standalone: true,
  imports: [
    ToastModule,
    FormsModule,
    ReactiveFormsModule,
    PasswordModule,
    ButtonModule,
    RouterModule,
    InputTextModule
  ],
  providers: [
    MessageService,
    NotificationService
  ],
  templateUrl: './recover.component.html',
  styleUrl: './recover.component.scss'
})
export class RecoverComponent {

  form : FormGroup = new FormGroup({
    email: new FormControl(null, [Validators.required, Validators.pattern(/^[a-z0-9!#$%&'*+\/=?^_`{|}~.-]+@[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)*$/i)])
  })

  constructor(
    private notificationService: NotificationService,
    private router: Router
  ) {}

  recover() {
  }
}
