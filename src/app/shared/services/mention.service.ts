import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class MentionService {
  mentionsUser: any = [];

  constructor() { }

  mentionSomeone(user:any) {
    if (user !== typeof {}) {
      this.mentionsUser.push(user)
    } else {
      console.error("leer!!!!!!!!!!!!!!!!!!!!!")
    }
    // funktion zur benutzererwähnung
    console.log("erwähnte User:",this.mentionsUser)
  }

  disselect(member:string) {
    for (let i = 0; i < this.mentionsUser.length; i++) {
      const user = this.mentionsUser[i];
      if (user.id === member) {
        this.mentionsUser.splice(i, 1)
      } else {
        null;
      }
    }
    console.log("erwähnte User:",this.mentionsUser)
  }
}
