import { Injectable } from '@angular/core';
import { Firestore, collection, doc, getDoc, onSnapshot } from '@angular/fire/firestore';
import { BehaviorSubject, Observable, from } from 'rxjs';
import { map } from 'rxjs/operators';

export interface User {
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
  private userCache = new Map<string, BehaviorSubject<User>>();
  private usersSubject = new BehaviorSubject<User[]>([]);
  users$ = this.usersSubject.asObservable();

  constructor(private firestore: Firestore) {
    this.listenToUserChanges();
  }

  /** Echtzeit-Listener für ALLE Benutzer */
  private listenToUserChanges() {
    const usersCollection = collection(this.firestore, 'users');

    onSnapshot(usersCollection, (snapshot) => {
      const users = snapshot.docs.map((doc) => {
        const data = doc.data() as User;
        return { ...data };
      });

      // Aktualisiere userCache mit neuen Benutzerdaten
      users.forEach((user) => {
        if (this.userCache.has(user.userId)) {
          this.userCache.get(user.userId)!.next(user);
        } else {
          this.userCache.set(user.userId, new BehaviorSubject<User>(user));
        }
      });

      // Aktualisiere users$
      this.usersSubject.next(users);
    });
  }

  /** Einzelnen Benutzer holen – zuerst aus Cache, dann aus Firestore */
  getUserById(userId: string): Observable<User> {
    if (this.userCache.has(userId)) return this.userCache.get(userId)!.asObservable();

    const userSubject = new BehaviorSubject<User>({
      userId,
      name: 'Unbekannt',
      photoURL: '',
      email: '',
      status: false,
    });

    this.userCache.set(userId, userSubject);

    from(getDoc(doc(this.firestore, `users/${userId}`)))
      .pipe(
        map((docSnap) => {
          if (docSnap.exists()) {
            const userData = { userId, ...docSnap.data() } as User;
            userSubject.next(userData);
          }
        })
      )
      .subscribe();

    return userSubject.asObservable();
  }

  /** Benutzer-Avatar abrufen */
  getuserAvatar(userId: string): Observable<string> {
    return this.getUserById(userId).pipe(map((user) => user.photoURL || '/img/avatars/picPlaceholder.svg'));
  }

  /** Benutzer-Status abrufen */
  getuserStatus(userId: string): Observable<string> {
    return this.getUserById(userId).pipe(map((user) => (user.status ? 'online' : 'offline')));
  }

  /** Benutzer-Name abrufen */
  getuserName(userId: string): Observable<string> {
    return this.getUserById(userId).pipe(map((user) => user.name ? user.name : 'Unbekannt'));
  }

  
}
