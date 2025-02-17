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


  /**
   * Sets the menu state to the given value and emits it to all subscribers of the menuState$ observable.
   * @param state - The new menu state, either 'in' or 'out'.
   */
  setMenuState(state: string): void {
    this.menuStateSubject.next(state);
  }


  /**
   * Sets the thread chat state to the given value and emits it to all subscribers of the threadchatState$ observable.
   * @param state - The new thread chat state, either 'in' or 'out'.
   */
  setThreadchatState(state: string): void {
    this.threadchatStateSubject.next(state);
  }


  /**
   * Sets both the menu and thread chat state to 'out' and emits it to all subscribers of the menuState$ and threadchatState$ observables.
   * This is a convenience method to close both the menu and the thread chat in one method call.
   */
  closeMenuAndThread(): void {
    this.menuStateSubject.next('out');
    this.threadchatStateSubject.next('out');
    console.log("ausgeführt");
    
  }
}
