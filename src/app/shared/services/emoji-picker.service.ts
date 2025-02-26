import { Inject, Injectable, Renderer2, RendererFactory2 } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { DOCUMENT } from '@angular/common';

@Injectable({
  providedIn: 'root',
})
export class EmojiPickerService {
  private activeMessagePicker = new BehaviorSubject<string | null>(null);
  private activeThreadMessagePicker = new BehaviorSubject<string | null>(null);
  private activeParentPicker = new BehaviorSubject<string | null>(null);
  private isMessageBoxMainPickerOpen = new BehaviorSubject<boolean>(false);
  private isMessageBoxThreadPickerOpen = new BehaviorSubject<boolean>(false);
  private isMessageBoxCreateMessagePickerOpen = new BehaviorSubject<boolean>(false);

  public activeMessagePicker$ = this.activeMessagePicker.asObservable();
  public activeThreadMessagePicker$ = this.activeThreadMessagePicker.asObservable();
  public activeParentPicker$ = this.activeParentPicker.asObservable();
  public isMessageBoxMainPickerOpen$ = this.isMessageBoxMainPickerOpen.asObservable();
  public isMessageBoxThreadPickerOpen$ = this.isMessageBoxThreadPickerOpen.asObservable();
  public isMessageBoxCreateMessagePickerOpen$ = this.isMessageBoxCreateMessagePickerOpen.asObservable();

  private renderer: Renderer2;

  /**
   * Initializes the EmojiPickerService by setting up the renderer and listening for outside clicks on the document.
   * @param document The document object to listen for clicks on.
   * @param rendererFactory The factory to create a renderer with.
   */
  constructor(@Inject(DOCUMENT) private document: Document, rendererFactory: RendererFactory2) {
    this.renderer = rendererFactory.createRenderer(null, null);
    this.listenForOutsideClicks();
  }
  

  /**
   * Listens for clicks outside of all emoji pickers and closes all pickers
   * if a click is detected outside of an emoji picker and not on a toggle button.
   */
  private listenForOutsideClicks(): void {
    this.renderer.listen(this.document, 'click', (event: Event) => {
      if (!this.isClickInsideEmojiPicker(event.target as HTMLElement) 
        && !this.isClickOnToggleButton(event.target as HTMLElement)
        && !this.isClickOnToggleButtonThread(event.target as HTMLElement)) {
        this.closeAllEmojiPickers();
      }
    });
  }


  /**
   * Checks if the given target element is inside an emoji picker.
   * @param target The element to check.
   * @returns True if the element is inside an emoji picker, false otherwise.
   */
  private isClickInsideEmojiPicker(target: HTMLElement): boolean {
    return !!target.closest('.emoji-picker__wrapper');
  }


  /**
   * Checks if the given target element is a toggle button for an emoji picker in a main chat message.
   * @param target The element to check.
   * @returns True if the element is a toggle button for an emoji picker in a main chat message, false otherwise.
   */
  private isClickOnToggleButton(target: HTMLElement): boolean {
    return !!target.closest('.chatbox__addemoji__emoji-container');
  }


  /**
   * Checks if the given target element is a toggle button for an emoji picker in a thread message.
   * @param target The element to check.
   * @returns True if the element is a toggle button for an emoji picker in a thread message, false otherwise.
   */
  private isClickOnToggleButtonThread(target: HTMLElement): boolean {
    return !!target.closest('.chatbox__addreaction-container');
  }


  /**
   * Opens the emoji picker for the message with the given message ID.
   * 
   * Closes all other emoji pickers before opening the one for the given message ID.
   * @param messageId The ID of the message to open the emoji picker for.
   */
  openMessageEmojiPicker(messageId: string) {
    this.closeAllEmojiPickers();
    this.activeMessagePicker.next(messageId);
  }


  /**
   * Opens the emoji picker for the thread message with the given message ID.
   * 
   * Closes all other emoji pickers before opening the one for the given message ID.
   * @param messageId The ID of the thread message to open the emoji picker for.
   */
  openThreadMessageEmojiPicker(messageId: string) {
    this.closeAllEmojiPickers();
    this.activeThreadMessagePicker.next(messageId);
  }


  /**
   * Opens the emoji picker for the parent message with the given message ID.
   * 
   * Closes all other emoji pickers before opening the one for the given parent message ID.
   * @param messageId The ID of the parent message to open the emoji picker for.
   */
  openParentMessageEmojiPicker(messageId: string) {
    this.closeAllEmojiPickers();
    this.activeParentPicker.next(messageId);
  }


  /**
   * Toggles the emoji picker for the main message box.
   * 
   * If the emoji picker for the main message box is already open, it closes all emoji pickers.
   * Otherwise, it first closes all emoji pickers and then opens the emoji picker for the main message box.
   */
  toggleMsgBoxEmojiPickerMain() {
    this.closeAllEmojiPickers();
    this.isMessageBoxMainPickerOpen.next(!this.isMessageBoxMainPickerOpen.value);
  }


  /**
   * Toggles the emoji picker for the thread message box.
   * 
   * If the emoji picker for the thread message box is already open, it closes all emoji pickers.
   * Otherwise, it first closes all emoji pickers and then opens the emoji picker for the thread message box.
   */
  toggleMsgBoxEmojiPickerThread() {
    this.closeAllEmojiPickers();
    this.isMessageBoxThreadPickerOpen.next(!this.isMessageBoxThreadPickerOpen.value);
  }


