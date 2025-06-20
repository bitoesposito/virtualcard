import { Component, OnInit, ViewChild, ElementRef, OnDestroy } from '@angular/core';
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
import * as languages from '../../../assets/languages.json'
import { Language, UserDetails } from '../../models/user.models';
import { ApiResponse } from '../../models/api.models';
import { jwtDecode } from 'jwt-decode';
import { CommonModule } from '@angular/common';
import { debounceTime, distinctUntilChanged, takeUntil } from 'rxjs/operators';
import { DividerModule } from 'primeng/divider';
import { FileUploadModule, FileUpload } from 'primeng/fileupload';
import { ProgressBarModule } from 'primeng/progressbar';
import { Subject } from 'rxjs';
import { PdfService } from '../../services/pdf.service';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

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
    DividerModule,
    FileUploadModule,
    ImageModule,
    ProgressBarModule,
    TranslateModule
  ],
  providers: [
    NotificationService,
    MessageService
  ],
  templateUrl: './edit.component.html',
  styleUrl: './edit.component.scss'
})
export class EditComponent implements OnInit, OnDestroy {
  @ViewChild('fu') fileUpload!: FileUpload;
  @ViewChild('fileInput') fileInput!: ElementRef;
  
  userData: any = {};
  isUploading = false;
  area_code = (languages as any).default.map((lang: Language) => ({
    label: lang.iso.toUpperCase(),
    value: lang.code,
    flag: `/flags/${lang.iso.toUpperCase()}.png`
  }));
  selectedAreaCode = '';
  isAdmin = false;
  slugError: string | null = null;
  form: FormGroup = new FormGroup({
    name: new FormControl({ value: '', disabled: false }, [Validators.required]),
    surname: new FormControl({ value: '', disabled: false }, [Validators.required]),
    areaCode: new FormControl({ value: '+39', disabled: false }, [Validators.required, Validators.pattern(/^\+\d{1,4}(-\d{1,4})?$/)]),
    phone: new FormControl({ value: '', disabled: false }, [Validators.required]),
    website: new FormControl({ value: '', disabled: false }, [
      Validators.pattern(/^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?$/)
    ]),
    isWebsiteEnabled: new FormControl({ value: false, disabled: false }),
    isWhatsappEnabled: new FormControl({ value: false, disabled: false }),
    isVcardEnabled: new FormControl({ value: false, disabled: false }),
    slug: new FormControl({ value: '', disabled: false }, [
      Validators.required,
      Validators.pattern(/^[a-z0-9-]{3,20}$/),
      Validators.minLength(3),
      Validators.maxLength(20)
    ])
  });
  private destroy$ = new Subject<void>();
  uploadProgress = 0;

  constructor(
    private userService: UserService,
    private router: Router,
    private notificationService: NotificationService,
    private route: ActivatedRoute,
    private pdfService: PdfService,
    private translate: TranslateService
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
          this.slugError = this.translate.instant('edit.username-taken');
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
        this.notificationService.handleError(error, this.translate.instant('edit.errors.error-checking-slug'));
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
          this.notificationService.handleSuccess(this.translate.instant('edit.success.profile-updated'));
          this.getUserData();
        },
        error: (error: any) => {
          this.notificationService.handleError(error, this.translate.instant('edit.errors.error-updating-profile'));
        }
      });
    } else {
      this.notificationService.handleWarning(this.translate.instant('edit.errors.fill-required-fields'));
    }
  }

  getUserData() {
    const token = localStorage.getItem('access_token');
    if (!token) {
      this.notificationService.handleError(null, this.translate.instant('edit.errors.session-expired'));
      this.disconnect();
      return;
    }

    try {
      const decoded: any = jwtDecode(token);
      if (!decoded.sub) {
        this.notificationService.handleError(null, this.translate.instant('edit.errors.invalid-token'));
        return;
      }

      // Get UUID from route params or use the one from token
      this.route.params.subscribe(params => {
        const uuid = params['uuid'] || decoded.sub;
        
        this.userService.getUser(uuid).subscribe({
          next: (response: ApiResponse<UserDetails>) => {
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
              this.notificationService.handleError(error, this.translate.instant('edit.errors.error-retrieving-profile'));
            }
          }
        });
      });

      if (decoded.role === 'admin') {
        this.isAdmin = true;
      }

    } catch (error) {
      this.notificationService.handleError(error, this.translate.instant('edit.errors.error-decoding-token'));
    }
  }

  onAreaCodeChange(event: any) {
    this.selectedAreaCode = event.value;
  }

  shareProfile() {
    const url = `${window.location.origin}/u/${this.userData.slug}`;
    navigator.clipboard.writeText(url);
    this.notificationService.handleSuccess(this.translate.instant('edit.success.profile-link-copied'));
  }

  isProfileConfigured(): boolean {
    if (!this.userData) return false;
    
    // Check if required fields are filled
    return !!(this.userData.name && 
              this.userData.surname && 
              this.userData.phone && 
              this.userData.slug);
  }

  triggerFileInput() {
    // Reset the file input value to allow selecting the same file again
    this.fileInput.nativeElement.value = '';
    this.fileInput.nativeElement.click();
  }

  onProfilePictureUpload(event: any) {
    const file = event.target.files[0];
    if (!file || !this.userData?.email) {
      this.notificationService.handleWarning(this.translate.instant('edit.errors.file-or-email-not-available'));
      return;
    }

    // Check file type
    const allowedTypes = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/webp',
      'image/gif',
      'image/avif',
      'image/tiff',
      'image/heic',
      'image/heif',
      'image/bmp',
      'image/svg+xml'
    ];
    if (!allowedTypes.includes(file.type)) {
      this.notificationService.handleWarning(this.translate.instant('edit.errors.invalid-image-file'));
      return;
    }

    // Check file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      this.notificationService.handleWarning(this.translate.instant('edit.errors.image-size-exceeded'));
      return;
    }

    this.isUploading = true;
    this.uploadProgress = 0;
    
    // Disable all form controls
    Object.keys(this.form.controls).forEach(key => {
      const control = this.form.get(key);
      if (control) {
        control.disable();
      }
    });

    this.userService.uploadProfilePicture(file, this.userData.email)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: ApiResponse<UserDetails>) => {
          if (response.success && response.data) {
            this.notificationService.handleSuccess(this.translate.instant('edit.success.profile-picture-updated'));
            // Update the userData with the new profile photo URL
            if (this.userData) {
              this.userData.profile_photo = response.data.profile_photo;
            }
            this.resetUploadState();
          } else {
            this.notificationService.handleError(null, this.translate.instant('edit.errors.error-during-upload'));
            this.resetUploadState();
          }
        },
        error: (error) => {
          this.notificationService.handleError(error, this.translate.instant('edit.errors.error-during-upload'));
          this.resetUploadState();
        }
      });
  }

  private resetUploadState() {
    this.isUploading = false;
    this.uploadProgress = 0;
    // Re-enable all form controls
    Object.keys(this.form.controls).forEach(key => {
      const control = this.form.get(key);
      if (control) {
        control.enable();
      }
    });
  }

  async generateBusinessCard() {
    try {
      const pdfBytes = await this.pdfService.generateBusinessCard(this.userData);
      this.pdfService.downloadPdf(pdfBytes, `${this.userData.slug}-business-card.pdf`);
    } catch (error) {
      console.error('Error generating business card:', error);
      // Handle error appropriately
    }
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
