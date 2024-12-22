import { Component } from '@angular/core';
import { AddchatComponent } from "../../main/addchat/addchat.component";
import { MatDialogRef } from '@angular/material/dialog';
@Component({
  selector: 'app-fullscreen-modal',
  standalone: true,
  imports: [AddchatComponent],
  templateUrl: './fullscreen-modal.component.html',
  styleUrl: './fullscreen-modal.component.scss'
})
export class FullscreenModalComponent {
  constructor(public dialogRef: MatDialogRef<FullscreenModalComponent>) {}

  close(): void {
    this.dialogRef.close(); // Schließt den Dialog
  }
}
