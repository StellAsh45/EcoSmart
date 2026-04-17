import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-eco-smart-logo',
  standalone: true,
  imports: [CommonModule],
  template: `
    <img
      src="/assets/icon/EcoSmart-icon.png"
      alt="EcoSmart Logo"
      [ngClass]="clasePersonalizada"
      class="brightness-110 contrast-125 object-contain flex-shrink-0"
    />
  `,
})
export class EcoSmartLogoComponent {
  @Input() clasePersonalizada: string = "w-16 h-16 sm:w-20 sm:h-20";
}
