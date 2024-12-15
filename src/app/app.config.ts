import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { initializeApp, provideFirebaseApp } from '@angular/fire/app';
import { getFirestore, provideFirestore } from '@angular/fire/firestore';
import data from '../../firebase.json';
import { getAuth, provideAuth } from '@angular/fire/auth';
import { getDatabase, provideDatabase } from '@angular/fire/database';
import { getStorage, provideStorage } from '@angular/fire/storage';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideAnimations(),
    provideAnimationsAsync(),
    provideFirebaseApp(() => initializeApp(data)),
    provideFirestore(() => getFirestore()),
    provideAuth(() => getAuth()),
    provideDatabase(() => getDatabase()),
    // provideStorage(() => getStorage()), provideFirebaseApp(() => initializeApp({"projectId":"dabubble-4c4f8","appId":"1:784459986538:web:9b8067bc32c25b475dfc13","storageBucket":"dabubble-4c4f8.firebasestorage.app","apiKey":"AIzaSyChOdAlV4710eiJ2P6v9I-0YI0wlzhTSQ0","authDomain":"dabubble-4c4f8.firebaseapp.com","messagingSenderId":"784459986538"})), provideAuth(() => getAuth()), provideFirestore(() => getFirestore()),
  ],
};
