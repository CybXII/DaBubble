import { Component, Input, OnInit } from '@angular/core';
import { ChatboxComponent } from '../shared/chatbox/chatbox.component';
import { MessageboxComponent } from '../shared/messagebox/messagebox.component';
import { MainchatHeaderComponent } from './mainchat-header/mainchat-header.component';
import { Firestore, collection, query, where, getDocs } from '@angular/fire/firestore';
import { SharedService } from '../../shared/services/newmessage.service';
import { CreatemessageComponent } from '../createmessage/createmessage.component';
import { ThreadchatHeaderComponent } from './threadchat-header/threadchat-header.component';

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [ThreadchatHeaderComponent, CreatemessageComponent, MainchatHeaderComponent, ChatboxComponent, MessageboxComponent],
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.scss'] // Korrigiere styleUrl zu styleUrls (Plural)
})
export class ChatComponent implements OnInit {
  @Input() builder!: string;
  sharedVariable!: string;

  createmessage = "createmessage";

  constructor(private sharedService: SharedService) { }

  ngOnInit() {
    this.sharedService.sharedVariable$.subscribe(
      (value) => (this.sharedVariable = value)
    );
  }
}


