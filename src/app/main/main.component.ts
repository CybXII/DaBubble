import { Component } from '@angular/core';
import { HeaderComponent } from '../shared/header/header.component';
import { BuilderComponent } from '../shared/builder/builder.component';

@Component({
  selector: 'app-main',
  standalone: true,   // <-- Add this line
  imports: [HeaderComponent, BuilderComponent],
  templateUrl: './main.component.html',
  styleUrl: './main.component.scss'
})
export class MainComponent {

}
