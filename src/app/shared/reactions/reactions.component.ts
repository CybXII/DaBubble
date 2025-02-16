import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Reaction } from '../../models/message';
import { UserService } from '../services/user.service';
import { combineLatest, map, Observable } from 'rxjs';
@Component({
  selector: 'app-reactions',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './reactions.component.html',
  styleUrl: './reactions.component.scss'
})
export class ReactionsComponent {
  @Input() reactions: Reaction[] = [];
  @Input() activeUserId: string = '';
  @Input() messageId: string = '';
  @Input() isThreadMessage: boolean = false;
  @Output() reactionAdded = new EventEmitter<{ messageId: string; emoji: string; isThreadMessage: boolean }>();

  constructor(private userService: UserService) {}

  /**
   * Emits a reactionAdded event with the given emoji, messageId, and isThreadMessage.
   * @param emoji The emoji to add as a reaction.
   */
  addReaction(emoji: string) {
    this.reactionAdded.emit({ messageId: this.messageId, emoji, isThreadMessage: this.isThreadMessage });
  }


  /**
   * Returns true if the given reaction was added by the active user.
   * @param reaction The reaction to check.
   */
  isReacted(reaction: Reaction): boolean {
    return reaction.userIds.includes(this.activeUserId);
  }


/**
 * Retrieves and formats the names of users who reacted with a specific emoji.
 * 
 * This method returns an observable that emits a string describing who
 * reacted to a message with the provided reaction. If the active user
 * is among the users who reacted, it includes a personalized message.
 * 
 * @param reaction The reaction object containing the emoji and user IDs.
 * @returns An observable that emits a string with the formatted list
 *          of user names who reacted.
 */
  getReactionUsers(reaction: Reaction): Observable<string> {
    const userObservables = reaction.userIds.map(id => this.userService.getUserById(id).pipe(map(user => user.name)));
    return combineLatest(userObservables).pipe(
      map(userNames => {
        if (reaction.userIds.includes(this.activeUserId)) {
          const otherUsers = userNames.filter((_, index) => reaction.userIds[index] !== this.activeUserId);
          if (otherUsers.length === 0) return 'Du hast reagiert';
          if (otherUsers.length === 1) return `Du und ${otherUsers[0]} haben reagiert`;
          return `Du, ${otherUsers[0]} und ${otherUsers.length - 1} weitere Person(en) haben reagiert`;
        } else {
          if (userNames.length === 1) return `${userNames[0]} hat reagiert`;
          if (userNames.length === 2) return `${userNames[0]} und ${userNames[1]} haben reagiert`;
          return `${userNames[0]}, ${userNames[1]} und ${userNames.length - 2} weitere haben reagiert`;
        }
      })
    );
  }


  /**
   * Returns an observable that emits the name of the user with the given user ID.
   * @param userId The user ID to retrieve the name for.
   * @returns An observable that emits the user name.
   */
  getUserName(userId: string): Observable<string> {
    return this.userService.getuserName(userId);
  }


  /**
   * Provides a unique identifier for a reaction based on its emoji and user IDs.
   * @param index The index of the reaction in the list of reactions.
   * @param reaction The reaction object to generate a unique identifier for.
   * @returns A unique string identifying the reaction.
   */
  trackByReaction(index: number, reaction: Reaction): string {
    return reaction.emoji + reaction.userIds.join('-');
  }
}
