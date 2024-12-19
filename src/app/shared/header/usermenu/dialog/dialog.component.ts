import {
  Component,
  Input,
  Output,
  EventEmitter,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../services/auth.service';
import { ToastMessageService } from '../../../services/toastmessage.service';
import {
  FormBuilder,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';

@Component({
  selector: 'app-dialog',
  standalone: true, // <-- Add this line
  imports: [CommonModule, RouterModule, FormsModule, ReactiveFormsModule],
  templateUrl: './dialog.component.html',
  styleUrl: './dialog.component.scss',
})
export class DialogComponent {
  @Input() dialog: boolean = false;
  @Output() dialogChange = new EventEmitter<boolean>();
  profileDialog: boolean = false;
  profileDialogEdit: boolean = false;
  authService = inject(AuthService);
  profileDataChanged = signal<boolean>(false);
  profileForm;

  constructor(
    private router: Router,
    private auth: AuthService,
    private toastMessageService: ToastMessageService,
    private fb: FormBuilder
  ) {
    this.profileForm = this.fb.group({
      userInputName: [
        this.userData?.name,
        [
          Validators.required,
          Validators.pattern('^[a-zA-ZÀ-ÿ]{3,}(?: [a-zA-ZÀ-ÿ]{3,})+$'),
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

  dontCloseDialog(event: Event) {
    event?.preventDefault();
    event.stopPropagation();
  }

  logout() {
    localStorage.removeItem('token');
    this.auth.logout();
  }

  openProfile() {
    this.profileDialog = true;
    this.dialog = false;
  }

  openProfileEdit() {
    this.profileDialog = false;
    this.profileDialogEdit = true;
  }

  closeProfileEdit() {
    this.profileDialog = true;
    this.profileDialogEdit = false;
  }

  closeDialog(event: Event) {
    this.profileDialog = false;
    this.profileDialogEdit = false;
    this.dialogChange.emit(this.dialog);
  }

  saveProfile() {
    this.profileDialog = false;
    this.profileDialogEdit = false;
    this.dialogChange.emit(this.dialog);
    this.toastMessageService.showToastSignal('Profil erfolgreich aktualisiert');
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
}
