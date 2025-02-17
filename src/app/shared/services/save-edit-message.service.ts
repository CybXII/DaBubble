import { Injectable } from '@angular/core';
import { MessagesService } from './messages.service';
import { AuthService } from './auth.service';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ToastMessageService } from './toastmessage.service';

@Injectable({
  providedIn: 'root'
})
export class SaveEditMessageService {
  messageForm: FormGroup;

  /**
   * Constructor for the SaveEditMessageService.
   * @param fb A FormBuilder instance, used to create the messageForm.
   * @param messagesService A MessagesService instance, used to save the message.
   * @param auth An AuthService instance, used to get the current user.
   * @param toastMessageService A ToastMessageService instance, used to show toast messages.
   */
  constructor(
    private fb: FormBuilder,
    private messagesService: MessagesService,
    private auth: AuthService,
    private toastMessageService: ToastMessageService,
  ) {
    this.messageForm = this.fb.group({
      message: ['', Validators.required],
      reactions: [''],
    });
  }

  /**
   * Checks if the current user is the creator of the given message and then calls `checkUpdateData` to update the message.
   * @param message The message to be updated.
   * @param thread If true, the message is a thread.
   * @param parentMessageId The ID of the parent message if the message is a thread.
   * @param docId The ID of the message document.
   */
  save(message: any, thread: boolean, parentMessageId?: string, docId?: string) {
    this.messageForm.setValue({
      message: message.message || '',
      reactions: message.reactions || [],
    });
    if (this.checkCreatorWithActiveUser(message.createdBy)) {
      this.checkUpdateData(message, thread, parentMessageId, docId);
    } else if (!this.checkCreatorWithActiveUser(message.createdBy)) {
      console.error('Nur der Ersteller kann die Nachricht bearbeiten.');
    }
  }


  /**
   * Updates the message data in Firestore based on the provided parameters.
   * @param message The original message data to be updated.
   * @param thread A boolean indicating if the message is a thread.
   * @param parentMessageId The ID of the parent message if the message is a thread.
   * @param docId The document ID of the message in Firestore.
   */
  checkUpdateData(message: any, thread: boolean, parentMessageId?: string, docId?: string) {
    const updatedData = { ...message, ...this.messageForm.value, };
    if (thread) {
      if (!parentMessageId)
        return console.error('Fehlende parentMessageId für Thread-Nachricht');
      this.messagesService.updateThreadMessage(
        parentMessageId, docId!, this.auth.userId()!, updatedData)
        .then(() => { this.showToastMessage('Nachricht aktualisiert'); })
        .catch((error) => { console.error('Fehler beim Aktualisieren der Thread-Nachricht:', error); });
    } else {
      this.messagesService.updateMessage(updatedData.docId, updatedData.createdBy, updatedData)
        .then(() => { this.showToastMessage('Nachricht aktualisiert'); })
        .catch((error) => { console.error('Fehler beim Aktualisieren der Nachricht:', error); });
    }
  }

  /**
   * Checks if the user stored in the message data equals the active user ID.
   * This is used to check if the user is allowed to edit or delete the message.
   * @param creater The user ID from the message data.
   * @returns {boolean} - `true` if the user equals the active user, `false` otherwise.
   */
  checkCreatorWithActiveUser(creater: string): boolean {
    const dataUser = creater;
    const activeUser = this.auth.userId();
    return dataUser === activeUser;
  }

  /**
   * Shows a toast message with the given text after a short delay.
   * @param {string} text - The text to be displayed in the toast message.
   * @returns {void}
   */
  showToastMessage(text: string) {
    setTimeout(() => {
      this.toastMessageService.showToastSignal(text);
    }, 500);
  }
}
