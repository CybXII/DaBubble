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
  getAuth,
  sendSignInLinkToEmail,
  sendEmailVerification,
  sendPasswordResetEmail,
  updatePassword,
  confirmPasswordReset
} from '@angular/fire/auth';
import {
  Firestore,
  doc,
  setDoc,
  getDoc,
  collection,
  onSnapshot,
} from '@angular/fire/firestore';
import { Router } from '@angular/router';
import { UserModel } from '../../models/user';
import { ToastMessageService } from './toastmessage.service';

@Injectable({
  providedIn: 'root',
})

export class AuthService {

  private avatarCache = new Map<string, string>();

  // Reactive signals
  userId = signal<string | null>(null);
  userData = signal<UserModel | null>(null);
  isUserAuthenticated = signal<boolean>(false);
  loginError = signal<string>('');
  userList = signal<UserModel[]>([]);
  private loginType = signal<'guest' | 'google' | 'email' | null>(null);
  currentUser = signal<UserModel | null>(null); // Typisiertes Signal
  constructor(
    public auth: Auth,
    private firestore: Firestore,
    private router: Router,
    private toastMessageService: ToastMessageService
  ) {
    onAuthStateChanged(this.auth, (firebaseUser: User | null) => {
      if (firebaseUser) {
        // Firebase-User in eigenes Modell umwandeln
        const userModel = new UserModel(firebaseUser);
        this.currentUser.set(userModel); // Typisiertes Signal
      } else {
        this.currentUser.set(null); // Kein Benutzer angemeldet
      }
    });
  
    this.monitorAuthState(); // Überwachung des Auth-Status starten
    this.getUserList(); // Benutzerliste aus Firestore laden
    this.intializeUserData(); // Benutzer-Daten initialisieren
  }


    /**
   * Bestätigt den Passwort-Reset mit dem erhaltenen oobCode und setzt das neue Passwort.
   */
    confirmPasswordReset(oobCode: string, newPassword: string): Promise<void> {
      return confirmPasswordReset(this.auth, oobCode, newPassword);
    }

