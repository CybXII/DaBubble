import {
  ChangeDetectionStrategy,
  Component,
  Input,
  OnInit,
  OnDestroy,
  EventEmitter,
  Output,
  WritableSignal,
  signal,
  ChangeDetectorRef,
  ElementRef,
  ViewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { EmojiPickerComponent } from '../emoji-picker/emoji-picker.component';
import { EmojiPickerService } from '../../../shared/services/emoji-picker.service';
import { MessagesService } from '../../../shared/services/messages.service';
import { UserService } from '../../../shared/services/user.service';
import { EmojiStorageService } from '../../../shared/services/emoji-storage.service';
import { Message, Reaction } from '../../../models/message';
import { Subscription } from 'rxjs';
import { ReactionsComponent } from '../../../shared/reactions/reactions.component';
import { RelativeDatePipe } from '../../../pipes/timestamp-to-date.pipe';
import { MatDialog } from '@angular/material/dialog';
import { StateService } from '../../../shared/services/state.service';
import { FormsModule } from '@angular/forms';
import { EditmessageComponent } from '../editmessage/editmessage.component';
import { UserDialogService } from '../../../shared/services/user-dialog.service';

@Component({
  selector: 'app-messages',
  standalone: true,
  imports: [CommonModule, EmojiPickerComponent, ReactionsComponent, RelativeDatePipe, FormsModule],
  templateUrl: './messages.component.html',
  styleUrls: ['./messages.component.scss', '../chatbox/chatbox.component.scss'],
  changeDetection: ChangeDetectionStrategy.Default,
})
export class MessageComponent implements OnInit, OnDestroy {
  @ViewChild('editTextArea') editTextArea!: ElementRef<HTMLTextAreaElement>;
  @Input() shouldRenderDivider!: boolean;
  @Input() message!: Message;
  @Input() activeUserId!: string;
  @Input() isCurrentUser!: boolean;
  @Input() activeMessageId!: string;
  @Output() userClicked = new EventEmitter<string>();
  private subscriptions: Subscription = new Subscription();
  isEmojiPickerOpen: WritableSignal<boolean> = signal(false);
  displayPickerBottom: boolean = false;
  previousTimestamp: number | null = null;
  editAcitve: boolean = false;

  /**
   * Constructs a new instance of the MessageComponent.
   * @param messagesService - Service for handling message operations.
   * @param emojiPickerService - Service for handling emoji picker functionalities.
   * @param userService - Service for user-related operations.
   * @param emojiStorageService - Service for storing and retrieving emoji data.
   * @param dialog - Angular Material service for dialog operations.
   * @param stateService - Service for managing the state of the application.
   * @param cdr - Service for detecting changes and updating the view.
   * @param uds - Service for managing user dialogs.
   */
  constructor(
    private messagesService: MessagesService,
    public emojiPickerService: EmojiPickerService,
    private userService: UserService,
    private emojiStorageService: EmojiStorageService,
    public dialog: MatDialog,
    private stateService: StateService,
    private cdr: ChangeDetectorRef,
    private uds: UserDialogService,
  ) {}


  /**
   * Initializes the component by subscribing to the activeMessagePicker$ observable of the EmojiPickerService.
   * When the observable emits a value, the isEmojiPickerOpen property is updated to true if the emitted value is equal to the message.docId.
   * The ChangeDetectorRef is used to update the view when the isEmojiPickerOpen property changes.
   */
  ngOnInit(): void {
    this.subscriptions.add(
      this.emojiPickerService.activeMessagePicker$.subscribe((id) => {
        this.isEmojiPickerOpen.set(id === this.message.docId);
        this.cdr.detectChanges();
      })
    );
  }


  /**
   * Cleans up the component by unsubscribing from all subscriptions.
   */
  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }


  /**
   * Toggles the emoji picker for the message.
   * If the emoji picker for the current message is already open, it closes all emoji pickers.
   * Otherwise, it first closes all emoji pickers and then opens the emoji picker for the current message.
   * The method checks if the `message` has a `docId` before performing any actions.
   */
  toggleEmojiPicker() {
    if (this.message.docId) {
      if (this.emojiPickerService.isMessageEmojiPickerOpen(this.message.docId)) {
        this.emojiPickerService.closeAllEmojiPickers();
      }
      this.emojiPickerService.closeAllEmojiPickers();
      this.emojiPickerService.openMessageEmojiPicker(this.message.docId);
    } 
  }


  /**
   * Checks if the emoji picker is open for the current message.
   * This method utilizes the EmojiPickerService to determine if the emoji picker
   * is currently open for the message associated with this component.
   * @returns {boolean} True if the emoji picker is open for the message, false otherwise.
   */
  isEmojiPickerOpenForThisMessage(): boolean {
    return this.emojiPickerService.isMessageEmojiPickerOpen(this.message.docId??'');
  }


  /**
   * Returns an observable that emits the name of the user with the given user ID.
   * This method uses the UserService to retrieve the user name associated with the given user ID.
   * @param userId The user ID to retrieve the name for.
   * @returns An observable that emits the user name.
   */
  getUserName(userId: string) {
    return this.userService.getuserName(userId);
  }


  /**
   * Retrieves the avatar URL of a user given their ID.
   * This method uses the UserService to fetch the avatar URL associated with the specified user ID.
   * @param userId The user ID to retrieve the avatar URL for.
   * @returns An observable that emits the avatar URL.
   */
  getUserAvatar(userId: string) {
    return this.userService.getuserAvatar(userId);
  }


  /**
   * Handles a user click event in the message component.
   * If the given user ID does not match the active user ID, it emits the user ID to the parent component
   * to open the user profile dialog.
   * If the given user ID matches the active user ID, it opens the profile dialog with the active user's profile
   * and sets the exit activity flag to false.
   * @param userId The user ID to check against the active user ID.
   */
  checkIdIsUser(userId: string) {
    if (this.activeUserId !== userId) {
      this.userClicked.emit(userId);
    } else if (this.activeUserId === userId) {
      this.uds.openProfile()
      this.uds.exitActiv = false;
    }
  }


  /**
   * Retrieves the last used emoji stored in the EmojiStorageService at the given index.
   * @param index The index of the emoji to retrieve.
   * @returns The emoji at the given index.
   */
  getLastUsedEmojis(index: number) {
    return this.emojiStorageService.getEmojis()[index];
  }


  /**
   * Adds an emoji to either the text area if the edit mode is active or to the reactions of the message.
   * If the edit mode is active, it adds the emoji to the text area.
   * Otherwise, it adds the emoji to the reactions array of the message.
   * @param messageId The ID of the message to add the emoji to.
   * @param userId The ID of the user who added the emoji.
   * @param emoji The emoji to add.
   * @param isThreadMessage Whether the message is a thread message.
   */
  addEmoji(messageId: string, userId: string, emoji: string, isThreadMessage: boolean): void {
    if (this.editAcitve){
      this.addEmojiToTextArea(emoji);
    } else {
      this.addEmojiToReactions(messageId, userId, emoji, isThreadMessage);
    }
  }


  /**
   * Adds an emoji to the reactions array of a message.
   * Creates a new reaction object with the given emoji and user ID, and adds it to the reactions
   * array of the message. It then updates the message with the new reactions array and closes all
   * emoji pickers for the message.
   * @param messageId The ID of the message to add the emoji to.
   * @param userId The ID of the user who added the emoji.
   * @param emoji The emoji to add.
   * @param isThreadMessage Whether the message is a thread message.
   */
  addEmojiToReactions(messageId: string, userId: string, emoji: string, isThreadMessage: boolean) {
    const reaction: Reaction = { emoji, userIds: [userId] };
    const updateData: Partial<Message> = { reactions: [reaction] };
    const updatePromise = isThreadMessage
      ? this.messagesService.updateThreadMessage(this.activeMessageId!, messageId, userId, updateData)
      : this.messagesService.updateMessage(messageId, userId, updateData);
    updatePromise.then(() => {this.emojiPickerService.closeAllMessagePickers()})
    .catch(error => console.error('❌ Fehler beim Hinzufügen der Reaktion:', error));
    this.emojiStorageService.saveEmoji(emoji);
  }


  /**
   * Adds an emoji to the text area in edit mode.
   * @param emoji The emoji to add.
   */
  addEmojiToTextArea(emoji: string) {
    const textArea = this.editTextArea.nativeElement;
    const startPos = textArea.selectionStart;
    const endPos = textArea.selectionEnd; 
    if (startPos === null || endPos === null) {
      this.message.message += emoji;
      this.emojiPickerService.closeAllMessagePickers();
    } else {
      const newText = this.message.message.substring(0, startPos) + emoji + this.message.message.substring(endPos);
      this.message.message = newText;
      setTimeout(() => {
      textArea.focus();
      textArea.selectionStart = textArea.selectionEnd = startPos + emoji.length;
      }, 0);
    }
    this.emojiPickerService.closeAllMessagePickers();
  }


  /**
   * Prevents the emoji picker from closing when a click event occurs.
   * @param event The click event to prevent from propagating.
   */
  preventEmojiPickerClose(event: Event): void {
    event.stopPropagation();
  }


  /**
   * Checks if the given timestamp represents a different day than the previous one.
   * Updates the stored timestamp for future comparisons.
   * @param {string | Date | undefined} currentTimestamp - The timestamp to check.
   * @returns {boolean} - `true` if the day has changed, `false` otherwise.
   * @throws {Error} - If an invalid timestamp is provided.
   */
  checkAndSetPreviousTimestamp(currentTimestamp: string | Date | undefined): boolean {
    if (!currentTimestamp) 
      return false;
    const currentDate = new Date(currentTimestamp);
    if (isNaN(currentDate.getTime())) 
      throw new Error('Invalid timestamp provided');
    if (!this.previousTimestamp) {
      this.previousTimestamp = currentDate.getTime();
      return true;
    }
    const previousDate = new Date(this.previousTimestamp);
    const isDifferentDay = currentDate.getDate() !== previousDate.getDate() || currentDate.getMonth() !== previousDate.getMonth() 
          || currentDate.getFullYear() !== previousDate.getFullYear();
    this.previousTimestamp = currentDate.getTime();
    return isDifferentDay;
  }


  /**
   * Selects a message and opens the thread chat.
   * @param {string} messageId - The ID of the message to select.
   * @returns {Promise<void>} - A promise that resolves when the operation is complete.
   */
  async onMessageSelect(messageId: string): Promise<void> {
    this.messagesService.setParentMessageId(messageId);
    this.activeMessageId = messageId;
    this.messagesService.setMessageId(messageId);
    this.stateService.setThreadchatState('in');
  }


  /**
   * Saves the edited content of a message.
   * @param message The partial message object containing the updated message content.
   */
  saveEdit(message: Partial<Message>) {
    if (!message.docId) 
      return console.error("Fehler: Nachricht hat keine docId.");
    this.messagesService.getMessage(message.docId).then(originalMessage => {
      if (!originalMessage) 
        return console.error("Fehler: Nachricht nicht gefunden in Firestore:", message.docId);
      this.updateMessageText(message, originalMessage);
    });
    this.editAcitve = false;
  }


  /**
   * Updates the message content in Firestore.
   * @param message The partial message object containing the updated content.
   * @param originalMessage The original message object retrieved from Firestore.
   */
  updateMessageText(message:Partial<Message> , originalMessage:Message) {
    const updateData: Partial<Message> = {message: message.message};
    if (message.docId && originalMessage.createdBy) {
      this.messagesService.updateMessage(message.docId, originalMessage.createdBy, updateData)
      .then().catch(error => {console.error("Fehler beim Speichern:", error);});
    }
    else 
      console.error("Fehler: Nachricht hat keine docId oder createdBy ID.");
  }


  /**
   * Cancels the edit mode for the given message.
   * @param message The message to cancel the edit mode for, represented as a partial message object.
   */
  cancelEdit(message: Partial<Message>) {
    let messageText = sessionStorage.getItem('EditedMessage');
    message.message = messageText as string;
    message.sameDay = false;    
    this.editAcitve = false;
  }


  /**
   * Opens the edit dialog for the given message.
   * @param message The message to edit, represented as a partial message object.
   * @param deleteMessage Whether the delete button should be shown in the edit dialog.
   * @param inlineEdit Whether to edit the message inline or not. Defaults to `false`.
   */
  editMessage(message: Partial<Message>, deleteMessage: boolean, inlineEdit = false) {
    if (inlineEdit === true) {
      this.editAcitve = true;
      sessionStorage.setItem('EditedMessage', message.message as string);
      message.sameDay = true;
    } else if (deleteMessage === true) {
      this.dialog.open(EditmessageComponent, {
        width: 'fit-content',
        maxWidth: '100vw',
        height: 'fit-content',
        data: { message, deleteMessage },
      });
    }
  }


  /**
   * Checks whether the window width is greater than 400px.
   * @returns true if the window width is greater than 400px, false otherwise.
   */
  checkWidth() {
    if (window.innerWidth > 400) {return true} else return false;
  }


  /**
   * Checks whether a thread message has answers and whether the window width is smaller than 400px.
   * @param message The message to check, represented as a partial message object.
   * @returns true if the message has answers and the window width is smaller than
   */
  ckeckThredMessageAndWidth(message:any) {
    let length;
    if (message.threadMessages$._value.length !== 0) 
      length = message.threadMessages$._value.length
    else 
      return null
    if (length > 0 && window.innerWidth < 400) {return true} else return false;
  }
}
