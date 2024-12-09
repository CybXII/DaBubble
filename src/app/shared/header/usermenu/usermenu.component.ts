import { Component } from '@angular/core';
import { DialogComponent } from './dialog/dialog.component';

@Component({
  selector: 'app-usermenu',
  imports: [DialogComponent],
  templateUrl: './usermenu.component.html',
  styleUrl: './usermenu.component.scss',
})
export class UsermenuComponent {
  dialog: boolean = false;
  openDialog(event: Event) {
    this.dialog = true;
  }

  onDialogChange(newValue: boolean) {
    this.dialog = newValue;
  }
}
