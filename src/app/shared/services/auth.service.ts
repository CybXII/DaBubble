import { Inject, Injectable, signal } from '@angular/core';
import {
  Auth,
  User,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInAnonymously,
  signInWithPopup,
  onAuthStateChanged,
  GoogleAuthProvider,
  getAuth,
  sendSignInLinkToEmail,
  sendEmailVerification,
  sendPasswordResetEmail,
  updatePassword,
  confirmPasswordReset,
  updateProfile,
  updateEmail,
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
  getDocs,
  query,
  where,
  addDoc,
  arrayUnion,
} from '@angular/fire/firestore';
import { Router } from '@angular/router';
import { UserModel } from '../../models/user';
import { ToastMessageService } from './toastmessage.service';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  public avatarCache = new Map<string, string>();
  private cacheExpirationTime = 3600000;
  private avatarCacheTimestamps = new Map<string, number>();

  userId = signal<string | null>(null);
  userData = signal<UserModel | null>(null);
  isUserAuthenticated = signal<boolean>(false);
  loginError = signal<string>('');
  userList = signal<UserModel[]>([]);
  public loadingSpinnerBoard: boolean = true;
  private loginType = signal<'guest' | 'google' | 'email' | null>(null);
  currentUser = signal<UserModel | null>(null);   
  
  
  constructor(
    private auth: Auth,
    private firestore: Firestore,
    private router: Router,
    private toastMessageService: ToastMessageService
  ) {
    onAuthStateChanged(this.auth, (firebaseUser: User | null) => {
      if (firebaseUser) {
        const userModel = new UserModel(firebaseUser);
        this.currentUser.set(userModel);
      } else {
        this.currentUser.set(null);
      }
    });
    this.monitorAuthState();
    this.intializeUserData();
  }

  /**
   * Bestätigt den Passwort-Reset mit dem erhaltenen oobCode und setzt das neue Passwort.
   */
  confirmPasswordReset(oobCode: string, newPassword: string): Promise<void> {
    return confirmPasswordReset(this.auth, oobCode, newPassword);
  }

  /**
   * Überwacht den Firebase-Auth-Status
   */
  private monitorAuthState(): void {
    onAuthStateChanged(this.auth, (user) => {
      if (user) {
        this.isUserAuthenticated.set(true);
        this.userId.set(user.uid);
        if (this.router.url === '/') {
          this.redirectIfAuthenticated();
        }
      } else {
        this.clearAuthState();
        console.log('No user logged in');
      }
    });
  }

  /**
   * Setzt den Auth-Status zurück
   */
  private clearAuthState(): void {
    this.userId.set(null);
    this.userData.set(null);
    this.isUserAuthenticated.set(false);
    this.loginType.set(null);
    sessionStorage.removeItem('userData');
  }

  /**
   * Prüft, ob ein Benutzer eingeloggt ist
   */
  isAuthenticated(): boolean {
    return !!this.auth.currentUser || this.isUserAuthenticated();
  }

  async register(
    email: string,
    password: string,
    name: string,
    photoURL: string
  ): Promise<void> {
    try {
      const userCredential = await createUserWithEmailAndPassword(this.auth,email,password);
      const user = userCredential.user;
      const userData = this.setUserData(
        user.uid,
        name || '',
        user.email || '',
        photoURL || '',
        'password'
      );
      await setDoc(doc(this.firestore, 'users', user.uid), userData);
      const docRefChannel1 = doc(this.firestore, 'channels', "vfphslFFYLqC4hHHlM8y");
      await updateDoc(docRefChannel1, {
        members: arrayUnion(user.uid)
      });
      const docRefChannel2 = doc(this.firestore, 'channels', "q6m6NQIQepOmjULyneBJ");
      await updateDoc(docRefChannel2, {
        members: arrayUnion(user.uid)
      });
      await setDoc(doc(this.firestore, 'channels', user.uid), {
        createdAt: new Date(),
        isPrivate: true,
        createdBy: user.uid,
        description: userData.name,
        name: userData.name,
        members: [user.uid],
      });
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
   * Passwort zurücksetzen
   */
  resetPassword(email: string): Promise<void> {
    return sendPasswordResetEmail(this.auth, email);
  }

  /**
   * Passwort updaten
   */
  updateUserPassword(newPassword: string): Promise<void> {
    const currentUser = this.auth.currentUser;
    if (currentUser) 
      return updatePassword(currentUser, newPassword);
    else 
      return Promise.reject('Kein Benutzer ist angemeldet.');
  }

  /**
   * Benutzer einloggen (E-Mail und Passwort)
   */
  async login(email: string, password: string): Promise<void> {
    try {
      const userCredential = await signInWithEmailAndPassword(this.auth,email,password);
      this.userId.set(userCredential.user.uid);
      this.updateDataInFirestore(userCredential.user.uid, { status: true });
      await this.loadUserData(userCredential.user.uid);
      setTimeout(() => {
        this.toastMessageService.showToastSignal('Erfolgreich eingeloggt');
      }, 1000);
    } catch (error) {
      this.handleLoginError(error);
    }
  }

  /**
   * Gast-Login
   */
  async guestLogin(): Promise<void> {
    try {
      const userCredential = await signInAnonymously(this.auth);
      const user = userCredential.user;
      const userData = this.setAnonymousUserData(user.uid);
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
        createdAt: new Date(),
        isPrivate: false,
        createdBy: "admin",
        description: "Gäste only",
        name: "Gäste only",
        members: [user.uid],
      });      
      await this.loadUserData(user.uid);
      setTimeout(() => {
        this.toastMessageService.showToastSignal('Erfolgreich eingeloggt');
      }, 1000);
    } catch (error) {
      console.error('Anonymous login failed:', error);
    }
  }

  /**
   * Google-Login
   */
  async googleLogin(): Promise<void> {
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(this.auth, provider);
      const user = result.user;
      const userData = this.setUserData(
        user.uid,
        user.displayName || '',
        user.email || '',
        'img/avatars/picPlaceholder.svg',
        user.providerData[0].providerId || '',
        true
      );
      await setDoc(doc(this.firestore, `users/${user.uid}`), userData);
      await this.loadUserData(user.uid);
      setTimeout(() => {
        this.toastMessageService.showToastSignal('Erfolgreich eingeloggt');
      }, 1000);
    } catch (error) {
      console.error('Google login failed:', error);
    }
  }

  private setUserDataInStorage(userData: UserModel) {
    sessionStorage.setItem('userData', JSON.stringify(userData));
  }


  intializeUserData() {
    if (sessionStorage.getItem('userData')) {
      this.userData.set(JSON.parse(sessionStorage.getItem('userData') || '{}'));
    }
  }

  /**
   * Logout
   */
  async logout(): Promise<void> {
    const userId = this.userData()?.userId;
    if (userId && this.userData()?.provider !== 'anonymous') {
      try {
        await this.updateDataInFirestore(userId, { status: false });
        await this.auth.signOut();
        this.clearAuthState();
        this.router.navigate(['']);
        this.toastMessageService.showToastSignal('Erfolgreich ausgeloggt');
      } catch (error) {
        console.error('[AuthService] Fehler beim Logout:', error);
      }
    } else if (this.userData()?.provider === 'anonymous') {
      try {
        this.deleteAnonymousUserFromFirestore();
        await this.auth.signOut();
        this.clearAuthState();
        this.router.navigate(['']);
        this.toastMessageService.showToastSignal('Erfolgreich ausgeloggt');
      } catch (error) {
        console.error('[AuthService] Fehler beim anonymen Logout:', error);
      }
    }
  }


  deleteAnonymousUserFromFirestore(): void {
    const user = this.auth.currentUser;
    if (user) {
      deleteDoc(doc(this.firestore, `users/${user.uid}`));
      user.delete()
    }
  }

  /**
   * Benutzerdaten laden
   */
  async loadUserData(userId: string): Promise<void> {
    try {
      const userDoc = await getDoc(doc(this.firestore, 'users', userId));
      if (userDoc.exists()) {
        this.userData.set(userDoc.data() as UserModel);
        this.setUserDataInStorage(userDoc.data() as UserModel);
      }
    } catch (error) {
      console.error('Failed to load user data:', error);
    }
  }


  async checkUserId(userId: string) {
    if (userId) {
      const userDoc = await getDoc(doc(this.firestore, 'users', userId));
      return userDoc.exists();
    } else 
      return false;
  }


  /**
   * Fehler beim Login behandeln
   */
  private handleLoginError(error: any): void {
    if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') 
      this.loginError.set('Invalid email or password');
    else 
      this.loginError.set('Unexpected error occurred');
    throw error;
  }


  /**
   * Benutzerinformationen für Firestore erstellen
   */
  private setUserData(
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
   * Gast-Benutzerdaten erstellen
   */
  private setAnonymousUserData(userId: string): UserModel {
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
   * Alle Benutzer aus Firestore laden
   */
  public getUserList(): Observable<UserModel[]> {
    return new Observable((observer) => {
      const userCollection = collection(this.firestore, 'users');
      onSnapshot(userCollection,(snapshot) => {
          const users: UserModel[] = [];
          snapshot.forEach((doc) => {users.push(doc.data() as UserModel);});
          this.userList.set(users);
          observer.next(users);
        },
        (error) => {
          observer.error(error);
        }
      );
    });
  }


  redirectIfAuthenticated(): void {
    if (this.auth.currentUser) 
      setTimeout(() => {this.router.navigate(['/board']);}, 4000);
    else 
      this.router.navigate(['/']);
  }


  async getUserById(userId: string | null): Promise<UserModel | null> {
    const userDoc = await getDoc(doc(this.firestore, `users/${userId}`));
    return userDoc.exists() ? (userDoc.data() as UserModel) : null;
  }


  async updateUserData(
    userId: string,
    updatedData: Partial<UserModel>
  ): Promise<void> {
    try {
      const userDocRef = doc(this.firestore, `users/${userId}`);
      await updateDoc(userDocRef, updatedData);
      const updatedUserDoc = await getDoc(userDocRef);
      if (updatedUserDoc.exists()) {
        const updatedUserData = updatedUserDoc.data() as UserModel;
        sessionStorage.setItem('userData', JSON.stringify(updatedUserData));
        this.userData.set(updatedUserData);
        const user = this.auth.currentUser;
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
        this.toastMessageService.showToastSignal('Benutzerdaten erfolgreich aktualisiert');
      }
    } catch (error) {
      console.error('Fehler beim Aktualisieren der Benutzerdaten:', error);
      this.toastMessageService.showToastSignal('Fehler beim Aktualisieren der Benutzerdaten');
    }
  }


  updateDataInFirestore(userId: string, updatedData: Partial<UserModel>): Promise<void> {
    const userDocRef = doc(this.firestore, `users/${userId}`);
    return updateDoc(userDocRef, updatedData);
  }
}
