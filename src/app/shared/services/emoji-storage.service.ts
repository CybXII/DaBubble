import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class EmojiStorageService {
  private storageKey = 'recentEmojis';

  /**
   * Saves an emoji to the local storage so it can be suggested later.
   *
   * It keeps track of the two most recently used emojis. If the emoji is
   * already in the list, it does nothing. Otherwise it adds it to the list
   * and removes the oldest one if there are more than two emojis in the list.
   * @param emoji The emoji to save.
   */
  saveEmoji(emoji: string): void {
    let emojis: string[] = JSON.parse(
      localStorage.getItem(this.storageKey) || '[]'
    );
    if (emojis[1] === emoji) return;
    emojis = emojis.filter((e) => e !== emoji);
    emojis.unshift(emoji);
    emojis = emojis.slice(0, 2);
    localStorage.setItem(this.storageKey, JSON.stringify(emojis));
  }

  /**
   * Retrieves the list of two most recently used emojis from the local storage.
   *
   * @returns An array of two strings, each representing an emoji. The first
   *     element is the most recently used emoji.
   */
  getEmojis(): string[] {
    return JSON.parse(localStorage.getItem(this.storageKey) || '[]');
  }
}
