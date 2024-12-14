import { Injectable, signal } from '@angular/core';
import {
  Auth,
  createUserWithEmailAndPassword,
  UserCredential,
} from '@angular/fire/auth';
import { Firestore, doc, setDoc } from '@angular/fire/firestore';
import { User } from '../../models/user';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { getDoc } from 'firebase/firestore';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  constructor(private auth: Auth, private firestore: Firestore) {}

  userId = signal<string>('');
  userData = signal<User | null>(null);
  loginError = signal<string>('');

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
}
