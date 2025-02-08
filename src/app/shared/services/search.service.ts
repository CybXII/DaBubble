import { inject, Injectable } from '@angular/core';
import { MessagesService } from './messages.service';
import { BehaviorSubject, forkJoin, from, map } from 'rxjs';
import { Message, ThreadMessage } from '../../models/message';
import { AuthService } from './auth.service';
import { UserModel } from '../../models/user';
import { ChannelsService } from './channels.service';
import { Channel } from '../../models/channel';
import { collection, getDoc, getDocs } from 'firebase/firestore';
import { user } from '@angular/fire/auth';

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

  // added by Christoph
  //private emailResultsSubject = new BehaviorSubject<any[]>([]);
  //emailResults$ = this.userResultsSubject.asObservable();

  private channelResultsSubject = new BehaviorSubject<any[]>([]);
  channelResults$ = this.channelResultsSubject.asObservable();
  private privateChannelResultsSubject = new BehaviorSubject<any[]>([]);
  privateChannelResults$ = this.privateChannelResultsSubject.asObservable();
  private allMessages: Message[] = [];
  private allThreadMessages: ThreadMessage[] = [];
  private allUsers: UserModel[] = [];
  private allChannels: Channel[] = [];
  public searchChannelsMessages: any = [];
  private messageResults: any[] = [];

  constructor() { }

  public loadMessages(userId: string) {
    from(this.messageService.getAllMessages(userId)).subscribe((messages) => {
      this.allMessages = Array.isArray(messages) ? messages : [];
      console.log('Messages loaded:', this.allMessages);

      this.getChannelName();
    });
  }

  getChannelName() {
    this.searchChannelsMessages = [];
    console.log('subject', this.messageResultsSubject);

    this.messageResults$.subscribe((results) => {
      this.messageResults = results;
      console.log('Search results messages NEW:', this.messageResults);

      // Only process if there are results
      if (this.messageResults.length > 0) {
        const channelNames$ = this.messageResults
          .filter((element) => element.channelId) // Ensure the element has a channelId
          .map((element) =>
            from(this.channelService.getChannelById(element.channelId)).pipe(
              map((channel) => channel?.name || 'Unknown Channel')
            )
          );

        forkJoin(channelNames$).subscribe(
          (channelNames) => {
            this.searchChannelsMessages = channelNames.filter((name) => !!name);
          },
          (error) => {
            console.error('Error fetching channel names:', error);
          }
        );
      } else {
        console.log('No messages to process.');
        // Optional: Reset searchChannelsMessages if no results
        this.searchChannelsMessages = [];
      }
    });
  }

  public loadThreadMessages(userId: string): void {
    from(this.messageService.getAllThreadMessages(userId)).subscribe((messages) => {
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
      //console.log('Users Ids loaded:', this.allUsers[0].userId);
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

  // searchUsers(searchText: string, type: string): void {
  //   if (!searchText) {
  //     this.userResultsSubject.next([]);
  //     return;
  //   }
  //   const filteredUsers = this.allUsers.filter((user) => {
  //     if (type === 'name') {
  //       return user.name.toLowerCase().includes(searchText.toLowerCase());
  //     } else if (type === 'email') {
  //       return user.email.toLowerCase().includes(searchText.toLowerCase());
  //     }
  //     return false;
  //   });
  //   this.userResultsSubject.next(filteredUsers);
  // }

  // update Christoph, 11.1.25
  searchUsers(searchText: string, type: string): void {
    if (!searchText.trim()) {
      // Alle Benutzer anzeigen, wenn der Suchtext leer ist
      this.userResultsSubject.next(this.allUsers);
      return;
    }
    // Filterlogik basierend auf Typ und Suchtext
    const filteredUsers = this.allUsers.filter((user) => {
      if (type === 'name') {
        return user.name.toLowerCase().includes(searchText.toLowerCase());
      } else if (type === 'email') {
        return user.email.toLowerCase().includes(searchText.toLowerCase());
      }
      return false;
    });

    this.userResultsSubject.next(filteredUsers);
    //console.log(this.userResultsSubject);
  }

  // searchChannels(searchText: string, userId: string, type: string): void {
  //   if (!searchText) {
  //     this.channelResultsSubject.next([]);
  //     return;
  //   }
  //   if (type === 'channel') {
  //     const filteredChannels = this.allChannels.filter(
  //       (channel) =>
  //         !channel.isPrivate &&
  //         channel.name.toLowerCase().includes(searchText.toLowerCase()) &&
  //         channel.members.includes(userId)
  //     );
  //     this.channelResultsSubject.next(filteredChannels);
  //   } else if (type === 'private') {
  //     const filteredChannels = this.allChannels.filter(
  //       (channel) =>
  //         channel.isPrivate &&
  //         channel.name.toLowerCase().includes(searchText.toLowerCase()) &&
  //         channel.members.includes(userId)
  //     );
  //     this.privateChannelResultsSubject.next(filteredChannels);
  //   }
  // }

  // update  Christoph, 11.1.25
  searchChannels(searchText: string, userId: string, type: string): void {
    if (!searchText.trim()) {
      // Alle Channels anzeigen, wenn der Suchtext leer ist
      //this.channelResultsSubject.next(this.allChannels);

      const filteredChannels = this.allChannels.filter(
        (channel) =>
          !channel.isPrivate &&
          channel.members.includes(userId)
      );
      this.channelResultsSubject.next(filteredChannels);


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
