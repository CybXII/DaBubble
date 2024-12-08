import { Component } from '@angular/core';

@Component({
  selector: 'app-dialog',
  imports: [],
  templateUrl: './dialog.component.html',
  styleUrl: './dialog.component.scss',
})
export class DialogComponent {
  profileDialog: boolean = false;
  profileDialogEdit: boolean = false;

 dontCloseDialog(event: Event) {
  event?.preventDefault();
  event.stopPropagation();

}

  logout(){
    console.log("logout");
  }

  openProfile(){
    console.log("profile");
  }

  openProfileEdit(){
    console.log("profile edit");
  }
  

}
