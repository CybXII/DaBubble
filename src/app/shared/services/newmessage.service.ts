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

  private targetStringSubject = new BehaviorSubject<string>('');
  targetString$ = this.targetStringSubject.asObservable();

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

  setTargetString(value: string) {
    this.targetStringSubject.next(value);
  }

  getUserIdString() {
    return this.userIdSubject.value;
  }

  getChannelIdString() {
    return this.channelIdSubject.value;
  }

  getTargetString() {
    return this.targetStringSubject.value;
  }

  getSearchString() {
    return this.searchStringSubject.value;
    //return this.sharedVariable.value;
  }
}