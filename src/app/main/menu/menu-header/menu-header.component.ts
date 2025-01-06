import { Component } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { AddchatComponent } from '../../addchat/addchat.component';

@Component({
  selector: 'app-menu-header',
  imports: [],
  standalone: true,   // <-- Add this line
  templateUrl: './menu-header.component.html',
  styleUrl: './menu-header.component.scss'
})
export class MenuHeaderComponent {

  openNewMessage() {
    this.dialog.open(AddchatComponent, {
      width: 'fit-content',
      maxWidth: '100vw',
      height: 'fit-content',
    });
  }


  constructor(private dialog: MatDialog) { }


}
