import { Component } from '@angular/core';
import { state, style, transition, animate, trigger } from '@angular/animations';
import { bootstrapApplication } from '@angular/platform-browser';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';

@Component({
  selector: 'app-intro',
  imports: [],
  templateUrl: './intro.component.html',
  styleUrl: './intro.component.scss',
  animations: [
    trigger('openClose', [
      state('closed', style({ "color": "white" })),
      state('open', style({ "color": "green" })),
      transition('closed <=> open', [animate('1s')])
    ]),
  ],
})
export class IntroComponent {
  losBoolean = true;
  protected menuState: 'open' | 'closed' = 'closed';
}

bootstrapApplication(IntroComponent, { providers: [provideAnimationsAsync()] });
