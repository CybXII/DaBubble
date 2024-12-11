import { Component } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { FullscreenModalComponent } from '../../../shared/fullscreen-modal/fullscreen-modal.component';

@Component({
  selector: 'app-menu-channels',
  imports: [CommonModule],
  templateUrl: './menu-channels.component.html',
  styleUrl: './menu-channels.component.scss'
})
export class MenuChannelsComponent {
  channelsOpen: boolean = false
  channelActive: boolean = false
  channels: { id: number; name: string }[] = [  //Example Data
    { id: 1, name: 'Channel 1' },
    { id: 2, name: 'Channel 2' },
  ]

  constructor(private dialog: MatDialog) { }



  toggleChannelsOpen(): void {
    this.channelsOpen = !this.channelsOpen
  }

  openDialog() {
    this.dialog.open(FullscreenModalComponent, {
      width: '100vw', // Vollbildbreite
      maxWidth: '100vw', // Verhindert Einschränkung durch Standard
      height: '100vh', // Vollbildhöhe
      panelClass: 'fullscreen-modal', // Optional: zusätzliche Styles
    });

  }

}
