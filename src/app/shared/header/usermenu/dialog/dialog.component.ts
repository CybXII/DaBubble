import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../services/auth.service';
import { ToastMessageService } from '../../../services/toastmessage.service';

@Component({
  selector: 'app-dialog',
  standalone: true, // <-- Add this line
  imports: [CommonModule, RouterModule],
  templateUrl: './dialog.component.html',
  styleUrl: './dialog.component.scss',
})
export class DialogComponent {
  @Input() dialog: boolean = false;
  @Output() dialogChange = new EventEmitter<boolean>();
  profileDialog: boolean = false;
  profileDialogEdit: boolean = false;

  constructor(
    private router: Router,
    private auth: AuthService,
    private toastMessageService: ToastMessageService
  ) {}

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
}
