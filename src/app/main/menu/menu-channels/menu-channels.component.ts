import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ModalComponent } from '../../../shared/modal/modal.component';

@Component({
  selector: 'app-menu-channels',
  imports: [CommonModule, ModalComponent],
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

  showModal: boolean = false;

  toggleChannelsOpen(): void {
    this.channelsOpen = !this.channelsOpen
  }

  toggleShowModal(): void {
    this.showModal = !this.showModal;
  }


  addChannel() {
    this.toggleShowModal();
  }

}
