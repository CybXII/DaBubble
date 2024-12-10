import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-menu-private-messages',
  imports: [CommonModule],
  templateUrl: './menu-private-messages.component.html',
  styleUrl: './menu-private-messages.component.scss'
})
export class MenuPrivateMessagesComponent {
  messagesOpen: boolean = false

  privateMessages: { id: number; name: string ; imgPath: string ; status: boolean }[]=[  //Example Data
    { id: 1, name: 'Dirk Müller', imgPath: 'img/avatars/avatar3.svg', status: true }, 
    { id: 2, name: 'Franziska Stark', imgPath: 'img/avatars/avatar2.svg', status: false },
    { id: 1, name: 'Dirk Müller', imgPath: 'img/avatars/avatar3.svg', status: true }, 
    { id: 2, name: 'Franziska Stark', imgPath: 'img/avatars/avatar2.svg', status: false },
    { id: 1, name: 'Dirk Müller', imgPath: 'img/avatars/avatar3.svg', status: true }, 
    { id: 2, name: 'Franziska Stark', imgPath: 'img/avatars/avatar2.svg', status: false },
    { id: 1, name: 'Dirk Müller', imgPath: 'img/avatars/avatar3.svg', status: true }, 
    { id: 2, name: 'Franziska Stark', imgPath: 'img/avatars/avatar2.svg', status: false },
    { id: 1, name: 'Dirk Müller', imgPath: 'img/avatars/avatar3.svg', status: true }, 
    { id: 2, name: 'Franziska Stark', imgPath: 'img/avatars/avatar2.svg', status: false },
    { id: 1, name: 'Dirk Müller', imgPath: 'img/avatars/avatar3.svg', status: true }, 
    { id: 2, name: 'Franziska Stark', imgPath: 'img/avatars/avatar2.svg', status: false },
    { id: 1, name: 'Dirk Müller', imgPath: 'img/avatars/avatar3.svg', status: true }, 
    { id: 2, name: 'Franziska Stark', imgPath: 'img/avatars/avatar2.svg', status: false },

  ]


  toggleMessagesOpen(): void {
    this.messagesOpen = !this.messagesOpen
  }



}
