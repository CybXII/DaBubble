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
    });
  }


  openDialog(): void {
    this.dialog.open(AddchatComponent, {
      width: '600px',
      maxWidth: '90vw',
      height: 'fit-content',
      panelClass: 'custom-dialog-container'
    });
  }


  selectChannel(channelId: string): void {
    this.sharedService.updateVariable('false');
    this.channelsService.selectChannel(channelId)
  }
}