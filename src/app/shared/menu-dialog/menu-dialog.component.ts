import { Component, EventEmitter, Input, Output, OnInit } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { ProfileviewComponent } from '../profileview/profileview.component';



@Component({
  selector: 'app-menu-dialog',
  standalone: true,
  imports: [CommonModule,ReactiveFormsModule],
  templateUrl: './menu-dialog.component.html',
  styleUrl: './menu-dialog.component.scss'
})


export class MenuDialogComponent  implements OnInit {
  @Input() menuDialog: boolean = false;
  @Output() dialogChange = new EventEmitter<boolean>();
  @Input() membersDialog: boolean = false;
  @Output() membersDialogChange = new EventEmitter<boolean>();
  @Input() channelDialog: boolean = false;
  @Output() channelDialogChange = new EventEmitter<boolean>();
  @Input() dialogData: { name: string; members: any[] } = { name: '', members: [] };
  memberIds: string[] =[];
  memberNames: { name: string; userId: string; photoURL: string; }[] = [];
  addMembersForm!: FormGroup;
  activeMember: any = {};

  constructor(private fb: FormBuilder, public authService: AuthService, private dialog: MatDialog,) {}
  async ngOnInit(): Promise<void> {
    this.memberIds = this.dialogData.members.map((member) => member.id);
    this.memberNames = await this.authService.getUsernamesByIds(this.memberIds);

    // Initialisiere das Formular
    this.addMembersForm = this.fb.group({
      members: ['', Validators.required], // Beispiel-Feld
    });
  }


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


  getUserData(id: string) {
    return this.authService.getUserById(id);
  }


  dontCloseDialog(event: Event) {
    event?.preventDefault();
    event.stopPropagation();
  }


  selectMember(member: any) {
    this.activeMember = member
  }

  get userData() {
    return this.authService.userData();
  }

  addMembers(){
    console.log(this.addMembersForm);
  }

  openDialog(): void {
    this.dialog.open(ProfileviewComponent, {
      width: 'fit-content',
      maxWidth: '100vw',
      height: 'fit-content',
      data: {member: this.activeMember}
    });
  }
}
