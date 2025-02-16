import { Injectable, signal } from '@angular/core';
import { Firestore, collection, deleteDoc, doc, getDoc, onSnapshot, updateDoc,  } from '@angular/fire/firestore';
import { BehaviorSubject, Observable, firstValueFrom, from } from 'rxjs';
import { map } from 'rxjs/operators';
import { UserModel } from '../../models/user';
import { confirmPasswordReset, sendPasswordResetEmail, updatePassword, User } from 'firebase/auth';
import { Auth, updateEmail, updateProfile } from '@angular/fire/auth';
import { Message, ThreadMessage } from '../../models/message';

export interface CustomUser {
  userId: string;
  name: string;
  photoURL: string;
  email: string;
  status: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class UserService {
  private userCache = new Map<string, BehaviorSubject<CustomUser>>();
  private usersSubject = new BehaviorSubject<CustomUser[]>([]);
  users$ = this.usersSubject.asObservable();
  loginError = signal<string>('');


  /**
   * Initializes the UserService.
   * @param {Firestore} firestore Firestore database service.
   */
  constructor(private firestore: Firestore,private auth: Auth) {
    this.listenToUserChanges();
  }


  /**
   * Listens to changes in the Firestore 'users' collection in real-time.
   * Updates the user cache and emits the updated list of users through the usersSubject observable.
   */
  private listenToUserChanges() {
    const usersCollection = collection(this.firestore, 'users');
    onSnapshot(usersCollection, (snapshot) => {
      const users = snapshot.docs.map((doc) => {
        const data = doc.data() as CustomUser;
        return { ...data };
      });
      users.forEach((user) => {
        if (this.userCache.has(user.userId)) 
          this.userCache.get(user.userId)!.next(user);
        else 
          this.userCache.set(user.userId, new BehaviorSubject<CustomUser>(user));
      });
      this.usersSubject.next(users);
    });
  }


  /**
   * Returns an observable that emits the user data for the given user ID.
   * @param {string} userId The ID of the user to retrieve the data for.
   * @returns An observable that emits the user data.
   */
  getUserById(userId: string): Observable<CustomUser> {
    if (this.userCache.has(userId)) return this.userCache.get(userId)!.asObservable();
    const userSubject = this.createUserBehaviorSubject(userId);
    this.userCache.set(userId, userSubject);
    from(getDoc(doc(this.firestore, `users/${userId}`)))
      .pipe(map((docSnap) => {
          if (docSnap.exists()) {
            const userData = { userId, ...docSnap.data() } as CustomUser;
            userSubject.next(userData);
          }
        })
      )
      .subscribe();
    return userSubject.asObservable();
  }


  /**
   * Creates a new BehaviorSubject for the given user ID.
   * The BehaviorSubject is initialized with a default user object,
   * which is used to represent the user in the user list if the user data is not available.
   * The default user object contains the user ID, an empty name, photo URL, email and a status of false.
   * @param {string} userId The ID of the user to create the BehaviorSubject for.
   * @returns A new BehaviorSubject with the default user object as initial value.
   */
  createUserBehaviorSubject(userId: string): BehaviorSubject<CustomUser> {
    return new BehaviorSubject<CustomUser>({
      userId,
      name: 'Unbekannt',
      photoURL: '',
      email: '',
      status: false,
    });
  }


  /**
   * Retrieves the avatar URL of a user given their ID.
   * @param {string} userId The user ID to retrieve the avatar URL for.
   * @returns An observable that emits the avatar URL of the user.
   */
  getuserAvatar(userId: string): Observable<string> {
    return this.getUserById(userId).pipe(map((user) => user.photoURL || '/img/avatars/picPlaceholder.svg'));
  }


  /**
   * Retrieves the online status of a user given their ID.
   * @param {string} userId - The user ID to retrieve the status for.
   * @returns {Observable<string>} - An observable that emits 'online' if the user is online,
   */
  getuserStatus(userId: string): Observable<string> {
    return this.getUserById(userId).pipe(map((user) => (user.status ? 'online' : 'offline')));
  }


  /**
   * Retrieves the name of a user given their ID.
   * @param {string} userId The user ID to retrieve the name for.
   * @returns An observable that emits the user name.
   * If the user is found in Firestore, it emits the user name stored in Firestore.
   * If the user is not found, it emits 'Unbekannt'.
   */
  getuserName(userId: string): Observable<string> {
    return this.getUserById(userId).pipe(map((user) => user.name ? user.name : 'Unbekannt'));
  }


  /**
   * Retrieves user data for a list of user IDs.
   * @param userIds An array of user IDs for which to retrieve user data.
   * @returns A promise that resolves to an array of `User` objects.
   */
  async getUsernamesByIds(userIds: string[]): Promise<CustomUser[]> {
    const users: CustomUser[] = [];
    for (const userId of userIds) {
      const user = await firstValueFrom(this.getUserById(userId));
      users.push(user);
    }
    return users;
  }


  /**
   * Creates and returns a `UserModel` object with the provided user data.
   * @param {string} userId - The unique identifier for the user.
   * @param {string} username - The name of the user.
   * @param {string} email - The email address of the user.
   * @param {string} avatarURL - The URL for the user's avatar image.
   * @param {string} [provider=''] - The provider of the user's authentication. Defaults to an empty string.
   * @param {boolean} [status=false] - The online status of the user. Defaults to false.
   * @returns {UserModel} - A `UserModel` object populated with the provided data.
   */
  setUserData(
    userId: string,
    username: string,
    email: string,
    avatarURL: string,
    provider: string = '',
    status: boolean = false
  ): UserModel {
    return {
      userId,
      name: username,
      email,
      photoURL: avatarURL,
      channels: [],
      privateNoteRef: '',
      status: status,
      provider: provider,
    };
  }


  /**
   * Returns a `User` object with default values for an anonymous user.
   * @param {string} userId - The ID of the anonymous user.
   * @returns A `User` object with default values for an anonymous user.
   */
  setAnonymousUserData(userId: string): UserModel {
      return {
        userId,
        name: 'Gast',
        email: 'gast@gast.de',
        photoURL: 'img/avatars/picPlaceholder.svg',
        channels: [],
        privateNoteRef: '',
        status: true,
        provider: 'anonymous',
      };
  }


  /**
   * Sends a password reset email to the user with the given email address.
   * @param email - The email address of the user.
   * @returns A promise that resolves when the password reset email has been successfully sent.
   */
  resetPassword(email: string): Promise<void> {
    return sendPasswordResetEmail(this.auth, email);
  }


  /**
   * Updates the password for the currently authenticated user.
   * @param newPassword - The new password to set for the user.
   * @returns A promise that resolves when the password has been successfully updated.
   */
  updateUserPassword(newPassword: string): Promise<void> {
    const currentUser = this.auth.currentUser;
    if (currentUser) 
      return updatePassword(currentUser, newPassword);
    else 
      return Promise.reject('Kein Benutzer ist angemeldet.');
  }

  
  /**
   * Stores the given user data in the session storage.
   * @param userData - A UserModel object containing the user data to be stored.
   */
  setUserDataInStorage(userData: UserModel) {
    sessionStorage.setItem('userData', JSON.stringify(userData));
  }


  /**
   * Updates a user's data in Firestore with the given data.
   * @param {string} userId - The ID of the user to update.
   * @param {Partial<UserModel>} updatedData - The user data to update.
   * @returns {Promise<void>} - A promise that resolves when the update operation is complete.
   */
  updateDataInFirestore(userId: string, updatedData: Partial<UserModel>): Promise<void> {
    const userDocRef = doc(this.firestore, `users/${userId}`);
    return updateDoc(userDocRef, updatedData);
  }


  /**
   * Retrieves a user object for the given user ID from Firestore.
   * @param {string | null} userId - The ID of the user to retrieve.
   * @returns {Promise<UserModel | null>} - A promise that resolves to a `UserModel` object if the user is found in Firestore,
   * or `null` if the user is not found.
   */
  async getUserForMessageById(userId: string | null): Promise<UserModel | null> {
    const userDoc = await getDoc(doc(this.firestore, `users/${userId}`));
    return userDoc.exists() ? (userDoc.data() as UserModel) : null;
  }

    /**
     * Confirms the password reset process using the given out-of-band code and new password.
     * @param oobCode - The out-of-band code received for password reset.
     * @param newPassword - The new password to set for the user.
     * @returns A promise that resolves when the password has been successfully reset.
     */
    confirmPasswordReset(oobCode: string, newPassword: string): Promise<void> {
      return confirmPasswordReset(this.auth, oobCode, newPassword);
    }


  /**
   * Checks if a user exists in Firestore given a user ID.
   * @param userId - The ID of the user to check.
   * @returns A promise that resolves to true if the user exists in Firestore and false otherwise.
   */
  async checkUserId(userId: string) {
    if (userId) {
      const userDoc = await getDoc(doc(this.firestore, 'users', userId));
      return userDoc.exists();
    } else 
      return false;
  }


  /**
   * Updates the user data in Firestore and in the Firebase Authentication service.
   * @param user The User object to update.
   * @param userId The ID of the user to update.
   * @param updatedData The data to update for the user.
   * @returns A promise that resolves when the user data is updated.
   */
  async updateUserDataInDatabase(user : User,userId: string, updatedData: Partial<UserModel>) {
    if (user) {
      if (updatedData.name) {
        await updateProfile(user, { displayName: updatedData.name });
        this.updateDataInFirestore(userId, { name: updatedData.name });
      }
      if (updatedData.email) {
        await updateEmail(user, updatedData.email);
        this.updateDataInFirestore(userId, { email: updatedData.email });
      }
    }
  }


  /**
   * Handles a login error by setting the error message in the `loginError` observable and rethrowing the error.
   * @param error - The error object from the login operation.
   */
  public handleLoginError(error: any): void {
    if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') 
      this.loginError.set('Invalid email or password');
    else 
      this.loginError.set('Unexpected error occurred');
    throw error;
  }


  /**
   * Deletes the anonymous user from Firestore and removes the user from the authentication system.
   */
  deleteAnonymousUserFromFirestore(): void {
    const user = this.auth.currentUser;
    if (user) {
      deleteDoc(doc(this.firestore, `users/${user.uid}`));
      user.delete()
    }
  }


    /**
     * Generates a ThreadMessage object based on the active user and the message content.
     * @returns {ThreadMessage} - The generated ThreadMessage object.
     */
    async generateThreadMessageObject( activeUserId: string | null, messageContent: string): Promise<ThreadMessage> {
      let user: UserModel = (this.getUserForMessageById(activeUserId)) as unknown as UserModel;
      const threadMessage: ThreadMessage = {
        createdBy: activeUserId || '',
        creatorName: user.name || '',
        creatorPhotoURL: user.photoURL || '',
        message: messageContent.trim(),
        timestamp: new Date(),
        reactions: [],
        isThreadMessage: true,
        sameDay: false,
      };
      return threadMessage;
    }


  generateMessageObject(user : UserModel, channelId: string | undefined, activeUserId: string | null, messageContent: string): Omit<Message, 'threadMessages$'> {
    return {
      channelId: channelId || '',
      createdBy: activeUserId || '',
      creatorName: user.name || '',
      creatorPhotoURL: user.photoURL || '',
      message: messageContent.trim(),
      timestamp: new Date(),
      members: [],
      reactions: [],
      sameDay: false
    };
  }
}
