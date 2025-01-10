import { inject, Injectable } from '@angular/core';
import { MessagesService } from './messages.service';
import { BehaviorSubject, from } from 'rxjs';
import { Message } from '../../models/message';
import { AuthService } from './auth.service';
import { UserModel } from '../../models/user';
import { ChannelsService } from './channels.service';
import { Channel } from '../../models/channel';

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
  private userResultsSubject = new BehaviorSubject<any[]>([]);
  userResults$ = this.userResultsSubject.asObservable();
  private channelResultsSubject = new BehaviorSubject<any[]>([]);
  channelResults$ = this.channelResultsSubject.asObservable();
  private privateChannelResultsSubject = new BehaviorSubject<any[]>([]);
  privateChannelResults$ = this.privateChannelResultsSubject.asObservable();
  private allMessages: Message[] = [];
  private allUsers: UserModel[] = [];
  private allChannels: Channel[] = [];

  constructor() {}

  public loadMessages(): void {
    from(this.messageService.getAllMessages()).subscribe((messages) => {
      this.allMessages = Array.isArray(messages) ? messages : [];
      console.log('Messages loaded:', this.allMessages);
    });
  }

  public loadUsers(): void {
    this.authService.getUserList().subscribe((users) => {
      this.allUsers = Array.isArray(users)
        ? users.filter((user) => user.provider !== 'anonymous')
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

    const filteredMessages = this.allMessages.filter(
      (message) =>
        message.message.toLowerCase().includes(searchText.toLowerCase()) &&
        message.members.includes(userId)
    );

    this.messageResultsSubject.next(filteredMessages);
  }

  searchUsers(searchText: string): void {
    if (!searchText) {
      this.userResultsSubject.next([]);
      return;
    }
    const filteredUsers = this.allUsers.filter((user) =>
      user.name.toLowerCase().includes(searchText.toLowerCase())
    || user.email.toLowerCase().includes(searchText.toLowerCase())
    );
    this.userResultsSubject.next(filteredUsers);
  }

  searchChannels(searchText: string, userId: string): void {
    if (!searchText) {
      this.channelResultsSubject.next([]);
      return;
    }
    const filteredChannels = this.allChannels.filter(
      (channel) =>
        !channel.isPrivate &&
        channel.name.toLowerCase().includes(searchText.toLowerCase()) &&
        channel.members.includes(userId)
    );
    this.channelResultsSubject.next(filteredChannels);
  }

  searchPrivateChannels(searchText: string, userId: string): void {
    if (!searchText) {
      this.channelResultsSubject.next([]);
      return;
    }
    const filteredChannels = this.allChannels.filter(
      (channel) =>
        channel.isPrivate &&
        channel.name.toLowerCase().includes(searchText.toLowerCase()) &&
        channel.members.includes(userId)
    );
    this.privateChannelResultsSubject.next(filteredChannels);
  }
}
