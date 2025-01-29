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
  private userCache = new Map<string, User>();
  private userSubject = new BehaviorSubject<Map<string, User>>(new Map());

  constructor(private firestore: Firestore) {}

  getUserById(userId: string): Observable<User> {
    if (this.userCache.has(userId)) {
      return of(this.userCache.get(userId)!);
    }

    return from(getDoc(doc(this.firestore, `users/${userId}`))).pipe(
      map((docSnap) => {
        if (docSnap.exists()) {
          const userData = { userId, ...docSnap.data() } as User;
          this.userCache.set(userId, userData);
          this.userSubject.next(this.userCache);
          return userData;
        }
        return { userId, name: 'Unbekannt', photoURL: '', email: '', status: false };
      })
    );
  }

  
}
