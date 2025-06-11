import { Component, OnInit } from '@angular/core';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { CommonModule } from '@angular/common';
import { NotificationService } from '../../../services/notification.service';
import { UserService } from '../../../services/user.service';
import { DialogModule } from 'primeng/dialog';
import { QRCodeComponent } from 'angularx-qrcode';
import { ThemeService } from '../../../services/theme.service';

@Component({
  selector: 'app-user-profile',
  imports: [
    ToastModule,
    ButtonModule,
    RouterModule,
    CommonModule,
    ButtonModule,
    DialogModule,
    QRCodeComponent
  ],
  providers: [
    MessageService,
    NotificationService
  ],
  templateUrl: './user-profile.component.html',
  styleUrl: './user-profile.component.scss'
})
export class UserProfileComponent implements OnInit {

  isAdmin: boolean = false
  slug: any = ''
  uuid: any = ''
  uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  userData: any = null
  notFound: boolean = false;
  saveContactDialog: boolean = false;
  qrCodeContent: string = '';
  isDarkMode$;

  constructor(
    private userService: UserService,
    private route: ActivatedRoute,
    private router: Router,
    private notificationService: NotificationService,
    private themeService: ThemeService
  ) {
    this.isDarkMode$ = this.themeService.isDarkMode$;
  }

  ngOnInit(): void {
    this.slug = this.route.snapshot.paramMap.get('slug') || null;
    this.uuid = this.route.snapshot.paramMap.get('uuid') || null;

    if (this.slug != null) {
      this.getPublic();
    } else if (this.uuid != null && this.uuidRegex.test(this.uuid)) {
      this.getUser();
    } else {
      this.notFound = true;
    }
  }

  getPublic() {
    this.userService.getPublicUser(this.slug).subscribe({
      next: (response) => {
        if (response && response.data) {
          this.userData = response.data;
        } else {
          this.notFound = true;
        }
      },
      error: (error) => {
        this.notificationService.handleError(error, 'User not found')
        this.notFound = true;
      }
    })
  }

  getUser() {
    this.userService.getUser(this.uuid).subscribe({
      next: (response) => {
        if (response && response.data) {
          this.userData = response.data;
          this.isAdmin = true;
        } else {
          this.notFound = true;
        }
      },
      error: (error) => {
        this.notificationService.handleError(error, 'User not found')
        this.notFound = true;
      }
    })
  }

  private generateVCardContent(): string {
    if (!this.userData) return '';

    const lines = [
      'BEGIN:VCARD',
      'VERSION:3.0',
      `FN:${this.userData.name || ''} ${this.userData.surname || ''}`.trim(),
      this.userData.email ? `EMAIL:${this.userData.email}` : '',
      this.userData.phone ? `TEL;TYPE=CELL:${this.userData.phone}` : '',
      this.userData.website ? `URL:${this.userData.website.startsWith('http') ? this.userData.website : 'https://' + this.userData.website}` : '',
      'END:VCARD'
    ].filter(Boolean);

    return lines.join('\r\n');
  }

  vCard() {
    if (!this.userData) return;

    const vcardContent = this.generateVCardContent();
    const blob = new Blob([vcardContent], { type: 'text/vcard' });
    const url = window.URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = `${(this.userData.name + this.userData.surname) || 'contact'}.vcf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  }

  toggleSaveContactDialog() {
    this.saveContactDialog = !this.saveContactDialog;
    if (this.saveContactDialog && this.userData) {
      this.qrCodeContent = this.generateVCardContent();
    }
  }
}
