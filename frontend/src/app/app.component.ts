import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  template: `
    <nav>
      <span class="brand">AI Ad Studio</span>
    </nav>
    <router-outlet />
  `,
  styles: [`
    nav { background: #1a1a1a; color: white; padding: 0 1.5rem; height: 52px;
          display: flex; align-items: center; }
    .brand { font-weight: 700; font-size: 1.1rem; letter-spacing: -0.5px; }
  `]
})
export class AppComponent {}
