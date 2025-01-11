import { EventEmitter, inject, Injectable, Output, signal } from '@angular/core';
import { AuthService } from './auth.service';
import { FormBuilder, Validators } from '@angular/forms';
import { ToastMessageService } from './toastmessage.service';
import { UserModel } from '../../models/user';

@Injectable({
  providedIn: 'root'
})
export class UserDialogService {
  profileDialog: boolean = false;
  profileDialogEdit: boolean = false;
  dialog = false;
  authService = inject(AuthService);
  profileDataChanged = signal<boolean>(false);
  @Output() dialogChange = new EventEmitter<boolean>();
  profileForm;

  constructor(
    private auth: AuthService,
    private toastMessageService: ToastMessageService,
    private fb: FormBuilder,
  ) {
    this.profileForm = this.fb.group({
      userInputName: [
        this.userData?.name,
        [
          Validators.required,
          //Validators.pattern('^[a-zA-ZÀ-ÿ]{1,}(?: [a-zA-ZÀ-ÿ]{1,})+$'),
          //Validators.pattern('^[a-zA-ZÀ-ÿ]{1,}(?:[-' ][a-zA-ZÀ-ÿ]{1,})*$')
          Validators.pattern('^[a-zA-ZÀ-ÿ]+(?:-[a-zA-ZÀ-ÿ]+)?(?: [a-zA-ZÀ-ÿ]+(?:-[a-zA-ZÀ-ÿ]+)?)$')
        ],
      ],
      userInputEmail: [
        this.userData?.email,
        [
          Validators.required,
          Validators.pattern(
            '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$'
          ),
        ],
      ],
    });
  }

  openDialog(event: Event) {
    this.dialog = true;
  }

  openProfile() {
    this.profileDialog = true;
    this.dialog = false;
  }

  openProfileEdit() {
    this.profileDialog = false;
    this.profileDialogEdit = true;
    this.profileForm.reset({
      userInputName: this.userData?.name,
      userInputEmail: this.userData?.email,
    });
  }

  closeProfileEdit() {
    this.profileDialog = true;
    this.profileDialogEdit = false;
  }

  closeProfileDialogs(event: Event) {
    this.profileDialog = false;
    this.profileDialogEdit = false;
    this.dialog = true;
  }

  closeDialog(event: Event) {
    event?.preventDefault();
    event.stopPropagation();
    this.profileDialog = false;
    this.profileDialogEdit = false;
    this.dialog = false;
  }

  onDialogChange(newValue: boolean) {
    this.dialog = newValue;
  }

  async saveProfile(): Promise<void> {
    if (this.profileForm.valid && this.userData) {
      const updatedData: Partial<UserModel> = {
        name: this.profileForm.value.userInputName ?? '',
        email: this.profileForm.value.userInputEmail ?? undefined,
      };

      try {
        await this.authService.updateUserData(this.userData.userId, updatedData);
        this.profileDialog = false;
        this.profileDialogEdit = false;
        this.dialogChange.emit();
        this.toastMessageService.showToastSignal(
          'Profil erfolgreich aktualisiert'
        );
      } catch (error) {
        console.error('Fehler beim Speichern der Profiländerungen:', error);
      }
    }
  }

  get userData() {
    return this.authService.userData();
  }

  profileDataChange() {
    if (
      (this.userData?.name ?? '') !=
      (this.profileForm.get('userInputName')?.value ?? '') ||
      (this.userData?.email ?? '') !=
      (this.profileForm.get('userInputEmail')?.value ?? '')
    ) {
      this.profileDataChanged.set(true);
      console.log('Profile data changed');
    } else {
      this.profileDataChanged.set(false);
    }
  }

  dontCloseDialog(event: Event) {
    event?.preventDefault();
    event.stopPropagation();
  }

  logout() {
    localStorage.removeItem('token');
    this.auth.logout();
  }

  dataChangeAllowedCheck() {
    if (this.userData?.provider !== 'password') {
      this.profileForm.disable();
    }
  }
}
