import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class SharedService {
  private sharedVariable = new BehaviorSubject<string>('Initial Value');
  sharedVariable$ = this.sharedVariable.asObservable();

  private searchStringSubject = new BehaviorSubject<string>('');
  searchString$ = this.searchStringSubject.asObservable();

  updateVariable(newValue: string) {
    this.sharedVariable.next(newValue);
  }

  setSearchString(value: string) {
    this.searchStringSubject.next(value);
  }

  getSearchString() {
    return this.searchStringSubject.value;
    //return this.sharedVariable.value;
  }
}