  /**
   * Toggles the emoji picker for the create message box.
   * 
   * If the emoji picker for the create message box is already open, it closes all emoji pickers.
   * Otherwise, it first closes all emoji pickers and then opens the emoji picker for the create message box.
   */
  toggleMsgBoxCreateMessageEmojiPicker() {
    this.closeAllEmojiPickers();
    this.isMessageBoxCreateMessagePickerOpen.next(!this.isMessageBoxCreateMessagePickerOpen.value);
  }


  /**
   * Closes all emoji pickers, regardless of the component they are associated with.
   *
   * This method is used to close all emoji pickers when the user clicks outside of an emoji picker
   * or when the user navigates away from a component that has an emoji picker open.
   */
  closeAllEmojiPickers() {
    this.closeAllMessagePickers();
    this.closeAllThreadMessagePickers();
    this.closeAllParentPickers();
    this.closeAllMsgBoxPickers();
  }


  /**
   * Closes all emoji pickers associated with messages.
   *
   * This method is used to close all emoji pickers associated with messages when the user clicks outside of an emoji picker
   * or when the user navigates away from a component that has an emoji picker open.
   */
  closeAllMessagePickers() {
    this.activeMessagePicker.next(null);
  }


  /**
   * Closes all emoji pickers associated with thread messages.
   *
   * This method is used to close all emoji pickers associated with thread messages when the user clicks outside of an emoji picker
   * or when the user navigates away from a component that has an emoji picker open.
   */
  closeAllThreadMessagePickers() {
    this.activeThreadMessagePicker.next(null);
  }


  /**
   * Closes all emoji pickers associated with parent messages.
   *
   * This method is used to close all emoji pickers associated with parent messages when the user clicks outside of an emoji picker
   * or when the user navigates away from a component that has an emoji picker open.
   */
  closeAllParentPickers() {
    this.activeParentPicker.next(null);
  }


  /**
   * Closes all emoji pickers associated with the main message box.
   *
   * This method is used to close all emoji pickers associated with the main message box when the user clicks outside of an emoji picker
   * or when the user navigates away from a component that has an emoji picker open.
   */
  closeAllMsgBoxPickers() {
    this.isMessageBoxMainPickerOpen.next(false);
    this.isMessageBoxThreadPickerOpen.next(false);
    this.isMessageBoxCreateMessagePickerOpen.next(false);
  }


  /**
   * Checks if the emoji picker is open for a specific message.
   * 
   * This method determines whether the emoji picker is currently active
   * for the message with the provided message ID.
   *
   * @param messageId The ID of the message to check.
   * @returns {boolean} True if the emoji picker is open for the specified message, false otherwise.
   */
  isMessageEmojiPickerOpen(messageId: string): boolean {
    return this.activeMessagePicker.value === messageId;
  }


  /**
   * Checks if the emoji picker is open for a specific thread message.
   * 
   * This method determines whether the emoji picker is currently active
   * for the thread message with the provided message ID.
   *
   * @param messageId The ID of the thread message to check.
   * @returns {boolean} True if the emoji picker is open for the specified thread message, false otherwise.
   */
  isThreadMessageEmojiPickerOpen(messageId: string): boolean {
    return this.activeThreadMessagePicker.value === messageId;
  }

  
  /**
   * Checks if the emoji picker is open for a specific parent message.
   * 
   * This method determines whether the emoji picker is currently active
   * for the parent message with the provided message ID.
   *
   * @param messageId The ID of the parent message to check.
   * @returns {boolean} True if the emoji picker is open for the specified parent message, false otherwise.
   */
  isParentMessageEmojiPickerOpen(messageId: string): boolean {
    return this.activeParentPicker.value === messageId;
  }


  /**
   * Checks if any emoji picker is currently open.
   * 
   * This method checks if any of the emoji pickers (for messages, thread messages, parent messages, main message box, thread message box, or create message box) is currently open.
   * 
   * @returns {boolean} True if any emoji picker is open, false otherwise.
   */
  isAnyPickerOpen(): boolean {
    return (
      this.activeMessagePicker.value !== null ||
      this.activeThreadMessagePicker.value !== null ||
      this.activeParentPicker.value !== null ||
      this.isMessageBoxMainPickerOpen.value ||
      this.isMessageBoxThreadPickerOpen.value ||
      this.isMessageBoxCreateMessagePickerOpen.value
    );
  }


  /**
   * Checks if the emoji picker for the main message box is currently open.
   * 
   * This method determines whether the emoji picker for the main message box is currently active.
   * 
   * @returns {boolean} True if the emoji picker is open for the main message box, false otherwise.
   */
  isMainChatPickerActive(): boolean {
    return this.isMessageBoxMainPickerOpen.value;
  }


  /**
   * Checks if the emoji picker for the thread chat is currently active.
   * 
   * This method determines whether the emoji picker for the thread chat
   * is currently open.
   * 
   * @returns {boolean} True if the emoji picker is open for the thread chat, false otherwise.
   */
  isThreadChatPickerActive(): boolean {
    return this.isMessageBoxThreadPickerOpen.value;
  }


  /**
   * Checks if the emoji picker for the create message box is currently open.
   *
   * This method determines whether the emoji picker for the create message box is currently active.
   *
   * @returns {boolean} True if the emoji picker is open for the create message box, false otherwise.
   */
  isCreateMessagePickerActive(): boolean {
    return this.isMessageBoxCreateMessagePickerOpen.value;
  }
}
