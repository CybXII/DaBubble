import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { ChannelsService } from '../../../shared/services/channels.service';
import { Channel } from '../../../models/channel';
import { Observable, Subscription, combineLatest, map, switchMap, startWith } from 'rxjs';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../shared/services/auth.service';
import { MenuDialogComponent } from "../../../shared/menu-dialog/menu-dialog.component";
import { ChangeDetectorRef } from '@angular/core';
import { User, UserService } from '../../../shared/services/user.service';

@Component({
  selector: 'app-mainchat-header',
  imports: [CommonModule, MenuDialogComponent],
  standalone: true,
  templateUrl: './mainchat-header.component.html',
  styleUrl: './mainchat-header.component.scss'
})
export class MainchatHeaderComponent implements OnInit, OnDestroy {
  channel$: Observable<Channel | null>;
  usersArray$: Observable<User[]> | undefined;
  private subscriptions = new Subscription();
  memberAvatars: Record<string, Record<string, string>> = {};
  channelMembers: { id: string; name: string; status: boolean; photoURL: string }[] = [];
  channelTitle: string = '';
  channelDescription: string | undefined = '';
  channelId: string | undefined = '';
  channelCreator: string = '';
  channelCreatorId: string = '';
  isPrivate: boolean = false;
  convPartner$: Observable<string> = new Observable<string>(obs => obs.next('')); // 🔥 Reaktive Variable für Avatar
  conversationName$: Observable<string> = new Observable<string>(obs => obs.next(''));; // 🔥 Reaktive Variable für Namen
  menuDialog: boolean = false;
  membersDialog: boolean = false;
  channelDialog: boolean = false;
  dialogData: any = null;

  constructor(
    private channelsService: ChannelsService,
    private authService: AuthService,
    public userService: UserService,
    private cdr: ChangeDetectorRef
  ) {
    this.channel$ = this.channelsService.currentChannel$;
  }

  ngOnInit(): void {
    this.subscriptions.add(
      this.channel$.subscribe((channel) => {

        if (channel) {
          this.channelTitle = channel.name;
          this.channelId = channel.id;
          this.channelDescription = channel.description;
          this.channelCreatorId = channel.createdBy;
          this.isPrivate = channel.isPrivate;
          // 🔥 Echtzeit-Tracking der Mitglieder (gefiltert aus Users-Observable)
          this.usersArray$ = this.userService.users$.pipe(
            map(users => users.filter(user => channel.members.includes(user.userId)))
          );

          // 🔥 Setzt Namen & Avatare
          this.subscriptions.add(
            this.usersArray$?.subscribe((users: User[]) => {
              const newChannelMembers = users.map(user => ({
                id: user.userId, 
                name: user.name, 
                status: user.status, 
                photoURL: user.photoURL 
              }));

              this.channelMembers = [...newChannelMembers];
              console.log('lenght changed',this.channelMembers);
              if (channel?.id) {
                this.memberAvatars[channel.id] = users.reduce((acc, user) => {
                  acc[user.userId] = user.photoURL;
                  return acc;
                }, {} as Record<string, string>);
              }
              this.cdr.detectChanges(); // ⚡ UI-Update erzwingen
            })
          );

          // 🔥 Lade den Namen des Channel-Erstellers
          this.authService.getUsernamesByIds([channel.createdBy]).then((creatorDetails) => {
            if (creatorDetails && creatorDetails.length > 0) {
              this.channelCreator = creatorDetails[0].name;
              this.cdr.detectChanges();
            }
          });
        }
      })
    );

    // 🔥 Setzt den Conversation-Namen reaktiv
    this.conversationName$ = this.channel$.pipe(
      switchMap(channel => this.usersArray$!.pipe(
        map(users => this.getConversationName(users))
      ))
    );

    // 🔥 Setzt das Avatar-Bild reaktiv
    this.convPartner$ = this.channel$.pipe(
      switchMap(channel => this.usersArray$!.pipe(
        switchMap(users => this.getConverrsationAvatar(users))
      ))
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  getConversationName(users: User[]): string {
    if (!users || users.length === 0) return 'Unbekannt';

    const activeUserId = this.authService.userId();
    const conversationPartners = users.filter(user => user.userId !== activeUserId);

    if (users.length === 1) {
      return `${users[0].name} (Du)`;
    } else if (users.length > 1) {
      return conversationPartners.map(user => user.name).join(', ');
    }
    return 'Unbekannt';
  }

  getConverrsationAvatar(users: User[]): Observable<string> {
    if (!users || users.length === 0) return new Observable<string>(obs => obs.next(''));

    const activeUserId = this.authService.userId();
    const conversationPartner = users.find(user => user.userId !== activeUserId);

    if (users.length === 1 && activeUserId) {
      return this.userService.getuserAvatar(activeUserId);
    } else if (users.length > 1 && conversationPartner) {
      return this.userService.getuserAvatar(conversationPartner.userId);
    }
    return new Observable<string>(obs => obs.next(''));
  }

  openDialog(menu: string) {
    this.closeAllDialogs();
    this.dialogData = {
      name: this.channelTitle,
      members: this.channelMembers,
      description: this.channelDescription,
      creator: this.channelCreator,
      createdBy: this.channelCreatorId,
      channelId: this.channelId,
      isPrivate: this.isPrivate
    };
    console.log(this.dialogData);
    if (menu === 'membersDialog') {
      this.membersDialog = true;
    } else if (menu === 'menuDialog') {
      this.menuDialog = true;
    } else if (menu === 'channelDialog') {
      this.channelDialog = true;
    }
    this.cdr.detectChanges();
  }


  closeAllDialogs() {
    this.menuDialog = false;
    this.membersDialog = false;
    this.channelDialog = false;
  }


    onDialogSwitch(event: { from: string; to: string }) {
    this.closeAllDialogs();
    this.cdr.detectChanges();
    if (event.to === 'menuDialog') {
      this.menuDialog = true;
    } else if (event.to === 'membersDialog') {
      this.membersDialog = true;
    } else if (event.to === 'channelDialog') {
      this.channelDialog = true;
    }
    console.log(`Dialog switched: from ${event.from} to ${event.to}`);
  }


onDialogChange(newValue: boolean, menu: string) {
  this.closeAllDialogs();
  if (menu === 'membersDialog') 
    this.membersDialog = newValue;
  else if (menu === 'menuDialog')
    this.menuDialog = newValue;
  else if (menu === 'channelDialog') 
    this.channelDialog = newValue;
}


closeDialog(event: Event) {
  event?.preventDefault();
  event.stopPropagation();
  this.menuDialog = false;
  this.membersDialog = false;
  this.channelDialog = false;
}
}