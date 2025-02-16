import { Injectable } from '@angular/core';
import { Firestore, collection, doc, getDoc, onSnapshot } from '@angular/fire/firestore';
import { BehaviorSubject, Observable, firstValueFrom, from } from 'rxjs';
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


  /**
   * Initializes the UserService.
   * @param {Firestore} firestore Firestore database service.
   */
  constructor(private firestore: Firestore) {
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
        const data = doc.data() as User;
        return { ...data };
      });
      users.forEach((user) => {
        if (this.userCache.has(user.userId)) 
          this.userCache.get(user.userId)!.next(user);
        else 
          this.userCache.set(user.userId, new BehaviorSubject<User>(user));
      });
      this.usersSubject.next(users);
    });
  }


  /**
   * Returns an observable that emits the user data for the given user ID.
   * @param {string} userId The ID of the user to retrieve the data for.
   * @returns An observable that emits the user data.
   */
  getUserById(userId: string): Observable<User> {
    if (this.userCache.has(userId)) return this.userCache.get(userId)!.asObservable();
    const userSubject = this.createUserBehaviorSubject(userId);
    this.userCache.set(userId, userSubject);
    from(getDoc(doc(this.firestore, `users/${userId}`)))
      .pipe(map((docSnap) => {
          if (docSnap.exists()) {
            const userData = { userId, ...docSnap.data() } as User;
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
  createUserBehaviorSubject(userId: string): BehaviorSubject<User> {
    return new BehaviorSubject<User>({
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
  async getUsernamesByIds(userIds: string[]): Promise<User[]> {
    const users: User[] = [];
    for (const userId of userIds) {
      const user = await firstValueFrom(this.getUserById(userId));
      users.push(user);
    }
    return users;
  }
}
