import { Inject, Injectable, Renderer2, RendererFactory2 } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { DOCUMENT } from '@angular/common';

@Injectable({
  providedIn: 'root',
})
export class EmojiPickerService {
  // ✅ Pickers für Nachrichten (MainChat & ThreadChat)
  private activeMessagePicker = new BehaviorSubject<string | null>(null);
  private activeThreadMessagePicker = new BehaviorSubject<string | null>(null);

  // ✅ ParentMessage-Picker
  private activeParentPicker = new BehaviorSubject<string | null>(null);

  // ✅ MessageBox-Picker (Main, Thread, Create)
  private isMessageBoxMainPickerOpen = new BehaviorSubject<boolean>(false);
  private isMessageBoxThreadPickerOpen = new BehaviorSubject<boolean>(false);
  private isMessageBoxCreateMessagePickerOpen = new BehaviorSubject<boolean>(false);

  // ✅ Observables für die Komponenten
  public activeMessagePicker$ = this.activeMessagePicker.asObservable();
  public activeThreadMessagePicker$ = this.activeThreadMessagePicker.asObservable();
  public activeParentPicker$ = this.activeParentPicker.asObservable();

  public isMessageBoxMainPickerOpen$ = this.isMessageBoxMainPickerOpen.asObservable();
  public isMessageBoxThreadPickerOpen$ = this.isMessageBoxThreadPickerOpen.asObservable();
  public isMessageBoxCreateMessagePickerOpen$ = this.isMessageBoxCreateMessagePickerOpen.asObservable();

  private renderer: Renderer2;

  constructor(@Inject(DOCUMENT) private document: Document, rendererFactory: RendererFactory2) {
    this.renderer = rendererFactory.createRenderer(null, null);
    this.listenForOutsideClicks();
  }

  /** 🔥 Alle Picker schließen, wenn außerhalb geklickt wird */
  private listenForOutsideClicks(): void {
    this.renderer.listen(this.document, 'click', (event: Event) => {
      if (!this.isClickInsideEmojiPicker(event.target as HTMLElement) && !this.isClickOnToggleButton(event.target as HTMLElement)) {
        console.log('🔴 Klick außerhalb erkannt – Alle Picker werden geschlossen.');
        this.closeAllEmojiPickers();
      }
    });
  }

  /** 🔍 Prüfen, ob der Klick innerhalb eines Emoji-Pickers war */
  private isClickInsideEmojiPicker(target: HTMLElement): boolean {
    return !!target.closest('.emoji-picker__wrapper');
  }

  /** 🔍 Prüfen, ob der Klick auf einen Emoji-Toggle-Button war */
  private isClickOnToggleButton(target: HTMLElement): boolean {
    return !!target.closest('.chatbox__addemoji__emoji-container');
  }

  /** 🔥 MainChat-Nachricht Picker öffnen */
  openMessageEmojiPicker(messageId: string) {
    this.closeAllEmojiPickers();
    this.activeMessagePicker.next(messageId);
  }

  /** 🔥 ThreadChat-Nachricht Picker öffnen */
  openThreadMessageEmojiPicker(messageId: string) {
    this.closeAllEmojiPickers();
    this.activeThreadMessagePicker.next(messageId);
  }

  /** 🔥 ParentMessage Picker öffnen */
  openParentMessageEmojiPicker(messageId: string) {
    this.closeAllEmojiPickers();
    this.activeParentPicker.next(messageId);
  }

  /** 🔥 MessageBox Pickers */
  toggleMsgBoxEmojiPickerMain() {
    this.closeAllEmojiPickers(); // ❗ Erst alle Picker schließen
    this.isMessageBoxMainPickerOpen.next(!this.isMessageBoxMainPickerOpen.value);
  }

  toggleMsgBoxEmojiPickerThread() {
    this.closeAllEmojiPickers();
    this.isMessageBoxThreadPickerOpen.next(!this.isMessageBoxThreadPickerOpen.value);
  }

  toggleMsgBoxCreateMessageEmojiPicker() {
    this.closeAllEmojiPickers();
    this.isMessageBoxCreateMessagePickerOpen.next(!this.isMessageBoxCreateMessagePickerOpen.value);
  }


  /** ❌ Schließen aller Emoji-Picker */
  closeAllEmojiPickers() {
    console.log('🛑 Schließe alle Emoji-Picker');
    this.closeAllMessagePickers();
    this.closeAllThreadMessagePickers();
    this.closeAllParentPickers();
    this.closeAllMsgBoxPickers();
  }

  closeAllMessagePickers() {
    this.activeMessagePicker.next(null);
  }

  closeAllThreadMessagePickers() {
    this.activeThreadMessagePicker.next(null);
  }

  closeAllParentPickers() {
    this.activeParentPicker.next(null);
  }

  closeAllMsgBoxPickers() {
    this.isMessageBoxMainPickerOpen.next(false);
    this.isMessageBoxThreadPickerOpen.next(false);
    this.isMessageBoxCreateMessagePickerOpen.next(false);
  }


  /** ❓ Prüfen, ob ein Picker für eine bestimmte Nachricht aktiv ist */
  isMessageEmojiPickerOpen(messageId: string): boolean {
    return this.activeMessagePicker.value === messageId;
  }

  isThreadMessageEmojiPickerOpen(messageId: string): boolean {
    return this.activeThreadMessagePicker.value === messageId;
  }

  isParentMessageEmojiPickerOpen(messageId: string): boolean {
    return this.activeParentPicker.value === messageId;
  }

  /** ❓ Prüfen, ob ein Picker in einem bestimmten Bereich aktiv ist */
  isAnyPickerOpen(): boolean {
    return (
      this.activeMessagePicker.value !== null ||
      this.activeThreadMessagePicker.value !== null ||
      this.activeParentPicker.value !== null ||
      this.isMessageBoxMainPickerOpen.value ||
      this.isMessageBoxThreadPickerOpen.value ||
      this.isMessageBoxCreateMessagePickerOpen.value
      // this.isBuilderPickerOpen.value
    );
  }


  isMainChatPickerActive(): boolean {
    return this.isMessageBoxMainPickerOpen.value;
  }

  isThreadChatPickerActive(): boolean {
    return this.isMessageBoxThreadPickerOpen.value;
  }

  isCreateMessagePickerActive(): boolean {
    return this.isMessageBoxCreateMessagePickerOpen.value;
  }
}
