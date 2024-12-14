import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Firestore, collectionData, collection } from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { addDoc, doc, setDoc } from '@angular/fire/firestore';


@Component({
  selector: 'app-firestore-test',
  standalone: true,   // <-- Add this line
  imports: [CommonModule],
  templateUrl: './firestore-test.component.html',
  styleUrls: ['./firestore-test.component.scss'],
})
export class FirestoreTestComponent implements OnInit {
  testData$: Observable<any[]> | undefined;

  constructor(private firestore: Firestore) { }

  ngOnInit(): void {
    this.testFirestoreConnection();
  }

  testFirestoreConnection(): void {
    const testCollection = collection(this.firestore, 'users');
    this.testData$ = collectionData(testCollection);

    this.testData$.subscribe(
      (data) => console.log('Daten erfolgreich abgerufen:', data),
      (error) => console.error('Fehler beim Abrufen der Daten:', error)
    );
  }

  writeData(): void {
    const testCollection = collection(this.firestore, 'users'); // Ziel-Sammlung
    const localData = {
      "name": "Max Mustermann",
      "email": "email@email.com",
      "status": false,
      "avatarURL": "avatarURL",
      "userId": "1",
      "channels": ["Channel1"],
      "privateNoteRef": "???"
    }

    // addDoc(testCollection, localData)
    //   .then((docRef) => {
    //     console.log('Daten erfolgreich hinzugefügt mit ID:', docRef.id);
    //   })
    //   .catch((error) => {
    //     console.error('Fehler beim Hinzufügen der Daten:', error);
    //   });
  }



}
