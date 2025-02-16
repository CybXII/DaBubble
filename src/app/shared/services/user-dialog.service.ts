import { EventEmitter, inject, Injectable, Output, signal } from '@angular/core';
import { AuthService } from './auth.service';
import { FormBuilder, Validators } from '@angular/forms';
import { ToastMessageService } from './toastmessage.service';
import { UserModel } from '../../models/user';

@Injectable({
  providedIn: 'root'
})
export class UserDialogService {
  profileDialog: boolean = false;
  profileDialogEdit: boolean = false;
  dialog = false;
  authService = inject(AuthService);
  profileDataChanged = signal<boolean>(false);
  @Output() dialogChange = new EventEmitter<boolean>();
  profileForm;
  exitActiv = true;

  /**
   * Constructs an instance of the UserDialogService.
   * @param auth - The AuthService for authentication operations.
   * @param toastMessageService - The ToastMessageService for showing toast messages.
   * @param fb - The FormBuilder for creating the profileForm.
   */
  constructor(private auth: AuthService, private toastMessageService: ToastMessageService, private fb: FormBuilder,) {
    this.profileForm = this.fb.group({
      userInputName: [
        this.userData?.name,[
          Validators.required,
          Validators.pattern('^[a-zA-ZÀ-ÿ]+(?:-[a-zA-ZÀ-ÿ]+)?(?: [a-zA-ZÀ-ÿ]+(?:-[a-zA-ZÀ-ÿ]+)?)$'),
          Validators.maxLength(25),
        ],
      ],
      userInputEmail: [
        this.userData?.email,[
          Validators.required,
          Validators.pattern('^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$'),
        ],
      ],
    });
  }


  /**
   * Opens the user dialog with the mobile layout.
   *
   * @param event The event that triggered opening the dialog.
   */
  openDialog(event: Event) {
    this.dialog = true;
    this.exitActiv = true;
  }


  /**
   * Opens the user profile dialog.
   * Sets `profileDialog` to true and `dialog` to false. 
   * This method transitions the UI from a general dialog to a specific 
   * profile dialog, allowing the user to view profile-related information.
   */
  openProfile() {
    this.profileDialog = true;
    this.dialog = false;
  }


  /**
   * Opens the user profile dialog in edit mode.
   *
   * @description
   * Sets `profileDialog` to false and `profileDialogEdit` to true.
   * Resets the form to the current user data.
   */
  openProfileEdit() {
    this.profileDialog = false;
    this.profileDialogEdit = true;
    this.profileForm.reset({
      userInputName: this.userData?.name,
      userInputEmail: this.userData?.email,
    });
  }


  /**
   * Closes the profile dialog in edit mode and reopens the profile dialog.
   *
   * This method sets `profileDialog` to true and `profileDialogEdit` to false,
   * effectively transitioning the UI from edit mode back to the normal profile view.
   */
  closeProfileEdit() {
    this.profileDialog = true;
    this.profileDialogEdit = false;
  }


  /**
   * Closes the profile dialogs (profile and profile edit) and reopens the dialog.
   *
   * @description
   * This method sets `profileDialog` and `profileDialogEdit` to false,
   * effectively closing the profile dialogs, and sets `dialog` to true,
   * reopening the dialog.
   *
   * @param event The event that triggered the dialog close action.
   */
  closeProfileDialogs(event: Event) {
    event?.preventDefault();
    this.profileDialog = false;
    this.profileDialogEdit = false;
    this.dialog = true;
  }


  /**
   * Closes all dialogs by preventing the default event behavior and
   * setting their respective boolean flags to false. This includes the
   * dialog, profileDialog, and profileDialogEdit.
   * @param event The event that triggered the dialog close action.
   */
  closeDialog(event: Event) {
    event?.preventDefault();
    event.stopPropagation();
    this.profileDialog = false;
    this.profileDialogEdit = false;
    this.dialog = false;
  }


  /**
   * Handles changes to the dialog open state.
   * @param newValue A boolean indicating whether the dialog should be open (true) or closed (false).
   */
  onDialogChange(newValue: boolean) {
    this.dialog = newValue;
    console.log(newValue);
  }


  /**
   * Saves the profile form data to the user's Firestore document.
   *
   * @description
   * This method checks if the profile form is valid and if the user data is available.
   * If both conditions are met, it uses the `updateUserData` method of the `AuthService` to
   * update the user's Firestore document with the new data. If the update is successful, it
   * sets the `profileDialog` and `profileDialogEdit` flags to false, emits the `dialogChange`
   * event, and displays a toast message indicating that the profile was successfully updated.
   * If the update fails, it logs an error message to the console.
   * @returns A promise that resolves when the update operation is complete.
   */
  async saveProfile(): Promise<void> {
    if (this.profileForm.valid && this.userData) {
      const updatedData: Partial<UserModel> = {
        name: this.profileForm.value.userInputName ?? '',
        email: this.profileForm.value.userInputEmail ?? undefined,
      };
      try {
        await this.authService.updateUserData(this.userData.userId, updatedData);
        this.profileDialog = false;
        this.profileDialogEdit = false;
        this.dialogChange.emit();
        this.toastMessageService.showToastSignal('Profil erfolgreich aktualisiert');
      } catch (error) {
        console.error('Fehler beim Speichern der Profiländerungen:', error);
      }
    }
  }


  /**
   * Retrieves the current user data from the AuthService.
   * 
   * @returns The user data as a UserModel object.
   */
  get userData() {
    return this.authService.userData();
  }


  /**
   * Checks if the profile form data differs from the current user data.
   *
   * @description
   * Compares the values in the profile form's input fields for name and email
   * with the current user data. If either value has changed, sets the 
   * `profileDataChanged` flag to true. Otherwise, sets the flag to false.
   */
  profileDataChange() {
    if (
      (this.userData?.name ?? '') !=(this.profileForm.get('userInputName')?.value ?? '') || 
      (this.userData?.email ?? '') !=(this.profileForm.get('userInputEmail')?.value ?? '')
    ) 
      this.profileDataChanged.set(true);
    else 
      this.profileDataChanged.set(false);
  }


  /**
   * Prevents the default event behavior and stops the event propagation.
   * This method is used to prevent the dialog from closing when the user clicks
   * on an element that is not supposed to close the dialog, such as a button that
   * opens a sub-menu.
   * @param event The event that triggered the action.
   */
  dontCloseDialog(event: Event) {
    event?.preventDefault();
    event.stopPropagation();
  }


  /**
   * Logs the user out of the application, removes the token and introPlayed flag from
   * session storage, and navigates to the login page.
   */
  logout() {
    this.dialog = false;
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('introPlayed');
    this.auth.logout();
  }


  /**
   * Checks if the user's data can be changed.
   * 
   * If the user's provider is not 'password', the profile form is disabled,
   * meaning the user cannot change their data. Otherwise, the form is enabled.
   */
  dataChangeAllowedCheck() {
    if (this.userData?.provider != 'password') 
      this.profileForm.disable();
    else
      this.profileForm.enable();
  }
}
