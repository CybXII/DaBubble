import {
  ChangeDetectionStrategy,
  Component,
  Input,
  OnInit,
  OnDestroy,
  EventEmitter,
  Output,
  ViewChild,
  ElementRef,
  ChangeDetectorRef
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

@Component({
  selector: 'app-parent-message',
  standalone: true,
  imports: [CommonModule, EmojiPickerComponent, ReactionsComponent, RelativeDatePipe],
  templateUrl: './parent-message.component.html',
  styleUrls: ['./parent-message.component.scss', '../chatbox/chatbox.component.scss'],
  changeDetection: ChangeDetectionStrategy.Default,
})
export class ParentMessageComponent implements OnInit, OnDestroy {
  @ViewChild('emojiPickerContainer', { static: false }) emojiPickerContainer!: ElementRef;
  @Input() activeMessageId!: string;
  @Input() parentMessage!: Partial<Message>;
  @Input() activeUserId!: string;
  @Output() userClicked = new EventEmitter<string>();
  private subscriptions: Subscription = new Subscription();
  isEmojiPickerOpen: boolean = false;
  displayPickerBottom: boolean = false;

  /**
   * Constructor for the ParentMessageComponent.
   * @param messagesService - Service for handling message operations.
   * @param emojiPickerService - Service for handling emoji picker functionalities.
   * @param userService - Service for user-related operations.
   * @param emojiStorageService - Service for storing and retrieving emoji data.
   * @param cdr - Service for detecting changes and updating the view.
   */
  constructor(
    private messagesService: MessagesService,
    public emojiPickerService: EmojiPickerService,
    public userService: UserService,
    private emojiStorageService: EmojiStorageService,
    private cdr: ChangeDetectorRef
  ) {}

  
  /**
   * Initializes the component by subscribing to the activeParentPicker$ observable of the EmojiPickerService.
   * When the observable emits a value, the isEmojiPickerOpen property is updated to true if the emitted value is equal to the parentMessage.docId.
   * The ChangeDetectorRef is used to update the view when the isEmojiPickerOpen property changes.
   */
  ngOnInit(): void {
    this.subscriptions.add(
      this.emojiPickerService.activeParentPicker$.subscribe((id) => {
        this.isEmojiPickerOpen = id === this.parentMessage.docId;
        this.cdr.detectChanges();
      })
    );
  }


  /**
   * Lifecycle hook that is called when the component is destroyed.
   * Unsubscribes from all active subscriptions to prevent memory leaks.
   */
  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }


  /**
   * Toggles the emoji picker for the parent message.
   * 
   * If the emoji picker for the current parent message is already open, it closes all emoji pickers.
   * Otherwise, it first closes all emoji pickers and then opens the emoji picker for the current parent message.
   * 
   * The method checks if the `parentMessage` has a `docId` before performing any actions.
   */
  toggleEmojiPicker() {
    if (this.parentMessage.docId){
      if (this.emojiPickerService.isParentMessageEmojiPickerOpen(this.parentMessage.docId)) {
        this.emojiPickerService.closeAllEmojiPickers();
      }
      this.emojiPickerService.closeAllEmojiPickers();
      this.emojiPickerService.openParentMessageEmojiPicker(this.parentMessage.docId);
    }
  }


  /**
   * Checks if the emoji picker is open for the current parent message.
   *
   * This method uses the EmojiPickerService to determine if the emoji picker
   * is currently open for the parent message associated with this component.
   *
   * @returns {boolean} True if the emoji picker is open for the parent message, false otherwise.
   */
  isEmojiPickerOpenForThisMessage(): boolean {
    return this.emojiPickerService.isParentMessageEmojiPickerOpen(this.parentMessage.docId??'');
  }


  /**
   * Returns an observable that emits the name of the user with the given user ID.
   * @param userId The user ID to retrieve the name for.
   * @returns An observable that emits the user name.
   */
  getUserName(userId: string) {
    return this.userService.getuserName(userId);
  }


  /**
   * Retrieves the avatar URL of a user given their ID.
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
   * Emits the user ID if it does not match the active user ID.
   *
   * This method is used to handle user clicks. It checks if the given user ID
   * is different from the active user ID. If so, it emits the user ID through
   * the `userClicked` event emitter.
   *
   * @param userId The user ID to check against the active user ID.
   */
  checkIdIsUser(userId: string) {
    if (this.activeUserId !== userId) {
      this.userClicked.emit(userId);
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
   * Adds an emoji to a parent message.
   *
   * This method creates a new reaction with the given emoji and user ID, adds it to the reactions
   * array of the message, and updates the message with the new reactions array. It then closes all
   * emoji pickers for the parent message and saves the emoji in the EmojiStorageService.
   *
   * @param messageId The ID of the message to add the emoji to.
   * @param userId The ID of the user who added the emoji.
   * @param emoji The emoji to add.
   */
  addEmoji(messageId: string, userId: string, emoji: string): void {
    const reaction: Reaction = { emoji, userIds: [userId] };
    const updateData: Partial<Message> = { reactions: [reaction] };
    this.messagesService.updateMessage(messageId, userId, updateData)
      .then(() => {this.emojiPickerService.closeAllParentPickers()})
      .catch(error => console.error('❌ Fehler beim Hinzufügen der Reaktion:', error));
    this.emojiStorageService.saveEmoji(emoji);
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
}
