import { Component,EventEmitter,inject, Input, Output } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { CommonModule } from '@angular/common';


@Component({
  selector: 'app-menu-dialog',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './menu-dialog.component.html',
  styleUrl: './menu-dialog.component.scss'
})
export class MenuDialogComponent {
  @Input() menuDialog: boolean = false;
  @Output() dialogChange = new EventEmitter<boolean>();
  authService = inject(AuthService);
  @Input() membersDialog: boolean = false;
  @Output() membersDialogChange = new EventEmitter<boolean>();
  @Input() channelDialog: boolean = false;
  @Output() channelDialogChange = new EventEmitter<boolean>();
  @Input() dialogData: any;


  closeDialog(event: Event, menu: string) {
    event?.preventDefault();
    event.stopPropagation();
    if (menu === 'menuDialog') {
      this.menuDialog = false;
      this.dialogChange.emit(false);
    } else if (menu === 'membersDialog') {
      this.membersDialog = false;
      this.membersDialogChange.emit(false);
    }
    else if (menu === 'channelDialog') {
      this.channelDialog = false;
      this.channelDialogChange.emit(false);
    }
  }

  get userData() {
    return this.authService.userData();
  }


  dontCloseDialog(event: Event) {
    event?.preventDefault();
    event.stopPropagation();
  }

  }