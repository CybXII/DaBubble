import { Injectable, signal } from '@angular/core';
import {
  Auth,
  User,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInAnonymously,
  signInWithPopup,
  onAuthStateChanged,
  GoogleAuthProvider,
} from '@angular/fire/auth';
import {
  Firestore,
  doc,
  setDoc,
  getDoc,
  updateDoc,
  collection,
  onSnapshot,
  deleteDoc,
  arrayUnion,
} from '@angular/fire/firestore';
import { Router } from '@angular/router';
import { UserModel } from '../../models/user';
import { ToastMessageService } from './toastmessage.service';
import { Observable } from 'rxjs';
import { UserService } from './user.service';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  public avatarCache = new Map<string, string>();
  userId = signal<string | null>(null);
  userData = signal<UserModel | null>(null);
  isUserAuthenticated = signal<boolean>(false);
  userList = signal<UserModel[]>([]);
  public loadingSpinnerBoard: boolean = true;
  private loginType = signal<'guest' | 'google' | 'email' | null>(null);
  currentUser = signal<UserModel | null>(null);

  /**
   * Initializes the AuthService.
   * @param auth - The Firestore authentication service.
   * @param firestore - The Firestore database service.
   * @param router - The Angular router service.
   * @param toastMessageService - The ToastMessageService which provides toast messages.
   * @param userService - The UserService which provides user data.
   */
  constructor(
    private auth: Auth,
    private firestore: Firestore,
    private router: Router,
    private toastMessageService: ToastMessageService,
    private userService: UserService
  ) {
    onAuthStateChanged(this.auth, (firebaseUser: User | null) => {
      if (firebaseUser) {
        const userModel = new UserModel(firebaseUser);
        this.currentUser.set(userModel);
      } else
        this.currentUser.set(null);
    });
    this.monitorAuthState();
    this.intializeUserData();
  }

  /**
   * Monitors the authentication state of the user.
   */
  private monitorAuthState(): void {
    onAuthStateChanged(this.auth, (user) => {
      if (user) {
        this.isUserAuthenticated.set(true);
        this.userId.set(user.uid);
        if (this.router.url === '/')
          this.redirectIfAuthenticated();
      } else
        this.clearAuthState();
    });
  }

  /**
   * Clears the authentication state of the user.
   */
  private clearAuthState(): void {
    this.userId.set(null);
    this.isUserAuthenticated.set(false);
    this.loginType.set(null);
    sessionStorage.removeItem('userData');
  }

  /**
   * Checks if the user is authenticated.
   * @returns True if the user is authenticated, false otherwise.
   */
  isAuthenticated(): boolean {
    return !!this.auth.currentUser || this.isUserAuthenticated();
  }

  /**
   * Registers a new user using the given email, password, name, and profile picture URL.
   * @param email - The email address of the user.
   * @param password - The password of the user.
   * @param name - The name of the user.
   * @param photoURL - The URL of the profile picture of the user.
   * @returns A promise that resolves when the user has been successfully registered.
   */
  async register(email: string, password: string, name: string, photoURL: string): Promise<void> {
    try {
      await this.registerUSer(email, password, name, photoURL);
    } catch (error) {
      console.error('Registration failed:', error);
    } finally {
      this.router.navigate(['']);
      setTimeout(() => {
        this.toastMessageService.showToastSignal('Erfolgreich registriert');
      }, 1000);
    }
  }

  /**
   * Registers a new user with the specified email, password, name, and photoURL.
   * @param email - The email address of the user.
   * @param password - The password for the user's account.
   * @param name - The name of the user.
   * @param photoURL - The URL of the user's profile picture.
   * @returns A promise that resolves when all operations are complete.
   */
  async registerUSer(email: string, password: string, name: string, photoURL: string) {
    const userCredential = await createUserWithEmailAndPassword(this.auth, email, password);
    const user = userCredential.user;
    const userData = this.userService.setUserData(user.uid, name || '', user.email || '', photoURL || '', 'password');
    await setDoc(doc(this.firestore, 'users', user.uid), userData);
    const docRefChannel1 = doc(this.firestore, 'channels', "allgemein");
    await updateDoc(docRefChannel1, { members: arrayUnion(user.uid) });
    const docRefChannel2 = doc(this.firestore, 'channels', "entwickler");
    await updateDoc(docRefChannel2, { members: arrayUnion(user.uid) });
    await setDoc(doc(this.firestore, 'channels', user.uid), {
      createdAt: new Date(),
      isPrivate: true,
      createdBy: user.uid,
      description: userData.name,
      name: userData.name,
      members: [user.uid],
    });
  }

  /**
   * Logs in an existing user with the given email and password.
   * @param email - The email address of the user.
   * @param password - The password of the user.
   * @returns A promise that resolves when the login operation is complete.
   */
  async login(email: string, password: string): Promise<void> {
    try {
      const userCredential = await signInWithEmailAndPassword(this.auth, email, password);
      this.userId.set(userCredential.user.uid);
      this.userService.updateDataInFirestore(userCredential.user.uid, { status: true });
      await this.loadUserData(userCredential.user.uid);
      setTimeout(() => {
        this.toastMessageService.showToastSignal('Erfolgreich eingeloggt');
      }, 1000);
    } catch (error) { this.userService.handleLoginError(error); }
  }

  /**
   * Logs in an anonymous guest user.
   * @returns A promise that resolves when the login operation is complete.
   */
  async guestLogin(): Promise<void> {
    try {
      const userCredential = await signInAnonymously(this.auth);
      const user = userCredential.user;
      const userData = this.userService.setAnonymousUserData(user.uid);
      await this.setNewGustObject(user, userData);
      await this.loadUserData(user.uid);
      setTimeout(() => {
        this.toastMessageService.showToastSignal('Erfolgreich eingeloggt');
      }, 1000);
    } catch (error) { console.error('Anonymous login failed:', error); }
  }

  /**
   * Creates a new guest user object in Firestore.
   * @param user - The user object.
   * @param userData - The user data object.
   * @returns A promise that resolves when the operation is complete.
   */
  async setNewGustObject(user: User, userData: UserModel): Promise<void> {
    await setDoc(doc(this.firestore, `users/${user.uid}`), userData);
    await setDoc(doc(this.firestore, 'channels', user.uid), {
      createdAt: new Date(),
      isPrivate: true,
      createdBy: user.uid,
      description: userData.name,
      name: userData.name,
      members: [user.uid],
    });
    await setDoc(doc(this.firestore, 'channels', 'guestsonly'), {
      createdAt: new Date().getTime(),
      isPrivate: false,
      createdBy: "admin",
      description: "Gäste only",
      name: "Gäste only",
      members: [user.uid],
    });
  }

  /**
   * Logs in an existing user using Google authentication.
   * @returns A promise that resolves when the login operation is complete.
   */
  async googleLogin(): Promise<void> {
    try { this.initGoogleLogin() }
    catch (error) { console.error('Google login failed:', error) }
  }

  /**
   * Initializes the Google login process.
   * Uses the `signInWithPopup` method with the Google provider to authenticate the user.
   * On success, sets the user data in Firestore and loads the user data.
   * @returns A promise that resolves when the login operation is complete.
   */
  async initGoogleLogin() {
    const provider = new GoogleAuthProvider();
    const result = await signInWithPopup(this.auth, provider);
    const user = result.user;
    const userData = this.userService.setUserData(
      user.uid,
      user.displayName || '',
      user.email || '',
      'img/avatars/picPlaceholder.svg',
      user.providerData[0].providerId || '',
      true
    );
    await setDoc(doc(this.firestore, `users/${user.uid}`), userData);
    const docRefChannel1 = doc(this.firestore, 'channels', "allgemein");
    await updateDoc(docRefChannel1, { members: arrayUnion(user.uid) });
    const docRefChannel2 = doc(this.firestore, 'channels', "entwickler");
    await updateDoc(docRefChannel2, { members: arrayUnion(user.uid) });
    await setDoc(doc(this.firestore, 'channels', user.uid), {
      createdAt: new Date(),
      isPrivate: true,
      createdBy: user.uid,
      description: userData.name,
      name: userData.name,
      members: [user.uid],
    });
    await this.loadUserData(user.uid);
    this.router.navigateByUrl('/board');
    setTimeout(() => {
      this.toastMessageService.showToastSignal('Erfolgreich eingeloggt');
    }, 1000);
  }

  /**
   * Initializes the user data in the user data subject.
   * If the user data is present in the session storage, it is retrieved and set in the user data subject.
   * This is used to retain the user data between page reloads.
   */
  intializeUserData() {
    if (sessionStorage.getItem('userData'))
      this.userData.set(JSON.parse(sessionStorage.getItem('userData') || '{}'));
  }

  /**
   * Logs out the currently logged in user.
   * If the user is a real user, it calls the `logoutUser` method.
   * If the user is an anonymous guest user, it calls the `logoutAnonymousUser` method.
   * @returns A promise that resolves when the logout operation is complete.
   */
  async logout(): Promise<void> {
    const userId = this.userData()?.userId;
    if (userId && this.userData()?.provider !== 'anonymous')
      await this.logoutUser(userId);
    else if (this.userData()?.provider === 'anonymous')
      await this.logoutAnonymousUser();
  }

  /**
   * Logs out the user with the given user ID.
   * @param userId - The unique identifier of the user to be logged out.
   * @returns A promise that resolves when the logout operation is complete.
   */
  async logoutUser(userId: string): Promise<void> {
    try {
      await this.userService.updateDataInFirestore(userId, { status: false });
      await this.auth.signOut();
      this.clearAuthState();
      this.router.navigate(['']);
      this.toastMessageService.showToastSignal('Erfolgreich ausgeloggt');
    } catch (error) { console.error('[AuthService] Fehler beim Logout:', error) }
  }

  /**
   * Logs out the current anonymous user.
   * It deletes the anonymous user object from Firestore, signs out the user, clears the authentication state, and navigates to the login page.
   * If an error occurs during the logout process, it logs the error to the console.
   * @returns A promise that resolves when the logout operation is complete.
   */
  async logoutAnonymousUser(): Promise<void> {
    try {
      this.userService.deleteAnonymousUserFromFirestore();
      await this.auth.signOut();
      this.clearAuthState();
      this.router.navigate(['']);
      this.toastMessageService.showToastSignal('Erfolgreich ausgeloggt');
    } catch (error) { console.error('[AuthService] Fehler beim anonymen Logout:', error) }
  }

  /**
   * Loads the user data for the given user ID from Firestore and sets it to the `userData` observable.
   * @param userId - The ID of the user to load the data for.
   * @returns A promise that resolves when the user data is loaded from Firestore.
   */
  async loadUserData(userId: string): Promise<void> {
    try {
      const userDoc = await getDoc(doc(this.firestore, 'users', userId));
      if (userDoc.exists()) {
        this.userData.set(userDoc.data() as UserModel);
        this.userService.setUserDataInStorage(userDoc.data() as UserModel);
      }
    } catch (error) { console.error('Failed to load user data:', error) }
  }

  /**
   * Returns an observable that emits the list of all users in the Firestore database.
   * When the list of users is received from Firestore, it stores the list in the `userList` observable and emits the list.
   * @returns An observable that emits the list of all users in the Firestore database.
   */
  public getUserList(): Observable<UserModel[]> {
    return new Observable((observer) => {
      const userCollection = collection(this.firestore, 'users');
      onSnapshot(userCollection, (snapshot) => {
        const users: UserModel[] = [];
        snapshot.forEach((doc) => { users.push(doc.data() as UserModel); });
        this.userList.set(users);
        observer.next(users);
      },
        (error) => { observer.error(error); }
      );
    });
  }

  /**
   * Redirects the user to the board route if the user is authenticated.
   * Otherwise, redirects the user to the root route.
   * This method is used to redirect the user after a successful login operation.
   * The redirect is delayed by 4 seconds to allow the user to see the login success message.
   */
  redirectIfAuthenticated(): void {
    if (this.auth.currentUser)
      setTimeout(() => { this.router.navigate(['/board']); }, 4000);
    else
      this.router.navigate(['/']);
  }

  /**
   * Updates the user data in Firestore and in the Firebase Authentication service.
   * @param userId The ID of the user to update.
   * @param updatedData The data to update for the user.
   * @returns A promise that resolves when the user data is updated.
   */
  async updateUserData(userId: string, updatedData: Partial<UserModel>): Promise<void> {
    try { this.updateFireStoreData(userId, updatedData); }
    catch (error) {
      console.error('Fehler beim Aktualisieren der Benutzerdaten:', error);
      this.toastMessageService.showToastSignal('Fehler beim Aktualisieren der Benutzerdaten');
    }
  }

  /**
   * Updates the user data in Firestore and in the Firebase Authentication service.
   * @param userId The ID of the user to update.
   * @param updatedData The data to update for the user.
   * @returns A promise that resolves when the user data is updated.
   */
  async updateFireStoreData(userId: string, updatedData: Partial<UserModel>) {
    const userDocRef = doc(this.firestore, `users/${userId}`);
    await updateDoc(userDocRef, updatedData);
    const updatedUserDoc = await getDoc(userDocRef);
    if (updatedUserDoc.exists()) {
      const updatedUserData = updatedUserDoc.data() as UserModel;
      sessionStorage.setItem('userData', JSON.stringify(updatedUserData));
      this.userData.set(updatedUserData);
      const user = this.auth.currentUser;
      if (user)
        this.userService.updateUserDataInDatabase(user, userId, updatedData);
      this.toastMessageService.showToastSignal('Benutzerdaten erfolgreich aktualisiert');
    }
  }
}