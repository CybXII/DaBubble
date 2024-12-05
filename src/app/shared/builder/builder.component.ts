import { Component } from '@angular/core';
import { MainchatComponent } from '../../main/mainchat/mainchat.component';
import { ThreadchatComponent } from '../../main/threadchat/threadchat.component';
import { MenuComponent } from '../../main/menu/menu.component';

@Component({
  selector: 'app-builder',
  imports: [MainchatComponent, ThreadchatComponent,MenuComponent],
  templateUrl: './builder.component.html',
  styleUrl: './builder.component.scss'
})
export class BuilderComponent {
  builder: string[] = ["menu", "mainchat", "threadchat"];

  menuOpened: boolean = true;
  threadchatOpened: boolean = true;
}
