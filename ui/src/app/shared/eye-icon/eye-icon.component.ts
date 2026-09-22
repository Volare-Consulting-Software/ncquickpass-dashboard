import { Component, Input } from '@angular/core';

/** An eye glyph (struck through when `crossed`) that inherits the surrounding text color. */
@Component({
  selector: 'app-eye-icon',
  standalone: true,
  template: `
    <svg
      [attr.width]="size"
      [attr.height]="size"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
      aria-hidden="true"
    >
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" />
      <circle cx="12" cy="12" r="3" />
      @if (crossed) {
        <path d="M3 3l18 18" />
      }
    </svg>
  `,
  styles: [':host { display: inline-flex; align-items: center; }'],
})
export class EyeIconComponent {
  /** Rendered icon size in pixels (square). */
  @Input() size = 16;

  /** Draws a slash through the eye, for the "hide" state. */
  @Input() crossed = false;
}
