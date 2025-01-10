import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms'; // Importiere FormsModule
import { SearchService } from '../../shared/services/search.service';

@Component({
  selector: 'app-createmessage',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './createmessage.component.html',
  styleUrl: './createmessage.component.scss'
})
export class CreatemessageComponent {

  searchText: string = '';
  userResults: any[] = [];
  channelResults: any[] = [];
  mailadressResults: any[] = [];

  constructor(private searchService: SearchService) {
    this.searchService.userResults$.subscribe((results) => {
      this.userResults = results;
      console.log('Search results user:', this.userResults);
    });
    this.searchService.channelResults$.subscribe((results) => {
      this.channelResults = results;
      console.log('Search results channel:', this.channelResults);
    });
  }


  onInputChange() {
    console.log("du schreibst!");
  }




}
