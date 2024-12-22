import { Component, OnInit, OnDestroy } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { Channel } from '../../../models/channel';
import { ChannelsService } from '../../../shared/services/channels.service';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MessagesService } from '../../../shared/services/messages.service';
import { Auth } from '@angular/fire/auth';
import { AddchatComponent } from '../../addchat/addchat.component';
import { MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-menu-channels',
  imports: [CommonModule],
  standalone: true,
  templateUrl: './menu-channels.component.html',
  styleUrls: ['./menu-channels.component.scss'],
})
export class MenuChannelsComponent implements OnInit, OnDestroy {
  private unsubscribeFn: (() => void) | null = null; // Abmeldefunktion für Echtzeit-Listener
  channelsOpen: boolean = false;
  channelActive: boolean = false;
  channels: Channel[] = []; // Channels-Array
  loading: boolean = true; // Ladeanzeige
  channelForm: FormGroup;
  currentChannelId: string | null = null; // Aktuelle Channel-ID
  messages: any[] = []; // Nachrichten für den ausgewählten Channel

  constructor(
    private fb: FormBuilder,
    private dialog: MatDialog,
    public channelsService: ChannelsService,
    private messagesService: MessagesService,
    private auth: Auth,
    // public dialogRef: MatDialogRef<FullscreenModalComponent>,
  ) {
    this.channelForm = this.fb.group({
      name: ['', Validators.required],
      description: [''],
      isPrivate: [false],
    });
  }

  ngOnInit(): void {
    this.loadChannelsRealtime();
  }

  ngOnDestroy(): void {
    if (this.unsubscribeFn) {
      this.unsubscribeFn();
    }
  }

  loadChannelsRealtime(): void {
    this.loading = true;
    this.unsubscribeFn = this.channelsService.loadChannelsRealtime((channels) => {
      this.channels = channels;
      this.loading = false;
      console.log('Channels aktualisiert:', this.channels);
    });
  }

  async addChannel(): Promise<void> {

    console.error('addChannel() wurde nicht implementiert.');

  }

  // Dialog öffnen
  openDialog(): void {
    this.dialog.open(AddchatComponent, {
      width: 'fit-content',
      maxWidth: '100vw',
      height: 'fit-content',
    });
  }

  // Channel auswählen und Nachrichten laden
  selectChannel(channelId: string): void {
    this.currentChannelId = channelId;
    this.messagesService.loadMessagesForChannel(channelId);
    console.log('Lade Nachrichten für Channel mit ID:', channelId);
  }
}