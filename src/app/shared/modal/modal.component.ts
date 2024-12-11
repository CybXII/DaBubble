import { Component, ViewEncapsulation } from '@angular/core';

@Component({
  selector: 'app-modal',
  imports: [],
  templateUrl: './modal.component.html',
  styleUrl: './modal.component.scss',
  encapsulation: ViewEncapsulation.None
})
export class ModalComponent {

  showModal: boolean = true;

  toggleShowModal(): void {
    this.showModal = !this.showModal;
  }

}
