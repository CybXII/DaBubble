import { Component, Input, OnInit } from '@angular/core';
import { ChatboxComponent } from '../shared/chatbox/chatbox.component';
import { MessageboxComponent } from '../shared/messagebox/messagebox.component';
import { MainchatHeaderComponent } from './mainchat-header/mainchat-header.component';
import { SharedService } from '../../shared/services/newmessage.service';
import { CreatemessageComponent } from '../createmessage/createmessage.component';
import { ThreadchatHeaderComponent } from './threadchat-header/threadchat-header.component';

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [ThreadchatHeaderComponent, CreatemessageComponent, MainchatHeaderComponent, ChatboxComponent, MessageboxComponent],
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.scss']
})
export class ChatComponent implements OnInit {
  @Input() builder!: string;
  sharedVariable!: string;
  createmessage = "createmessage";


/**
 * Constructs a new instance of the ChatComponent.
 *
 * @param {SharedService} sharedService - The service providing the sharedVariable$ observable.
 */
  constructor(private sharedService: SharedService) {}


/**
 * Initializes the ChatComponent by subscribing to the sharedVariable$ observable from the SharedService.
 * Updates the sharedVariable with the emitted value whenever it changes.
 */
  ngOnInit() {
    this.sharedService.sharedVariable$.subscribe(
      (value) => (this.sharedVariable = value)
    );
  }
}


