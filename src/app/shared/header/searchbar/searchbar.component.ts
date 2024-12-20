import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-searchbar',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './searchbar.component.html',
  styleUrl: './searchbar.component.scss',
})
export class SearchbarComponent {
  searchResultsActive = false;
  searchText: string = '';
  isSearchActive: boolean = false;

  constructor() {}

  onInputChange(): void {
    this.isSearchActive = this.searchText.length >= 1;   
  }
}
