import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Firestore, collectionData, collection } from '@angular/fire/firestore';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-firestore-test',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './firestore-test.component.html',
  styleUrls: ['./firestore-test.component.scss'],
})
export class FirestoreTestComponent implements OnInit {
  testData$: Observable<any[]> | undefined;

  constructor(private firestore: Firestore) {}

  ngOnInit(): void {
    this.testFirestoreConnection();
  }

  testFirestoreConnection(): void {
    const testCollection = collection(this.firestore, 'test-collection'); // CollectionReference
    this.testData$ = collectionData(testCollection); // Optionales `idField`

    this.testData$.subscribe(
      (data) => console.log('Daten erfolgreich abgerufen:', data),
      (error) => console.error('Fehler beim Abrufen der Daten:', error)
    );
  }
}
