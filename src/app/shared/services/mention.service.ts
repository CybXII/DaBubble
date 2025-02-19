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
  isOpendWithKeys:boolean = false;

  /**
   * Initializes the MentionService by setting up the renderer and listening for outside clicks on the document.
   * @param document The document object to listen for clicks on.
   * @param rendererFactory The factory to create a renderer with.
   */
  constructor(@Inject(DOCUMENT) private document: Document, rendererFactory: RendererFactory2) {
    this.renderer = rendererFactory.createRenderer(null, null);
    this.listenForOutsideClicks();
  }
  

  /**
   * Listens for clicks outside of all mention pickers and closes all pickers
   * if a click is detected outside of an mention picker and not on a toggle button.
   */
  private listenForOutsideClicks(): void {
    this.renderer.listen(this.document, 'click', (event: Event) => {
      if (!this.isClickInsideMentionPicker(event.target as HTMLElement) && !this.isClickOnToggleButton(event.target as HTMLElement)) {
        this.status = false;
      }
    });
  }


  /**
   * Checks if the given target element is inside a mention picker.
   * @param target The element to check.
   * @returns True if the element is inside a mention picker, false otherwise.
   */
  private isClickInsideMentionPicker(target: HTMLElement): boolean {
    return !!target.closest('.mention-picker__wrapper');
  }


  /**
   * Checks if the given target element is a toggle button for a mention picker.
   * @param target The element to check.
   * @returns True if the element is a toggle button for a mention picker, false otherwise.
   */
  private isClickOnToggleButton(target: HTMLElement): boolean {
    this.isOpendWithKeys = false;
    return !!target.closest('.cont');
  }


  /**
   * Mentions the given user in the given builder component (e.g. mainchat, threadchat).
   * @param user The user to mention.
   * @param bulider The component to mention the user in.
   */
  mentionSomeone(user:any, bulider:string) {
    this.status = false;
    this.user = user.name
    this.mentionUser(bulider)
  }


  /**
   * Disselects a user from the mentionsUser array by removing them from the array.
   * @param member The id of the user to be disselected.
   */
  disselect(member:string) {
    for (let i = 0; i < this.mentionsUser.length; i++) {
      const user = this.mentionsUser[i];
      if (user.id === member) {
        this.mentionsUser.splice(i, 1)
      } else 
        null;
    }
  }


  /**
   * Mentions the user in the given builder component by inserting the users name preceded by an @ symbol into the input field of the builder component.
   * @param bulider The component to mention the user in.
   */
  mentionUser(bulider:string) {
    let user = this.user
    console.warn("Ist mit @ geöffnet worden",this.isOpendWithKeys)
    if (this.isOpendWithKeys) {user = `${user}`} else {user = `@${user}`}
    if (bulider === 'mainchat') {
      this.insertTextAndFocus(`${user}`, 'messagebox')
    } else if (bulider === 'threadchat') {
      this.insertTextAndFocus(`${user}`, 'threadmessagebox')
    } else {
      this.insertTextAndFocus(user, 'messagebox')
    }
    this.isOpendWithKeys = false;
  }


  /**
   * Inserts the given text into the input field of the given component and focuses the input field.
   * @param text The text to be inserted.
   * @param inputId The id of the input field in the given component.
   */
  insertTextAndFocus(text: string, inputId: string): void {
    const inputElement = document.getElementById(inputId) as HTMLInputElement;
    if (inputElement) {
        inputElement.value += text + " ";
        inputElement.focus();
    } else {
        console.error('Input field not found'); 
    }
  }


  /**
   * Clears the input field of the given component.
   * @param inputId The id of the input field in the given component.
   */
  clearInput(inputId: string): void {
    const inputElement = document.getElementById(inputId) as HTMLInputElement;
    inputElement.value = '';
  }
}
