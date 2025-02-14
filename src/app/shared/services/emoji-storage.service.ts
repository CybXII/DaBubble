import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class EmojiStorageService {
  private storageKey = 'recentEmojis';

  constructor() {}

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

  getEmojis(): string[] {
    return JSON.parse(localStorage.getItem(this.storageKey) || '[]');
  }
}
