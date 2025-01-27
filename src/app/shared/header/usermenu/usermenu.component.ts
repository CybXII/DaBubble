import { Component, Inject, inject } from '@angular/core';
import { DialogComponent } from './dialog/dialog.component';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';
import { UserModel } from '../../../models/user';
import { UserDialogService } from '../../services/user-dialog.service';

@Component({
  selector: 'app-usermenu',
  standalone: true, // <-- Add this line
  imports: [DialogComponent, CommonModule],
  templateUrl: './usermenu.component.html',
  styleUrl: './usermenu.component.scss',
})
export class UsermenuComponent {

  constructor(public userDialog: UserDialogService) {}
}

