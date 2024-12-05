import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { HeaderComponent } from './shared/header/header.component';
import { BuilderComponent } from './shared/builder/builder.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, HeaderComponent, BuilderComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  title = 'DABubble';
}
