import {
  Component,
  Output,
  EventEmitter,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import {
  FormsModule,
  ReactiveFormsModule,
} from '@angular/forms';
import { UserDialogService } from '../../../services/user-dialog.service';

@Component({
  selector: 'app-dialog',
  standalone: true, // <-- Add this line
  imports: [CommonModule, RouterModule, FormsModule, ReactiveFormsModule],
  templateUrl: './dialog.component.html',
  styleUrl: './dialog.component.scss',
})
export class DialogComponent {
  @Output() dialogChange = new EventEmitter<boolean>();

  constructor(
    public userDialog$: UserDialogService,
  ) {}

  ngOnInit() {
    this.userDialog$.dataChangeAllowedCheck();
  }


  
  // saveProfile() {
  //   this.profileDialog = false;
  //   this.profileDialogEdit = false;
  //   this.dialogChange.emit(this.dialog);
  //   this.toastMessageService.showToastSignal('Profil erfolgreich aktualisiert');
  // }

}
