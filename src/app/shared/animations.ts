import { trigger, state, style, transition, animate } from '@angular/animations';

export const slideAnimationLeft = trigger('slideAnimationLeft', [
    state('in', style({ transform: 'translateX(0)' })),
    state('out', style({ transform: 'translateX(-100%)' })),
    transition('in => out', [animate('300ms ease-in-out')]),
    transition('out => in', [animate('300ms ease-in-out')]),
]);

export const slideAnimationRight = trigger('slideAnimationRight', [
    state('in', style({ transform: 'translateX(0)' })),
    state('out', style({ transform: 'translateX(100%)' })),
    transition('in => out', [animate('300ms ease-in-out')]),
    transition('out => in', [animate('300ms ease-in-out')]),
]);
