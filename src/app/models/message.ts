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
  threadMessages?: ThreadMessage[];
}


export interface ThreadMessage {
  channelId?: string;
  messageId?: string; // ID der Ursprungsnachricht
  docId?: string; // Firestore-Dokument-ID (optional, falls nicht von Firebase bereitgestellt)
  createdBy: string; // User-ID des Erstellers
  creatorName: string; // Anzeigename des Erstellers
  creatorPhotoURL: string; // Anzeige URL des Avatars
  timestamp: string | Date; // ISO-8601-Zeitstempel oder Date-Objekt
  reactions: Reaction[]; // Array von Reaktionen
  message: string; // Nachrichtentext
  isThreadMessage: boolean; // Gibt an, ob die Nachricht eine Antwort ist
  sameDay: boolean;
}

export interface Reaction {
  emoji: string; // Das verwendete Emoji
  userIds: string[]; // IDs der Nutzer, die reagiert haben
}
