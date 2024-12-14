import { trigger, state, style, transition, animate, sequence } from '@angular/animations';

export const slideAnimationLeft = trigger('slideAnimationLeft', [
    // Zustände
    state('in', style({ transform: 'translateX(0)', width: '*' })), // Ausgangszustand
    state('out', style({ transform: 'translateX(-100%)', width: '0%' })), // Zustand nach dem Ausblenden

    // Übergänge
    transition('in => out', sequence([
    animate('300ms ease-in-out', style({ transform: 'translateX(-100%)' })), // Nach links schieben
    animate('300ms ease-in-out', style({ width: '0%' })) // Breite reduzieren
    ])),

    transition('out => in', sequence([
    animate('300ms ease-in-out', style({ width: '100%' })), // Breite wiederherstellen
    animate('300ms ease-in-out', style({ transform: 'translateX(0)' })) // Zurück in die Ausgangsposition
    ]))
]);

export const slideAnimationRight = trigger('slideAnimationRight', [
    state('in', style({ transform: 'translateX(0)' })),
    state('out', style({ transform: 'translateX(100%)' })),
    transition('in => out', [animate('300ms ease-in-out')]),
    transition('out => in', [animate('300ms ease-in-out')]),
]);
