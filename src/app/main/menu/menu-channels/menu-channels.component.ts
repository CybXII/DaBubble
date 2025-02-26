import { Component, OnInit, OnDestroy } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { Channel } from '../../../models/channel';
import { ChannelsService } from '../../../shared/services/channels.service';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AddchatComponent } from '../../addchat/addchat.component';
import { SharedService } from '../../../shared/services/newmessage.service';

@Component({
  selector: 'app-menu-channels',
  imports: [CommonModule],
  standalone: true,
  templateUrl: './menu-channels.component.html',
  styleUrls: ['./menu-channels.component.scss'],
})
export class MenuChannelsComponent implements OnInit, OnDestroy {
  private unsubscribeFn: (() => void) | null = null;
  channelActive: boolean = false;
  channels: Channel[] = [];
  loading: boolean = true;
  channelForm: FormGroup;
  currentChannelId: string | null = null;

  /**
   * Constructor for the MenuChannelsComponent.
   *
   * @param fb The FormBuilder for creating the channelForm.
   * @param dialog The MatDialog for opening the AddchatComponent.
   * @param channelsService The ChannelsService for interacting with the channels collection in Firestore.
   * @param sharedService The SharedService for emitting events to the outside.
   */
  constructor(
    private fb: FormBuilder,
    private dialog: MatDialog,
    public channelsService: ChannelsService,
    private sharedService: SharedService,
  ) {
    this.channelForm = this.fb.group({
      name: ['', Validators.required],
      description: [''],
      isPrivate: [false],
    });
  }

  /**
   * Initializes the component by loading the channels in real-time.
   */
  ngOnInit(): void {
    this.loadChannelsRealtime();
  }

  /**
   * Cleans up the component by unsubscribing from the Firestore channel list
   * listener. This is necessary to prevent memory leaks.
   */
  ngOnDestroy(): void {
    if (this.unsubscribeFn) {
      this.unsubscribeFn();
    }
  }

  /**
   * Loads the channels in real-time from Firestore. This method is called in ngOnInit()
   * and unsubscribes in ngOnDestroy() to prevent memory leaks.
   */
  loadChannelsRealtime(): void {
    this.loading = true;
    this.unsubscribeFn = this.channelsService.loadChannelsRealtime((channels) => {
      this.channels = channels;
      this.loading = false;
    });
  }


  /**
   * Opens the AddchatComponent dialog with specified dimensions and styling.
   * This dialog allows the user to add a new chat channel.
   */
  openDialog(): void {
    this.dialog.open(AddchatComponent, {
      width: '600px',
      maxWidth: '90vw',
      height: 'fit-content',
      panelClass: 'custom-dialog-container'
    });
  }


  /**
   * Selects a channel based on the provided channel ID.
   * Updates a shared service variable and calls the channel service to select the channel.
   *
   * @param {string} channelId - The ID of the channel to select.
   */
  selectChannel(channelId: string): void {
    this.sharedService.updateVariable('false');
    this.channelsService.selectChannel(channelId)
  }
}
