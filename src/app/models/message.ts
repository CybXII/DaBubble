import { BehaviorSubject } from "rxjs";

export interface Message {
  docId?: string;
  channelId?: string;
  createdBy: string;
  creatorName: string;
  creatorPhotoURL: string;
  recipientId?: string;
  description?: string;
  members: string[];
  timestamp: string | Date;
  reactions: Reaction[];
  message: string;
  sameDay: boolean;
  threadMessages$?: BehaviorSubject<ThreadMessage[]>;
}


export interface ThreadMessage {
  channelId?: string;
  messageId?: string;
  docId?: string;
  createdBy: string;
  creatorName: string; 
  creatorPhotoURL: string;
  timestamp: string | Date;
  reactions: Reaction[];
  message: string;
  isThreadMessage: boolean;
  sameDay: boolean;
}

export interface Reaction {
  emoji: string; // Das verwendete Emoji
  userIds: string[]; // IDs der Nutzer, die reagiert haben
}
