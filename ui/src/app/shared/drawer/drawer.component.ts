import { Component, EventEmitter, HostListener, Input, Output } from '@angular/core';

/**
 * Minimal slide-in drawer: a fixed right-hand panel over a backdrop. Closes on
 * backdrop click or Escape. Content is projected via <ng-content>. Hand-rolled
 * (no CDK) to match the app's existing lightweight overlay style (see app-select).
 */
@Component({
  selector: 'app-drawer',
  standalone: true,
  templateUrl: './drawer.component.html',
  styleUrl: './drawer.component.scss',
})
export class DrawerComponent {
  @Input() open = false;
  @Input() title = '';
  @Output() close = new EventEmitter<void>();

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.open) this.close.emit();
  }
}
