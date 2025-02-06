import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Reaction } from '../../models/message';
import { signal } from '@angular/core';
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

  addReaction(emoji: string) {
    this.reactionAdded.emit({ messageId: this.messageId, emoji, isThreadMessage: this.isThreadMessage });
  }

  isReacted(reaction: Reaction): boolean {
    return reaction.userIds.includes(this.activeUserId);
  }

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

  getUserName(userId: string): Observable<string> {
    return this.userService.getuserName(userId);
  }

  trackByReaction(index: number, reaction: Reaction): string {
    return reaction.emoji + reaction.userIds.join('-');
  }
}
