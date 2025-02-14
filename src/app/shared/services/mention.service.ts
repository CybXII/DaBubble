import { DOCUMENT } from '@angular/common';
import { Inject, Injectable, Renderer2, RendererFactory2 } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class MentionService {
  mentionsUser: any = [];
  private renderer: Renderer2;
  status:boolean = false;
  user:string = '';
  builder:string = '';

  constructor(@Inject(DOCUMENT) private document: Document, rendererFactory: RendererFactory2) {
    this.renderer = rendererFactory.createRenderer(null, null);
    this.listenForOutsideClicks();
  }
  
  /** 🔥 Alle Picker schließen, wenn außerhalb geklickt wird */
  private listenForOutsideClicks(): void {
    this.renderer.listen(this.document, 'click', (event: Event) => {
      if (!this.isClickInsideMentionPicker(event.target as HTMLElement) && !this.isClickOnToggleButton(event.target as HTMLElement)) {
        this.status = false;
      }
    });
  }

  /** 🔍 Prüfen, ob der Klick innerhalb eines Emoji-Pickers war */
  private isClickInsideMentionPicker(target: HTMLElement): boolean {
    return !!target.closest('.mention-picker__wrapper');
  }

  /** 🔍 Prüfen, ob der Klick auf einen Emoji-Toggle-Button war */
  private isClickOnToggleButton(target: HTMLElement): boolean {
    return !!target.closest('.cont');
  }

  mentionSomeone(user:any, bulider:string) {
    this.status = false;
    this.user = user.name
    this.mentionUser(bulider)
    // return user.name
  }

  // mentionSomeone(user:any) {
  //   if (user !== typeof {}) {
  //     this.mentionsUser.push(user)
  //   } else {
  //     console.error("leer!!!!!!!!!!!!!!!!!!!!!")
  //   }
  //   // funktion zur benutzererwähnung
  //   console.log("erwähnte User:",this.mentionsUser)
  // }

  disselect(member:string) {
    for (let i = 0; i < this.mentionsUser.length; i++) {
      const user = this.mentionsUser[i];
      if (user.id === member) {
        this.mentionsUser.splice(i, 1)
      } else {
        null;
      }
    }
    console.log("erwähnte User:",this.mentionsUser)
  }

  mentionUser(bulider:string) {
    if (bulider === 'mainchat') {
      this.insertTextAndFocus(this.user, 'messagebox')
    } else if (bulider === 'threadchat') {
      this.insertTextAndFocus(this.user, 'threadMessageBox')
    } else {
      this.insertTextAndFocus(this.user, 'messagebox')
    }
  }

  insertTextAndFocus(text: string, inputId: string): void {
    const inputElement = document.getElementById(inputId) as HTMLInputElement;
    if (inputElement) {
        inputElement.value += "@" + text + " ";
        inputElement.focus();
    } else {
        console.error('Input field not found'); 
    }
  }
}
