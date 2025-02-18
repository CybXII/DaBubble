import {
  ChangeDetectionStrategy,
  Component,
  Input,
  OnInit,
  OnDestroy,
  EventEmitter,
  Output,
  ChangeDetectorRef,
  ViewChild,
  ElementRef
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { EmojiPickerComponent } from '../emoji-picker/emoji-picker.component';
import { EmojiPickerService } from '../../../shared/services/emoji-picker.service';
import { MessagesService } from '../../../shared/services/messages.service';
import { UserService } from '../../../shared/services/user.service';
import { EmojiStorageService } from '../../../shared/services/emoji-storage.service';
import { Message, ThreadMessage, Reaction } from '../../../models/message';
import { Subscription } from 'rxjs';
import { ReactionsComponent } from '../../../shared/reactions/reactions.component';
import { MatDialog } from '@angular/material/dialog';
import { FormsModule } from '@angular/forms';
import { UserDialogService } from '../../../shared/services/user-dialog.service';
import { EditmessageComponent } from '../editmessage/editmessage.component';

@Component({
  selector: 'app-thread-messages',
  standalone: true,
  imports: [CommonModule, EmojiPickerComponent, ReactionsComponent, FormsModule],
  templateUrl: './threadmessages.component.html',
  styleUrls: ['./threadmessages.component.scss', '../chatbox/chatbox.component.scss'],
  changeDetection: ChangeDetectionStrategy.Default,
})
export class ThreadMessagesComponent implements OnInit, OnDestroy {
  @ViewChild('editTextArea') editTextArea!: ElementRef<HTMLTextAreaElement>;
  @Input() threadMessage!: ThreadMessage;
  @Input() activeUserId!: string;
  @Input() activeMessageId!: string;
  @Output() userClicked = new EventEmitter<string>();
  private subscriptions: Subscription = new Subscription();
  isEmojiPickerOpen: boolean = false;  displayPickerBottom: boolean = false;
  editAcitve: boolean = false;

    /**
     * Constructs a new instance of the ThreadMessagesComponent.
     *
     * @param messagesService - Service for handling message operations.
     * @param emojiPickerService - Service for handling emoji picker functionalities.
     * @param userService - Service for user-related operations.
     * @param emojiStorageService - Service for storing and retrieving emoji data.
     * @param dialog - Angular Material service for dialog operations.
     * @param cdr - Service for detecting changes and updating the view.
     * @param uds - Service for managing user dialogs.
     */
  constructor(
    private messagesService: MessagesService,
    public emojiPickerService: EmojiPickerService,
    public userService: UserService,
    private emojiStorageService: EmojiStorageService,
    public dialog: MatDialog,
    private cdr: ChangeDetectorRef,
    private uds: UserDialogService,
  ) {}


  /**
   * Initializes the component by subscribing to the activeThreadMessagePicker$ observable of the EmojiPickerService.
   * When the observable emits a value, the isEmojiPickerOpen property is updated to true if the emitted value is equal to the threadMessage.docId.
   * The ChangeDetectorRef is used to update the view when the isEmojiPickerOpen property changes.
   */
  ngOnInit(): void {
    this.subscriptions.add(
      this.emojiPickerService.activeThreadMessagePicker$.subscribe((id) => {
        this.isEmojiPickerOpen = id === this.threadMessage.docId;
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
   * Toggles the emoji picker for a thread message.
   * 
   * If the emoji picker for the current thread message is already open, it closes all emoji pickers.
   * Otherwise, it first closes all emoji pickers and then opens the emoji picker for the current thread message.
   * 
   * The method checks if the `threadMessage` has a `docId` before performing any actions.
   */
  toggleEmojiPicker() {
    if (this.threadMessage.docId) {
      if (this.emojiPickerService.isThreadMessageEmojiPickerOpen(this.threadMessage.docId)) {
        this.emojiPickerService.closeAllEmojiPickers();
      }
      this.emojiPickerService.closeAllEmojiPickers();
      this.emojiPickerService.openThreadMessageEmojiPicker(this.threadMessage.docId);
    }
  }


  /**
   * Checks if the emoji picker is open for the current thread message.
   *
   * This method uses the EmojiPickerService to determine if the emoji picker
   * is currently open for the thread message associated with this component.
   *
   * @returns {boolean} True if the emoji picker is open for the thread message, false otherwise.
   */
  isEmojiPickerOpenForThisMessage(): boolean {
    return this.emojiPickerService.isThreadMessageEmojiPickerOpen(this.threadMessage.docId??'');
  }


  /**
   * Returns an observable that emits the name of the user with the given user ID.
   *
   * This method uses the UserService to retrieve the user name associated with the given user ID.
   *
   * @param userId The user ID to retrieve the name for.
   * @returns An observable that emits the user name.
   */
  getUserName(userId: string) {
    return this.userService.getuserName(userId);
  }


  /**
   * Returns an observable that emits the avatar URL of the user with the given user ID.
   * 
   * This method uses the UserService to retrieve the avatar URL associated with the given user ID.
   * 
   * @param userId The user ID to retrieve the avatar URL for.
   * @returns An observable that emits the avatar URL.
   */
  getUserAvatar(userId: string) {
    return this.userService.getuserAvatar(userId);
  }


  /**
   * Handles a user click event in the thread message component.
   * 
   * If the given user ID does not match the active user ID, it emits the user ID to the parent component
   * to open the user profile dialog.
   * 
   * If the given user ID matches the active user ID, it opens the profile dialog with the active user's profile
   * and sets the exit activity flag to false.
   * 
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
   * Retrieves the last used emojis stored in the EmojiStorageService.
   *
   * This method uses the EmojiStorageService to retrieve the last used emojis
   * and returns the emoji at the given index.
   *
   * @param index The index of the emoji to retrieve.
   * @returns The emoji at the given index.
   */
  getLastUsedEmojis(index: number) {
    return this.emojiStorageService.getEmojis()[index];
  }


  /**
   * Handles the addition of an emoji to a thread message.
   *
   * If the edit mode is active, it adds the emoji to the text area.
   * If the edit mode is not active, it adds the emoji to the reactions of the message.
   *
   * @param messageId The ID of the message to add the emoji to.
   * @param userId The ID of the user who added the emoji.
   * @param emoji The emoji to add.
   */
  addEmoji(messageId: string, userId: string, emoji: string): void {
    if(this.editAcitve)
      this.addEmojiToTextArea(emoji);
    else 
      this.addEmojiToReactions(emoji ,userId ,messageId);
  }


  /**
   * Adds an emoji to the reactions of a thread message.
   * 
   * It creates a new reaction object with the given emoji and user ID, and adds it to the reactions
   * array of the message. It then updates the message with the new reactions array and closes the
   * emoji picker.
   * 
   * @param emoji The emoji to add as a reaction.
   * @param userId The ID of the user who added the emoji.
   * @param messageId The ID of the message to add the emoji to.
   */
  addEmojiToReactions(emoji: string , userId: string, messageId: string) {
    const reaction: Reaction = { emoji, userIds: [userId] };
    const updateData: Partial<Message> = { reactions: [reaction] };
    this.messagesService.updateThreadMessage(this.activeMessageId!, messageId, userId, updateData)
      .then(() => {this.emojiPickerService.closeAllThreadMessagePickers();})
      .catch(error => console.error('❌ Fehler beim Hinzufügen der Reaktion:', error));
    this.emojiStorageService.saveEmoji(emoji);
  }


  /**
   * Adds an emoji to the text area in edit mode.
   * 
   * It adds the emoji at the current cursor position in the text area.
   * If the cursor position is not recognized, it adds the emoji to the end
   * of the text area.
   * 
   * @param emoji The emoji to add.
   */
  addEmojiToTextArea(emoji: string): void {
    const textArea = this.editTextArea.nativeElement;
    const startPos = textArea.selectionStart;
    const endPos = textArea.selectionEnd; 
    if (startPos === null || endPos === null) {
      console.error("❌ Fehler: Cursor-Position nicht erkannt.");
      this.threadMessage.message += emoji;
      this.emojiPickerService.closeAllMessagePickers();
    } else {
      this.setEmojjiIntoTextArea(textArea, startPos, endPos,emoji);
    }
    this.emojiPickerService.closeAllThreadMessagePickers();
  }


  /**
   * Sets the emoji into the text area at the given start and end position.
   * It adds the emoji by slicing the text into three parts and concatenating
   * them together with the emoji in the middle.
   * It then focuses the text area and sets the cursor position to the end of
   * the just added emoji.
   * @param textArea The text area to add the emoji to.
   * @param startPos The start position of the emoji.
   * @param endPos The end position of the emoji.
   * @param emoji The emoji to add.
   */
  setEmojjiIntoTextArea(textArea: HTMLTextAreaElement, startPos: number, endPos: number,emoji: string): void {
    const newText = 
    this.threadMessage.message.substring(0, startPos) + emoji + 
    this.threadMessage.message.substring(endPos);
    this.threadMessage.message = newText;
    setTimeout(() => {
      textArea.focus();
      textArea.selectionStart = textArea.selectionEnd = startPos + emoji.length;
    }, 0);
  }


  /**
   * Prevents the emoji picker from closing when a click event occurs.
   * 
   * This method is used to prevent the emoji picker from closing when a click event occurs
   * outside of the emoji picker component. It stops the event propagation to prevent the
   * emoji picker from closing.
   * 
   * @param event The click event to prevent from propagating.
   */
  preventEmojiPickerClose(event: Event): void {
    event.stopPropagation();
  }


  /**
   * Activates edit mode for the given message.
   *
   * This method sets the edit mode to active, stores the message content in session storage,
   * and marks the message as edited on the same day.
   *
   * @param message The message to be edited, represented as a partial message object.
   */
  editMessage(message: Partial<Message> ,deleteMessage:boolean) {
    if(deleteMessage){
      this.dialog.open(EditmessageComponent, {
        width: 'fit-content',
        maxWidth: '100vw',
        height: 'fit-content',
        data: { message, deleteMessage, thread: true, parentMessageId: this.activeMessageId },
      });
    } else {
      this.editAcitve = true;
      sessionStorage.setItem('EditedMessage', message.message as string);
      message.sameDay = true;  
    }
  }


  /**
   * Cancels the edit mode for the given message.
   *
   * This method resets the message content to the original value stored in session storage,
   * marks the message as not edited on the same day, and deactivates the edit mode.
   *
   * @param message The message to cancel the edit mode for, represented as a partial message object.
   */
  cancelEdit(message: Partial<Message>) {
    let messageText = sessionStorage.getItem('EditedMessage');
    message.message = messageText as string;
    message.sameDay = false;
    this.editAcitve = false;
  }


  /**
   * Saves the edited content of a thread message.
   *
   * This method retrieves the original thread message from Firestore using the given
   * `parentMessageId` and `threadMessage.docId`. If the original message is found, it updates
   * the message content with the new text provided in `threadMessage.message`. The method also
   * ensures that the thread message has a valid `docId` before attempting to update it.
   *
   * If the editing is successful, the edit mode is deactivated.
   *
   * @param threadMessage The partial thread message object containing the updated message content.
   * @param parentMessageId The ID of the parent message to which the thread message belongs.
   */
  saveEdit(threadMessage: Partial<ThreadMessage>, parentMessageId: string) {
    if (!threadMessage.docId) 
      return console.error("❌ Fehler: Thread-Nachricht hat keine docId.");
    this.messagesService.getThreadMessage(parentMessageId, threadMessage.docId).then(originalThreadMessage => {
      if (!originalThreadMessage) 
        return console.error("❌ Fehler: Thread-Nachricht nicht gefunden in Firestore:", threadMessage.docId);
      const updateData: Partial<ThreadMessage> = {
        message: threadMessage.message,
      };
      if (threadMessage.docId && originalThreadMessage.createdBy) {
        this.messagesService.updateThreadMessage(parentMessageId, threadMessage.docId, originalThreadMessage.createdBy, updateData)
        .then().catch(error => {console.error("❌ Fehler beim Speichern der Thread-Nachricht:", error);});
      }
    });
    this.editAcitve = false;
  }
}
