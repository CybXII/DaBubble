import { Component } from '@angular/core';
import { state, style, transition, animate, trigger } from '@angular/animations';

@Component({
  selector: 'app-intro',
  imports: [],
  templateUrl: './intro.component.html',
  styleUrl: './intro.component.scss',
  animations: [
    trigger('los-trigger', [
      state('start', style({ color: 'white' })),
      state('end', style({ color: 'green' })),
      transition('start => end', [animate('1s')])
    ]),
  ],
})
export class IntroComponent {
  losBoolean = true;
}

