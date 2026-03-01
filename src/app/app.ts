import { Component, signal } from '@angular/core';
import { HeatManager } from './heat-manager/heat-manager';

@Component({
  selector: 'app-root',
  imports: [HeatManager],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  protected readonly title = signal('wave-rank');
}