  /**
  // sendEmail(email: string) {
  //   const actionCodeSettings = {
  //     // URL you want to redirect back to. The domain (www.example.com) for this
  //     // URL must be in the authorized domains list in the Firebase Console.
  //     url: 'https://dab.christophvoelker.com/finishSignUp2',

  //     // This must be true.
  //     handleCodeInApp: true,
  //     // iOS: {
  //     //   bundleId: 'com.example.ios',
  //     // },
  //     // android: {
  //     //   packageName: 'com.example.android',
  //     //   installApp: true,
  //     //   minimumVersion: '12',
  //     // },
  //     //dynamicLinkDomain: 'dab.christophvoelker.com'
  //   };
  //   const auth = getAuth();
  //   //console.log(auth);

  //   sendSignInLinkToEmail(auth, email, actionCodeSettings)
  //     .then(() => {
  //       // The link was successfully sent. Inform the user.
  //       // Save the email locally so you don't need to ask the user for it again
  //       // if they open the link on the same device.
  //       console.log('Sign-in email sent successfully.');
  //       window.localStorage.setItem('emailForSignIn', email);
  //       // ...
  //     })
  //     .catch((error) => {
  //       console.error('Error sending email:', error.code, error.message);
  //       const errorCode = error.code;
  //       const errorMessage = error.message;
  //       // ...
  //     });
  // }

  /**
   * Überwacht den Firebase-Auth-Status
   */
  private monitorAuthState(): void {
    onAuthStateChanged(this.auth, (user) => {
      if (user) {
        this.isUserAuthenticated.set(true);
        this.userId.set(user.uid);

        // Weiterleitung nur, wenn der Benutzer auf der Home-Route ist
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
    localStorage.removeItem('userData');
  }

  /**
   * Prüft, ob ein Benutzer eingeloggt ist
   */
  isAuthenticated(): boolean {
    return !!this.auth.currentUser || this.isUserAuthenticated();
  }

  /**
   * Benutzer registrieren (E-Mail und Passwort)
   */
  async register(email: string, password: string): Promise<void> {
    try {
      const userCredential = await createUserWithEmailAndPassword(
        this.auth,
        email,
        password
      );

      const user = userCredential.user;

      // Sende E-Mail-Bestätigung
      if (user) {
        await sendEmailVerification(user);
        console.log('Verification email sent to:', user.email);
      }

      const userData = this.setUserData(
        user.uid,
        user.displayName || '',
        user.email || '',
        user.photoURL || '',
        user.providerData[0].providerId || ''
      );
      
      await setDoc(doc(this.firestore, 'users', user.uid), userData);
    } catch (error) {
      console.error('Registration failed:', error);
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

    if (currentUser) {
      return updatePassword(currentUser, newPassword);
    } else {
      return Promise.reject('Kein Benutzer ist angemeldet.');
    }
  }


  /**
   * Benutzer einloggen (E-Mail und Passwort)
   */
  async login(email: string, password: string): Promise<void> {
    try {
      const userCredential = await signInWithEmailAndPassword(
        this.auth,
        email,
        password
      );
      console.log('Login successful:', userCredential.user);
      
      this.userId.set(userCredential.user.uid);
      await this.loadUserData(userCredential.user.uid);
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
      await this.loadUserData(user.uid);
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
      console.log('Google login successful:', user);
      
      const userData = this.setUserData(
        user.uid,
        user.displayName || '',
        user.email || '',
        user.photoURL || '',
        user.providerData[0].providerId || '',
      );
      await setDoc(doc(this.firestore, `users/${user.uid}`), userData);
      await this.loadUserData(user.uid);

    } catch (error) {
      console.error('Google login failed:', error);
    }
  }

  private setUserDataInStorage(userData: UserModel) {
    localStorage.setItem('userData', JSON.stringify(userData));
  }

  getUserDataFromStorage() {
    this.userData.set(JSON.parse(localStorage.getItem('userData') || '{}'));
  }

  intializeUserData() {
    if (localStorage.getItem('userData')) {
      this.getUserDataFromStorage();
    }
  }

  /**
   * Logout
   */
  logout(): void {
    this.auth.signOut().then(() => {
      this.clearAuthState();
      this.router.navigate(['']);
      this.toastMessageService.showToastSignal('Erfolgreich ausgeloggt');
    });
  }

  /**
   * Benutzerdaten laden
   */
  private async loadUserData(userId: string): Promise<void> {
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

  /**
   * Fehler beim Login behandeln
   */
  private handleLoginError(error: any): void {
    if (
      error.code === 'auth/user-not-found' ||
      error.code === 'auth/wrong-password'
    ) {
      this.loginError.set('Invalid email or password');
    } else {
      this.loginError.set('Unexpected error occurred');
    }
    console.error('Login error:', error);
  }

  /**
   * Benutzerinformationen für Firestore erstellen
   */
  private setUserData(
    userId: string,
    username: string,
    email: string,
    avatarURL: string,
    provider: string = ''
  ): UserModel {
    return {
      userId,
      name: username,
      email,
      photoURL: avatarURL,
      channels: [],
      privateNoteRef: '',
      status: false,
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
  private getUserList(): void {
    const userCollection = collection(this.firestore, 'users');
    onSnapshot(userCollection, (snapshot) => {
      const users: UserModel[] = [];
      snapshot.forEach((doc) => {
        users.push(doc.data() as UserModel);
      });
      this.userList.set(users);
    });
  }

  redirectIfAuthenticated(): void {
    if (this.auth.currentUser) {
      this.router.navigate(['/board']);
      this.toastMessageService.showToastSignal('Anmeldung erfolgreich');
    }
  }

  async getUserById(userId: string | null): Promise<UserModel | null> {
    const userDoc = await getDoc(doc(this.firestore, `users/${userId}`));
    return userDoc.exists() ? (userDoc.data() as UserModel) : null;
  }


  /**
   * Ruft die Avatar-URL eines Benutzers ab und verwendet einen Cache für Performance.
   */
  async getCachedAvatar(userId: string): Promise<string> {
    if (this.avatarCache.has(userId)) {
      return this.avatarCache.get(userId)!;
    }

    try {
      const userDoc = await getDoc(doc(this.firestore, `users/${userId}`));
      if (userDoc.exists()) {
        const userData = userDoc.data() as UserModel;
        const avatarUrl = userData.photoURL || 'img/avatars/picPlaceholder.svg';
        this.avatarCache.set(userId, avatarUrl);
        return avatarUrl;
      } 
      else {
        return 'img/avatars/picPlaceholder.svg';
      }
    } catch (error) {
      return 'img/avatars/picPlaceholder.svg';
    }
  }
}