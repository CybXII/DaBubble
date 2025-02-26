import { User as FirebaseUser } from '@angular/fire/auth';

export class UserModel {
  userId: string;
  name: string;
  status: boolean = false;
  photoURL: string;
  channels: string[] = [];
  email: string;
  privateNoteRef: string;
  provider: string;

  constructor(firebaseUser: FirebaseUser | null, additionalData?: Partial<UserModel>)  {
    this.userId = firebaseUser?.uid || '';
    this.name = firebaseUser?.displayName || '';
    this.photoURL = firebaseUser?.photoURL || '';
    this.email = firebaseUser?.email || '';
    this.status = additionalData?.status ?? false;
    this.channels = additionalData?.channels ?? [];
    this.privateNoteRef = additionalData?.privateNoteRef || '';
    this.provider = additionalData?.provider || '';
  }
}