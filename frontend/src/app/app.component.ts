import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ImageModule } from 'primeng/image';

@Component({
  selector: 'app-root',
  imports: [
    RouterOutlet,
    ImageModule
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  title = 'frontend';
}
