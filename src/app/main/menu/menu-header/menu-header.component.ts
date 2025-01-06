import { Component, OnInit, OnDestroy } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { AddchatComponent } from '../../addchat/addchat.component';
import { Channel } from '../../../models/channel';
import { ChannelsService } from '../../../shared/services/channels.service';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

@Component({
  selector: 'app-menu-header',
  imports: [],
  standalone: true,   // <-- Add this line
  templateUrl: './menu-header.component.html',
  styleUrl: './menu-header.component.scss'
})
export class MenuHeaderComponent implements OnInit, OnDestroy {
  private unsubscribeFn: (() => void) | null = null;
  channelsOpen: boolean = false;
  channelActive: boolean = false;
  channels: Channel[] = [];
  loading: boolean = true;
  channelForm: FormGroup;
  currentChannelId: string | null = null;
channel: any;


  openNewMessage() {
    this.dialog.open(AddchatComponent, {
      width: 'fit-content',
      maxWidth: '100vw',
      height: 'fit-content',
    });
  }


  constructor(
    private fb: FormBuilder,
    private dialog: MatDialog,
    public channelsService: ChannelsService,
  ) {
    this.channelForm = this.fb.group({
      name: ['', Validators.required],
      description: [''],
      isPrivate: [false],
    });
  }
  ngOnDestroy(): void {
    throw new Error('Method not implemented.');
  }
  ngOnInit(): void {
    throw new Error('Method not implemented.');
  }

  selectChannel(channelId: string): void {
    this.channelsService.selectChannel(channelId)
  }

}
