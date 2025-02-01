import { Injectable } from '@angular/core';
import { Firestore, collection, doc, getDoc } from '@angular/fire/firestore';
import { BehaviorSubject, Observable, from, of } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';

interface User {
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

  constructor(private firestore: Firestore) {}

  getUserById(userId: string): Observable<User> {
    if (this.userCache.has(userId)) 
      return this.userCache.get(userId)!.asObservable();
    const userSubject = new BehaviorSubject<User>({
      userId,
      name: 'Unbekannt',
      photoURL: '',
      email: '',
      status: false,
    });
    this.userCache.set(userId, userSubject);
    from(getDoc(doc(this.firestore, `users/${userId}`))).pipe(
      map((docSnap) => {
        if (docSnap.exists()) {
          const userData = { userId, ...docSnap.data() } as User;
          userSubject.next(userData); 
        }
      })
    ).subscribe();
    return userSubject.asObservable();
  }


  getuserAvatar(userId: string): Observable<string> {
    return this.getUserById(userId).pipe(
      map((user) => user.photoURL || '/img/avatars/picPlaceholder.svg')
    );
  }


  getuserStatus(userId: string): Observable<string> {
    return this.getUserById(userId).pipe(
      map((user) => user.status ? 'online' : 'offline')
    );
  }


  getuserName(userId: string): Observable<string> {
    return this.getUserById(userId).pipe(
      map((user) => user.name ? user.name : 'Unbekannt')
    );
  }
}