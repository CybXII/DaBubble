import { Injectable, signal } from '@angular/core';
import {
  Auth,
  createUserWithEmailAndPassword,
  UserCredential,
} from '@angular/fire/auth';
import { Firestore, doc, setDoc } from '@angular/fire/firestore';
import { User } from '../../models/user';
import {
  GoogleAuthProvider,
  signInAnonymously,
  signInWithEmailAndPassword,
  signInWithPopup,
} from 'firebase/auth';
import { collection, getDoc, onSnapshot } from 'firebase/firestore';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  constructor(private auth: Auth, private firestore: Firestore) {
    // this.getUserList();
  }

  userId = signal<string>('');
  userData = signal<User | null>(null);
  loginError = signal<string>('');
  userList = signal<User[]>([]);

  register(email: string, password: string) {
    createUserWithEmailAndPassword(this.auth, email, password).then(
      (userCredential: UserCredential) => {
        const user = userCredential.user;
        const userData = this.setUserData(
          user.uid,
          user.displayName || '',
          user.email || '',
          user.photoURL || ''
        );
        setDoc(doc(this.firestore, 'users', user.uid), userData).catch(
          (error) => {
            console.error('Error writing user data: ', error);
          }
        );
      }
    );
  }
  setUserData(
    userId: string,
    username: string,
    email: string,
    avatarURL: string
  ): User {
    return {
      userId: userId,
      name: username,
      email: email,
      photoURL: avatarURL,
      channels: [],
      privateNoteRef: '',
      status: false,
    };
  }

  login(email: string, password: string) {
    signInWithEmailAndPassword(this.auth, email, password)
      .then((userCredential: UserCredential) => {
        const user = userCredential.user;
        this.userId.set(user.uid);
        this.getUserData();
      })
      .catch((error) => {
        this.handleLoginError(error);
      });
  }

  getUserData() {
    getDoc(doc(this.firestore, 'users', this.userId())).then((doc) => {
      if (doc.exists()) {
        this.userData.set(doc.data() as User);
      } else {
        console.log('No such document!');
      }
    });
  }

  handleLoginError(error: any) {
    if (error.code === 'auth/user-not-found') {
      this.loginError.set('Invalid email or password');
    } else if (error.code === 'auth/wrong-password') {
      this.loginError.set('Invalid email or password');
    } else if (error.code === 'auth/invalid-email') {
      this.loginError.set('Invalid email or password');
    }
  }

  guestLogin() {
    signInAnonymously(this.auth).then((userCredential: UserCredential) => {
      let user = userCredential.user;
      var userUid = user.uid;
      this.userId.set('');
      let userRef = doc(this.firestore, `users/${user.uid}`);

      console.log('user11', this.userId());

      let userData = this.setAnonymousUserData(user.uid);
      setDoc(userRef, userData).catch((error) => {
        console.error('Error writing user data: ', error);
      });
      this.getAnonymousUserData(userUid);
      console.log('user22', this.userId());
    });
  }

  getAnonymousUserData(userId: string) {
    getDoc(doc(this.firestore, 'users', userId)).then((doc) => {
      if (doc.exists()) {
        this.userData.set(doc.data() as User);
      } else {
        console.log('No such document!');
      }
    });
  }

  setAnonymousUserData(userId: string) {
    return {
      userId: userId,
      name: 'Guest',
      email: 'guest@guest.de',
      photoURL: 'img/avatars/picPlaceholder.svg',
      channels: [],
      privateNoteRef: '',
      status: true,
    };
  }

  googleLogin() {
    const provider = new GoogleAuthProvider();
    signInWithPopup(this.auth, provider)
      .then((result) => {
        const user = result.user;
        console.log('result', result);
        const userData = this.setUserData(
          user.uid,
          user.displayName || '',
          user.email || '',
          user.photoURL || ''
        );
        setDoc(doc(this.firestore, 'users', user.uid), userData).catch(
          (error) => {
            console.error('Error writing user data: ', error);
          }
        );
        this.userId.set(user.uid);
        this.getUserData();
      })
      .catch((error) => {
        console.log(error);
      });
  }

  logout() {
    this.auth.signOut();
    this.userId.set('');
    this.userData.set(null);
  }

  getUserList() {
    let userCollection = collection(this.firestore, 'users');
    onSnapshot(userCollection, (snapshot) => {
      let users: User[] = [];
      snapshot.forEach((doc) => {
        users.push(doc.data() as User);
      });
      this.userList.set(users);
    });
  }
}
