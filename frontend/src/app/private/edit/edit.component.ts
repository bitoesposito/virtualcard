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
    ImageModule
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
  area_code = []
  // area_code = languages.map(lang => ({
  //   label: lang.iso.toUpperCase(),
  //   value: lang.code,
  //   flag: `/flags/${lang.iso.toUpperCase()}.png`
  // }));
  selectedAreaCode = ''

  form: FormGroup = new FormGroup({
    name: new FormControl('', [Validators.required]),
    surname: new FormControl('', [Validators.required]),
    area_code: new FormControl('39', [Validators.required]),
    phone: new FormControl('', [Validators.required]),
    website: new FormControl(''),
    is_website_selected: new FormControl(false),
    is_whatsapp_selected: new FormControl(false),
    is_vcard_selected: new FormControl(false),
  });

  constructor(
    // private userProfileService: UserProfileService,
    private router: Router,
    private notificationService: NotificationService
  ){}

  ngOnInit(): void {
    // this.getProfile();
  }

  onLogout() {
    // this.userProfileService.logout();
    this.router.navigate(['login']);
  }

  editProfile() {
  //   if (this.form.invalid) return;
  //   const updatedData = this.form.value;
  //   this.userProfileService.updateProfile(updatedData).subscribe({
  //     next: (response) => {
  //       this.notificationService.handleSuccess('Profilo aggiornato con successo!');
  //       this.getProfile();
  //     },
  //     error: (error) => {
  //       this.notificationService.handleError(error, 'Errore durante l\'aggiornamento del profilo.');
  //     }
  //   });
  // }

  // getProfile() {
  //   this.userProfileService.getProfile().subscribe({
  //     next: (data) => {
  //       this.userData = data;
  //       this.form.patchValue({
  //         name: this.userData.name || '',
  //         surname: this.userData.surname || '',
  //         area_code: this.userData.area_code || '39',
  //         phone: this.userData.phone || '',
  //         website: this.userData.website || '',
  //         is_website_selected: this.userData.is_website_selected || false,
  //         is_whatsapp_selected: this.userData.is_whatsapp_selected || false,
  //         is_vcard_selected: this.userData.is_vcard_selected || false,
  //       });
  //       this.selectedAreaCode = this.userData.area_code || '39';
  //     },
  //     error: (error) => {
  //       this.notificationService.handleError(error, 'Errore nel recupero del profilo.');
  //     }
  //   });
  }
}
