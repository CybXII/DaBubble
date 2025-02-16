import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class SharedService {
  private sharedVariable = new BehaviorSubject<string>('Initial Value');
  private searchStringSubject = new BehaviorSubject<string>('');
  private targetStringSubject = new BehaviorSubject<string>('');
  private userIdSubject = new BehaviorSubject<string>('');
  private channelIdSubject = new BehaviorSubject<string>('');
  sharedVariable$ = this.sharedVariable.asObservable();
  searchString$ = this.searchStringSubject.asObservable();
  targetString$ = this.targetStringSubject.asObservable();
  userId$ = this.userIdSubject.asObservable();
  channelId$ = this.channelIdSubject.asObservable();


  /**
   * Updates the shared variable with the given new value.
   * @param newValue The new value to assign to the shared variable.
   */
  updateVariable(newValue: string) {
    this.sharedVariable.next(newValue);
  }


  /**
   * Updates the search string with the provided value.
   * 
   * @param value The new search string to be set.
   */
  setSearchString(value: string) {
    this.searchStringSubject.next(value);
  }


  /**
   * Updates the user ID string with the provided value.
   * @param value The new user ID string to be set.
   */
  setUserIdString(value: string) {
    this.userIdSubject.next(value);
  }


  /**
   * Updates the channel ID string with the provided value.
   * @param value The new channel ID string to be set.
   */
  setChannelIdString(value: string) {
    this.channelIdSubject.next(value);
  }


  /**
   * Updates the target string with the provided value.
   * The target string is a string that indicates whether the user is targeting a user or a channel.
   * @param value The new target string to be set.
   */
  setTargetString(value: string) {
    this.targetStringSubject.next(value);
  }


  /**
   * Returns the currently set user ID string.
   * @returns The currently set user ID string.
   */
  getUserIdString() {
    return this.userIdSubject.value;
  }


  /**
   * Returns the currently set channel ID string.
   * @returns The currently set channel ID string.
   */
  getChannelIdString() {
    return this.channelIdSubject.value;
  }


  /**
   * Returns the currently set target string.
   * The target string is a string that indicates whether the user is targeting a user or a channel.
   * @returns The currently set target string.
   */
  getTargetString() {
    return this.targetStringSubject.value;
  }

  
  /**
   * Returns the currently set search string.
   * @returns The currently set search string.
   */
  getSearchString() {
    return this.searchStringSubject.value;
  }


    /**
   * Jumps to the '@' character in the message content.
   */
    jumpToAtAbove() {
      this.setSearchString('@');
    }
  
}