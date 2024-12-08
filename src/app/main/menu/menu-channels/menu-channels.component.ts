import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-menu-channels',
  imports: [CommonModule],
  templateUrl: './menu-channels.component.html',
  styleUrl: './menu-channels.component.scss'
})
export class MenuChannelsComponent {
  channelsOpen: boolean = false
  channelActive: boolean = false
  channels: { id: number; name: string }[]=[  //Example Data
    { id: 1, name: 'Channel 1' }, 
    { id: 2, name: 'Channel 2' },
  ]


  toggleChannelsOpen(): void {
    this.channelsOpen = !this.channelsOpen
  }
}
