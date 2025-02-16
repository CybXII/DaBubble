import { Component,Inject  } from '@angular/core';
import { MessagesService } from '../../../shared/services/messages.service';
import { Message, ThreadMessage } from '../../../models/message';
import { AuthService } from '../../../shared/services/auth.service';
import { FormBuilder, FormGroup, Validators,ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { ToastMessageService } from '../../../shared/services/toastmessage.service';
@Component({
  selector: 'app-editmessage',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './editmessage.component.html',
  styleUrl: './editmessage.component.scss'
})
export class EditmessageComponent {
  messageForm: FormGroup;
  messageDelete: boolean;
  isThread: boolean;

  /**
   * Constructs an instance of the EditmessageComponent.
   * @param fb - FormBuilder service used to create a FormGroup for the message form.
   * @param messagesService - Service for managing message operations.
   * @param auth - AuthService for authentication operations.
   * @param dialogRef - Reference to the dialog containing this component.
   * @param toastMessageService - Service for displaying toast messages.
   * @param data - Injected data containing the message details, including:
   * Initializes the `messageForm` with empty message and reactions fields.
   * Sets `isThread` and `messageDelete` properties based on the injected data.
   * Logs an error if the message is a thread but `parentMessageId` is missing.
   */
  constructor(
    private fb: FormBuilder,
    private messagesService: MessagesService,
    private auth: AuthService,
    public dialogRef: MatDialogRef<EditmessageComponent>,
    private toastMessageService: ToastMessageService,
    @Inject(MAT_DIALOG_DATA) public data: { 
      message: Partial<Message>; 
      deleteMessage: boolean; 
      thread: boolean; 
      parentMessageId?: string; 
      docId?: string 
    }
  ) {
    this.isThread = this.data.thread;
    this.messageDelete = this.data.deleteMessage;
    this.messageForm = this.fb.group({
      message: ['', Validators.required],
      reactions: [''],
    });
    if (this.isThread && !this.data.parentMessageId) {
      console.error('parentMessageId fehlt für Thread-Nachricht');
    }
  }


  /**
   * Initializes the component by setting the initial form values for the message form.
   * These values are retrieved from the injected data.
   * If the message is a thread, the parent message ID is not set in the form.
   */
    ngOnInit(): void {
      this.messageForm.setValue({
        message: this.data.message.message || '',
        reactions: this.data.message.reactions || [],
      });
    }


  /**
   * Handles the submission of the message form.
   * Checks if the form is valid and if the current user is the creator of the message.
   * If both conditions are met, it updates the message with the new data.
   * If the message is a thread, it calls `initThreadMessageOnSubmit` to update the thread,
   * otherwise it calls `initiMessageOnSubmit` to update the main message.
   * If the form is invalid or the user is not the creator, it logs an error message.
   */
    onSubmit(): void {
      if (this.messageForm.valid && this.checkCreatorWithActiveUser()) {
        const updatedData = {...this.data.message,...this.messageForm.value};
        if (this.isThread) {
          if (!this.data.parentMessageId) 
            return console.error('Fehlende parentMessageId für Thread-Nachricht');
          this.initThreadMessageOnSubmit(updatedData);
        } else 
          this.initiMessageOnSubmit(updatedData);
      } else if (!this.messageForm.valid) 
        console.error('Formular ist ungültig.');
      else if (!this.checkCreatorWithActiveUser()) 
        console.error('Nur der Ersteller kann die Nachricht bearbeiten.');
    }


  /**
   * Updates the message with the new data in Firestore.
   * Resets the form and closes the dialog after a successful update.
   * If the message does not have a docId, it will not be updated.
   * @param updatedData The updated message data.
   */
  initiMessageOnSubmit(updatedData: Message) {
    if (updatedData.docId) {
      this.messagesService.updateMessage(updatedData.docId, updatedData.createdBy, updatedData)
      .then(() => {
        this.messageForm.reset();
        this.dialogRef.close();
        this.showToastMessage('Nachricht aktualisiert');
      })
      .catch((error) => {
        console.error('Fehler beim Aktualisieren der Nachricht:', error);
      });
    }
  }


  /**
   * Updates the thread message with the new data in Firestore.
   * Resets the form and closes the dialog after a successful update.
   * If the message does not have a docId, it will not be updated.
   * @param updatedData The updated thread message data.
   */
  initThreadMessageOnSubmit(updatedData: ThreadMessage) {
    if (this.data.parentMessageId) {
      this.messagesService.updateThreadMessage(
        this.data.parentMessageId,
        this.data.docId!,
        this.auth.userId()!,
        updatedData
      )
        .then(() => {
          this.dialogRef.close();
          this.showToastMessage('Nachricht aktualisiert');
        })
        .catch((error) => {
          console.error('Fehler beim Aktualisieren der Thread-Nachricht:', error);
        })
    }
  }


  /**
   * Checks if the user stored in the message data equals the active user ID.
   * This is used to check if the user is allowed to edit or delete the message.
   * @returns {boolean} - `true` if the user equals the active user, `false` otherwise.
   */
  checkCreatorWithActiveUser(): boolean {
    const dataUser = this.data.message.createdBy;
    const activeUser = this.auth.userId();
    return dataUser === activeUser; 
  }


  /**
   * Deletes the message based on the provided data in the Firestore DB.
   * The message can only be deleted by the creator of the message.
   * Depending on the message type, either a thread message or a main message will be deleted.
   * @returns {void}
   */
  deleteMessage(): void {
    if (!this.checkCreatorWithActiveUser()) {
      return console.log('Nur der Ersteller kann die Nachricht löschen.');
    }
    const { docId, parentMessageId } = this.data;
    if (this.isThread) {
      this.deleteThreadMessage(docId, parentMessageId);
    } else {
      this.deleteMainMessage();
    }
  }


  /**
   * Deletes the main message in the Firestore DB.
   * The message can only be deleted by the creator of the message.
   * @returns {void}
   */
  deleteMainMessage(){
    const deleteMessage = this.data.message.docId;
    if (!deleteMessage) {
      return console.error('DocId fehlt für das Löschen der Nachricht.');
    }
    this.messagesService.deleteMessage(deleteMessage, this.auth.userId()!).then(() => {
        this.dialogRef.close();
        this.showToastMessage('Nachricht erfolgreich gelöscht');
      })
      .catch((error) => {console.error('Fehler beim Löschen der Nachricht:', error);});
  }


  /**
   * Deletes a thread message in the Firestore DB.
   * The message can only be deleted by the creator of the message.
   * @param {string} docId - The ID of the document (thread message) to be deleted.
   * @param {string} parentMessageId - The ID of the parent message to which the thread message belongs.
   * @returns {void}
   */
  deleteThreadMessage(docId?: string, parentMessageId?: string) {
    if (!docId || !parentMessageId) 
      return console.error('DocId oder ParentMessageId fehlt für das Löschen der Thread-Nachricht.');
    this.messagesService.deleteMessage(docId, this.auth.userId()!, true, parentMessageId)
      .then(() => {
        this.dialogRef.close();
        this.showToastMessage('Nachricht erfolgreich gelöscht');
      })
      .catch((error) => {console.error('Fehler beim Löschen der Thread-Nachricht:', error);});
  }


  /**
   * Shows a toast message with the given text after a short delay.
   * @param {string} text - The text to be displayed in the toast message.
   * @returns {void}
   */
  showToastMessage(text:string) {
    setTimeout(() => {
      this.toastMessageService.showToastSignal(text);
    }, 500);
  }

  
  /**
   * Cancels the edit mode and closes the dialog.
   * Resets the message form.
   * @returns {void}
   */
  onCancel(): void { 
    console.log('Edit cancelled');
    this.messageForm.reset();
    this.dialogRef.close(); 
  }


  /**
   * Checks the key status of the given event and performs the corresponding action.
   * If the user presses the Enter key without holding down the Shift key, the function
   * performs the action depending on the given chat type.
   * If `chat === 'save'`, the function calls `onSubmit()`.
   * If `chat === 'deleteMessage'`, the function calls `deleteMessage()`.
   * @param event The event to check the key status from.
   * @param chat The type of chat to check against.
   */
  checkKeyStatus(event: KeyboardEvent, chat: string): void {
    if (event.shiftKey && event.keyCode == 13) {
      event.preventDefault();
    } else if (event.keyCode == 13) {
      if (chat === 'save') {
        this.onSubmit();
      } else if (chat === 'deleteMessage') {
        this.deleteMessage();
      }
    }
  }
}
