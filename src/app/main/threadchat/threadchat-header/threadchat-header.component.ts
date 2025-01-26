import { Component } from '@angular/core';
import { MessagesService } from '../../../shared/services/messages.service';
import { ChannelsService } from '../../../shared/services/channels.service';
import { Channel } from '../../../models/channel';
import { Observable } from 'rxjs';
import { StateService } from '../../../shared/services/state.service';

@Component({
  selector: 'app-threadchat-header',
  standalone: true,   // <-- Add this line
  imports: [],
  templateUrl: './threadchat-header.component.html',
  styleUrl: './threadchat-header.component.scss'
})
export class ThreadchatHeaderComponent {
    currentChannel$: Observable<Channel | null>;
    channelName: string = '';
    constructor(private stateService: StateService, private channelsService: ChannelsService) {
      this.currentChannel$ = this.channelsService.currentChannel$;
    }

    ngOnInit(): void {
      this.currentChannel$.subscribe((channel) => {
        if (channel) {
          this.channelName = channel.name;
        }
      });
    }
    // Funktion zum Schließen des Threadchats
    closeThreadChat(): void {
      this.stateService.setThreadchatState('out');
    }
}
