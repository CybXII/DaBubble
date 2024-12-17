import { Component } from '@angular/core';
import { SearchresultsComponent } from './searchresults/searchresults.component';

@Component({
  selector: 'app-searchbar',
  standalone: true,
  imports: [SearchresultsComponent],
  templateUrl: './searchbar.component.html',
  styleUrl: './searchbar.component.scss'
})
export class SearchbarComponent {

}
