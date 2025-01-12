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

  private userIdSubject = new BehaviorSubject<string>('');
  userId$ = this.userIdSubject.asObservable();

  private channelIdSubject = new BehaviorSubject<string>('');
  channelId$ = this.channelIdSubject.asObservable();


  updateVariable(newValue: string) {
    this.sharedVariable.next(newValue);
  }

  setSearchString(value: string) {
    this.searchStringSubject.next(value);
  }

  setUserIdString(value: string) {
    this.userIdSubject.next(value);
  }

  setChannelIdString(value: string) {
    this.channelIdSubject.next(value);
  }

  getUserIdString() {
    return this.userIdSubject.value;
  }

  getChannelIdString() {
    return this.channelIdSubject.value;
  }

  getSearchString() {
    return this.searchStringSubject.value;
    //return this.sharedVariable.value;
  }
}