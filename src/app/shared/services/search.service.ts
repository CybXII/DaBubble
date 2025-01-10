import { inject, Injectable } from '@angular/core';
import { MessagesService } from './messages.service';
import { BehaviorSubject, from } from 'rxjs';
import { Message, ThreadMessage } from '../../models/message';
import { AuthService } from './auth.service';
import { UserModel } from '../../models/user';
import { ChannelsService } from './channels.service';
import { Channel } from '../../models/channel';
import { collection, getDocs } from 'firebase/firestore';

@Injectable({
  providedIn: 'root',
})
export class SearchService {
  messageService = inject(MessagesService);
  authService = inject(AuthService);
  channelService = inject(ChannelsService);

  // BehaviorSubject, um die Suchergebnisse zu speichern
  private messageResultsSubject = new BehaviorSubject<any[]>([]);
  messageResults$ = this.messageResultsSubject.asObservable();
  private threadMessageResultsSubject = new BehaviorSubject<any[]>([]);
  threadMessageResults$ = this.threadMessageResultsSubject.asObservable();
  private userResultsSubject = new BehaviorSubject<any[]>([]);
  userResults$ = this.userResultsSubject.asObservable();
  private channelResultsSubject = new BehaviorSubject<any[]>([]);
  channelResults$ = this.channelResultsSubject.asObservable();
  private privateChannelResultsSubject = new BehaviorSubject<any[]>([]);
  privateChannelResults$ = this.privateChannelResultsSubject.asObservable();
  private allMessages: Message[] = [];
  private allThreadMessages: ThreadMessage[] = [];
  private allUsers: UserModel[] = [];
  private allChannels: Channel[] = [];

  constructor() {}

  public loadMessages(): void {
    from(this.messageService.getAllMessages()).subscribe((messages) => {
      this.allMessages = Array.isArray(messages) ? messages : [];
      console.log('Messages loaded:', this.allMessages);
    });
  }

  public loadThreadMessages(): void {
    from(this.messageService.getAllThreadMessages()).subscribe((messages) => {
      this.allThreadMessages = Array.isArray(messages) ? messages : [];
      console.log('Thread Messages loaded:', this.allThreadMessages);
    });
  }


  public loadUsers(userId: string): void {
    this.authService.getUserList().subscribe((users) => {
      this.allUsers = Array.isArray(users)
        ? users.filter(
            (user) => user.provider !== 'anonymous' && user.userId !== userId
          )
        : [];

      console.log('Users loaded:', this.allUsers);
    });
  }

  public loadChannels(): void {
    from(this.channelService.getAllChannels()).subscribe((channels) => {
      this.allChannels = Array.isArray(channels) ? channels : [];
      console.log('Channels loaded:', this.allChannels);
    });
  }

  // Filterfunktion für die Suche
  searchMessages(searchText: string, userId: string): void {
    if (!searchText) {
      this.messageResultsSubject.next([]);
      return;
    }

    const filteredMessages = this.allMessages.filter((message) =>
      message.message.toLowerCase().includes(searchText.toLowerCase())
    );

    this.messageResultsSubject.next(filteredMessages);
  }

  searchThreadMessages(searchText: string): void {
    if (!searchText) {
      this.threadMessageResultsSubject.next([]);
      return;
    }
    const filteredMessages = this.allThreadMessages.filter((message) =>
      message.message.toLowerCase().includes(searchText.toLowerCase())
  );
  console.log('Thread Messages:', filteredMessages);

    this.threadMessageResultsSubject.next(filteredMessages);
  }

  searchUsers(searchText: string, type: string): void {
    if (!searchText) {
      this.userResultsSubject.next([]);
      return;
    }
    const filteredUsers = this.allUsers.filter((user) => {
      if (type === 'name') {
        return user.name.toLowerCase().includes(searchText.toLowerCase());
      } else if (type === 'email') {
        return user.email.toLowerCase().includes(searchText.toLowerCase());
      }
      return false;
    });
    this.userResultsSubject.next(filteredUsers);
  }

  searchChannels(searchText: string, userId: string, type: string): void {
    if (!searchText) {
      this.channelResultsSubject.next([]);
      return;
    }
    if (type === 'channel') {
      const filteredChannels = this.allChannels.filter(
        (channel) =>
          !channel.isPrivate &&
          channel.name.toLowerCase().includes(searchText.toLowerCase()) &&
          channel.members.includes(userId)
      );
      this.channelResultsSubject.next(filteredChannels);
    } else if (type === 'private') {
      const filteredChannels = this.allChannels.filter(
        (channel) =>
          channel.isPrivate &&
          channel.name.toLowerCase().includes(searchText.toLowerCase()) &&
          channel.members.includes(userId)
      );
      this.privateChannelResultsSubject.next(filteredChannels);
    }
  }
}
