import { Component } from '@angular/core';
import { ChannelsService } from '../../../shared/services/channels.service';
import { Channel } from '../../../models/channel';
import { Observable } from 'rxjs';
import { StateService } from '../../../shared/services/state.service';

@Component({
  selector: 'app-threadchat-header',
  standalone: true,
  imports: [],
  templateUrl: './threadchat-header.component.html',
  styleUrl: './threadchat-header.component.scss'
})
export class ThreadchatHeaderComponent {
  currentChannel$: Observable<Channel | null>;
  channelName: string = '';

/**
 * Constructs a new instance of the ThreadchatHeaderComponent.
 *
 * @param stateService The service used to manage the state of the thread chat.
 * @param channelsService The service providing the current channel data.
 */
  constructor(private stateService: StateService, private channelsService: ChannelsService) {
    this.currentChannel$ = this.channelsService.currentChannel$;
  }


/**
 * OnInit lifecycle hook. Subscribes to the current channel observable
 * and updates the channel name on each emission.
 */
  ngOnInit(): void {
    this.currentChannel$.subscribe((channel) => {
      if (channel) {
        this.channelName = channel.name;
      }
    });
  }


  /**
   * Closes the thread chat by setting the thread chat state to 'out'.
   * This causes the thread chat to be hidden and the main chat to be shown.
   */
  closeThreadChat(): void {
    this.stateService.setThreadchatState('out');
  }
}
