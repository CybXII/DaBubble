import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class StateService {
  private menuStateSubject = new BehaviorSubject<string>('in');
  private threadchatStateSubject = new BehaviorSubject<string>('out');

  menuState$ = this.menuStateSubject.asObservable();
  threadchatState$ = this.threadchatStateSubject.asObservable();

  setMenuState(state: string): void {
    this.menuStateSubject.next(state);
  }

  setThreadchatState(state: string): void {
    this.threadchatStateSubject.next(state);
  }

  closeMenuAndThread(): void {
    this.menuStateSubject.next('out');
    this.threadchatStateSubject.next('out');
    console.log("ausgeführt");
    
  }
}
