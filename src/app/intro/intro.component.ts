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
    trigger('startStop', [
      state('start', style({})),
      state('stop', style({ "top": "10%", "left": "10%", "width": "50px" })),
      transition('start => stop', [animate('1s')])
    ]),
  ],
})
export class IntroComponent {
  protected startAnim: 'start' | 'stop' = 'start';
}

bootstrapApplication(IntroComponent, { providers: [provideAnimationsAsync()] });


// .icon {
//   position: absolute;
//   width: 100px;
//   height: 121px;
//   top: 50%;
//   left: 50%;
//   z-index: 2;
//   transform: translate(-50%, -50%);
//   animation: moveImage 1s forwards;
//   animation-delay: 0.5s;
// }

// @keyframes moveImage {
//   from {
//     transform: translate(-50%, -50%);
//     width: 100px;
//     height: 121px;
//   }
//   to {
//     left: 20%;
//     top: 12%;
//     width: 64px;
//     height: 78px;
//   }
// }
