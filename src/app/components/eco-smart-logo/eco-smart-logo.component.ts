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
      [ngClass]="customClass"
      class="brightness-110 contrast-125"
    />
  `,
})
export class EcoSmartLogoComponent {
  @Input() customClass: string = "w-20 h-20";
}
