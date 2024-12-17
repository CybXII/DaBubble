import { Component } from '@angular/core';
import { SearchresultsComponent } from './searchresults/searchresults.component';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-searchbar',
  standalone: true,
  imports: [SearchresultsComponent, CommonModule, FormsModule],
  templateUrl: './searchbar.component.html',
  styleUrl: './searchbar.component.scss',
})
export class SearchbarComponent {
  searchResultsActive = false;

  constructor() {}

  searchText: string = '';
  isSearchActive: boolean = false;

  onInputChange(): void {
    this.isSearchActive = this.searchText.length >= 1;
    console.log(this.searchText);
    console.log(this.isSearchActive);
    
    
  }
}
