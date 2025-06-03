import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
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
    private notificationService: NotificationService,
    private route: ActivatedRoute
  ) {
    console.log('EditComponent constructor called');
  }

  ngOnInit(): void {
    console.log('EditComponent ngOnInit called');
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
    if (slug === this.userData?.slug) {
      this.slugError = null;
      return;
    }

    if (!slug || !this.form.get('slug')?.valid) {
      this.slugError = null;
      return;
    }

    this.userService.checkSlugAvailability(slug).subscribe({
      next: (response: ApiResponse<{ available: boolean }>) => {
        if (!response.data?.available) {
          this.slugError = 'This profile URL is already taken. Please choose another one.';
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
        this.notificationService.handleError(error, 'Error checking slug availability');
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

      // Map form fields to backend fields
      const profileData = {
        name: formData.name,
        surname: formData.surname,
        area_code: formData.areaCode,
        phone: formData.phone,
        website: formData.website,
        is_website_enabled: formData.isWebsiteEnabled,
        is_whatsapp_enabled: formData.isWhatsappEnabled,
        is_vcard_enabled: formData.isVcardEnabled,
        slug: formData.slug
      };

      this.userService.updateProfile(profileData).subscribe({
        next: (response: any) => {
          this.notificationService.handleSuccess('Profile updated successfully');
          this.getUserData();
        },
        error: (error: any) => {
          this.notificationService.handleError(error, 'Error updating profile');
        }
      });
    } else {
      this.notificationService.handleWarning('Fill in all required fields');
    }
  }

  getUserData() {
    console.log('getUserData started');
    const token = localStorage.getItem('access_token');
    console.log('Token from localStorage:', token);
    if (!token) {
      console.log('No token found');
      this.notificationService.handleError(null, 'Session expired');
      this.disconnect();
      return;
    }

    try {
      console.log('Attempting to decode token');
      const decoded: any = jwtDecode(token);
      console.log('Decoded token:', decoded);
      if (!decoded.sub) {
        this.notificationService.handleError(null, 'Invalid token');
        return;
      }

      // Get UUID from route params or use the one from token
      this.route.params.subscribe(params => {
        const uuid = params['uuid'] || decoded.sub;
        console.log('Using UUID:', uuid);
        
        this.userService.getUser(uuid).subscribe({
          next: (response: ApiResponse<UserDetails>) => {
            console.log('API Response:', response);
            if (response.success) {
              // Initialize with empty values if no data exists
              this.userData = response.data || {};
              this.form.patchValue({
                name: this.userData.name || '',
                surname: this.userData.surname || '',
                areaCode: this.userData.area_code || '+39',
                phone: this.userData.phone || '',
                website: this.userData.website || '',
                isWebsiteEnabled: this.userData.is_website_enabled || false,
                isWhatsappEnabled: this.userData.is_whatsapp_enabled || false,
                isVcardEnabled: this.userData.is_vcard_enabled || false,
                slug: this.userData.slug || ''
              });
              this.selectedAreaCode = this.userData.area_code || '+39';
            } else {
              // Initialize with empty values if the request was successful but no data
              this.userData = {};
              this.form.patchValue({
                name: '',
                surname: '',
                areaCode: '+39',
                phone: '',
                website: '',
                isWebsiteEnabled: false,
                isWhatsappEnabled: false,
                isVcardEnabled: false,
                slug: ''
              });
              this.selectedAreaCode = '+39';
            }
          },
          error: (error: any) => {
            if (error.status === 401) {
              this.disconnect();
            } else {
              this.notificationService.handleError(error, 'Error retrieving profile');
            }
          }
        });
      });

      if (decoded.role === 'admin') {
        this.isAdmin = true;
      }

    } catch (error) {
      this.notificationService.handleError(error, 'Error decoding token');
    }
  }

  onAreaCodeChange(event: any) {
    this.selectedAreaCode = event.value;
  }

  shareProfile() {
    const url = `${window.location.origin}/u/${this.userData.slug}`;
    navigator.clipboard.writeText(url);
    this.notificationService.handleSuccess('Profile link copied to clipboard');
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
