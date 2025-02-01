import { trigger, state, style, transition, animate, sequence } from '@angular/animations';


// export const slideAnimationLeft = trigger('slideAnimationLeft', [
//     state('in', style({ width: '366px', "min-width":'366px', transform: 'translateX(0)', overflow: 'hidden' })), // Ursprungszustand
//     state('out', style({ width: '0', transform: 'translateX(-100%)', overflow: 'hidden' })), // Endzustand
//     transition('in => out', [
//       animate('300ms ease-in-out', style({ transform: 'translateX(-300px)', width: '0px' })), // Zwischenschritt
//       animate('300ms ease-in-out') // Vollständiges Heraussliden
//     ]),
//     transition('out => in', [
//       animate('300ms ease-in-out', style({ width: '0', transform: 'translateX(-100%)' })), // Breite wächst
//       animate('300ms ease-in-out', style({ width: '366px', transform: 'translateX(0)' })) // Vollständig reinsliden
//     ]),
// ]);


export const slideAnimationLeft = trigger('slideAnimationLeft', [
  state('in', style({
    width: '{{width}}',
    'min-width': '{{width}}',
    transform: 'translateX(0)',
    overflow: 'hidden'
  }), { params: { width: '366px' }}), // Standardbreite
  state('out', style({
    width: '0',
    transform: 'translateX(-100%)',
    overflow: 'hidden'
  })),
  transition('in => out', [
    animate('300ms ease-in-out', style({ transform: 'translateX(-100%)', width: '0' }))
  ]),
  transition('out => in', [
    animate('300ms ease-in-out', style({ width: '0', transform: 'translateX(-100%)' })),
    animate('300ms ease-in-out', style({ width: '{{width}}', transform: 'translateX(0)' }))
  ])
]);

export const slideAnimationRight = trigger('slideAnimationRight', [
  state(
    'in',
    style({
      width: '{{width}}',
      transform: 'translateX(0)',
      overflow: 'hidden',
    }),
    { params: { width: '485px' } }
  ),
  state(
    'out',
    style({
      width: '0',
      transform: 'translateX(100%)',
      overflow: 'hidden',
    })
  ),
  transition('in => out', [
    animate(
      '300ms ease-in-out',
      style({
        transform: 'translateX({{width}})',
        width: '0px',
      })
    ),
    animate('300ms ease-in-out'),
  ]),
  transition('out => in', [
    animate(
      '300ms ease-in-out',
      style({
        width: '0',
        transform: 'translateX(100%)',
      })
    ),
    animate(
      '300ms ease-in-out',
      style({
        width: '{{width}}',
        transform: 'translateX(0)',
      })
    ),
  ]),
]);
