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
import * as languages from '../../assets/languages.json';
import { Language, UserDetails } from '../../models/user.models';
import { ApiResponse } from '../../models/api.models';
import { jwtDecode } from 'jwt-decode';
import { CommonModule } from '@angular/common';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { DividerModule } from 'primeng/divider';

@Component({
  selector: 'app-edit',
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
    DividerModule
  ],
  providers: [
    NotificationService,
    MessageService
  ],
  templateUrl: './edit.component.html',
  styleUrl: './edit.component.scss'
})
export class EditComponent implements OnInit {
  userData: any = {};
  area_code = (languages as any).default.map((lang: Language) => ({
    label: lang.iso.toUpperCase(),
    value: lang.code,
    flag: `/flags/${lang.iso.toUpperCase()}.png`
  }));
  selectedAreaCode = '';
  isAdmin = false;
  slugError: string | null = null;
  form: FormGroup = new FormGroup({
    name: new FormControl('', [Validators.required]),
    surname: new FormControl('', [Validators.required]),
    areaCode: new FormControl('+39', [Validators.required, Validators.pattern(/^\+\d{1,4}(-\d{1,4})?$/)]),
    phone: new FormControl('', [Validators.required]),
    website: new FormControl('', [
      Validators.pattern(/^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?$/)
    ]),
    isWebsiteEnabled: new FormControl(false),
    isWhatsappEnabled: new FormControl(false),
    isVcardEnabled: new FormControl(false),
    slug: new FormControl('', [
      Validators.required,
      Validators.pattern(/^[a-z0-9-]{3,50}$/),
      Validators.minLength(3),
      Validators.maxLength(50)
    ])
  });

  constructor(
    private userService: UserService,
    private router: Router,
    private notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    this.getUserData();
    this.setupSlugValidation();
  }

  private setupSlugValidation() {
    this.form.get('slug')?.valueChanges.pipe(
      debounceTime(500),
      distinctUntilChanged()
    ).subscribe(slug => {
      if (slug && this.form.get('slug')?.valid) {
        this.checkSlugAvailability(slug);
      } else {
        this.slugError = null;
      }
    });
  }

  private checkSlugAvailability(slug: string) {
    if (slug === this.userData.slug) {
      this.slugError = null;
      return;
    }

    this.userService.checkSlugAvailability(slug).subscribe({
      next: (response: ApiResponse<{ available: boolean }>) => {
        if (!response.data?.available) {
          this.slugError = 'Questo slug è già in uso. Scegline un altro.';
          this.form.get('slug')?.setErrors({ 'slugTaken': true });
        } else {
          this.slugError = null;
          const currentErrors = this.form.get('slug')?.errors;
          if (currentErrors) {
            delete currentErrors['slugTaken'];
            if (Object.keys(currentErrors).length === 0) {
              this.form.get('slug')?.setErrors(null);
            } else {
              this.form.get('slug')?.setErrors(currentErrors);
            }
          }
        }
      },
      error: (error: Error) => {
        this.notificationService.handleError(error, 'Errore durante la verifica dello slug');
        this.slugError = null;
      }
    });
  }

  disconnect() {
    localStorage.removeItem('access_token');
    this.router.navigate(['/login']);
  }

  editProfile() {
    if (this.form.valid) {
      const formData = this.form.value;
      
      // Ensure website URL has https:// prefix
      if (formData.website) {
        try {
          const url = new URL(formData.website);
          if (url.protocol !== 'https:') {
            formData.website = `https://${url.host}${url.pathname}${url.search}${url.hash}`;
          }
        } catch {
          // If URL parsing fails, assume it's a domain and add https://
          formData.website = `https://${formData.website}`;
        }
      }

      this.userService.updateProfile(formData).subscribe({
        next: (response: any) => {
          this.notificationService.handleSuccess('Profilo aggiornato con successo');
          this.getUserData();
        },
        error: (error: any) => {
          this.notificationService.handleError(error, 'Errore durante l\'aggiornamento del profilo');
        }
      });
    } else {
      this.notificationService.handleWarning('Compila tutti i campi obbligatori');
    }
  }

  getUserData() {
    const token = localStorage.getItem('access_token');
    if (!token) {
      this.notificationService.handleError(null, 'Sessione scaduta');
      this.disconnect();
      return;
    }

    try {
      const decoded: any = jwtDecode(token);
      if (!decoded.sub) {
        this.notificationService.handleError(null, 'Token non valido');
        return;
      }

      this.userService.getUser(decoded.sub).subscribe({
        next: (response: ApiResponse<UserDetails>) => {
          if (response.success && response.data) {
            this.userData = response.data;
            this.form.patchValue({
              name: response.data.name || '',
              surname: response.data.surname || '',
              areaCode: response.data.areaCode || '+39',
              phone: response.data.phone || '',
              website: response.data.website || '',
              isWebsiteEnabled: response.data.isWebsiteEnabled || false,
              isWhatsappEnabled: response.data.isWhatsappEnabled || false,
              isVcardEnabled: response.data.isVcardEnabled || false,
              slug: response.data.slug || ''
            });
            this.selectedAreaCode = response.data.areaCode || '+39';
          } else {
            this.notificationService.handleError(null, response.message || 'Errore nel recupero dei dati del profilo');
          }
        },
        error: (error: any) => {
          if (error.status === 401) {
            this.disconnect();
          } else {
            this.notificationService.handleError(error, 'Errore durante il recupero del profilo');
          }
        }
      });

      if (decoded.role === 'admin') {
        this.isAdmin = true;
      }

    } catch (error) {
      this.notificationService.handleError(error, 'Errore nella decodifica del token');
    }
  }

  onAreaCodeChange(event: any) {
    this.selectedAreaCode = event.value;
  }

  shareProfile() {
    const url = `${window.location.origin}/u/${this.userData.slug}`;
    navigator.clipboard.writeText(url);
    this.notificationService.handleSuccess('Link del profilo copiato negli appunti');
  }

  isProfileConfigured(): boolean {
    if (!this.userData) return false;
    
    // Check if required fields are filled
    return !!(this.userData.name && 
              this.userData.surname && 
              this.userData.phone && 
              this.userData.slug);
  }
}
