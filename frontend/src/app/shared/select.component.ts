import {
  Component,
  ElementRef,
  EventEmitter,
  HostListener,
  Input,
  Output,
  inject,
} from '@angular/core';

export interface SelectOption {
  label: string;
  value: number | string;
}

/**
 * Lightweight themed dropdown (button + popover), styled with the app tokens so
 * it matches the chips, buttons, and date picker. Closes on outside-click / Esc.
 */
@Component({
  selector: 'app-select',
  standalone: true,
  template: `
    <div class="select" [class.open]="open" [class.disabled]="disabled">
      <button
        type="button"
        class="trigger"
        (click)="toggle()"
        [disabled]="disabled"
        [attr.aria-expanded]="open"
      >
        <span class="label">{{ selectedLabel }}</span>
        <span class="caret" aria-hidden="true">▾</span>
      </button>
      @if (open) {
        <ul class="menu" role="listbox">
          @for (o of options; track o.value) {
            <li
              role="option"
              [attr.aria-selected]="o.value === value"
              [class.selected]="o.value === value"
              (click)="choose(o.value)"
            >
              <span>{{ o.label }}</span>
              @if (o.value === value) {
                <span class="check" aria-hidden="true">✓</span>
              }
            </li>
          }
        </ul>
      }
    </div>
  `,
  styles: [
    `
      .select {
        position: relative;
        display: inline-block;
      }
      .trigger {
        display: inline-flex;
        align-items: center;
        justify-content: space-between;
        gap: 0.6rem;
        min-width: 9rem;
        padding: 0.4rem 0.6rem;
        border: 1px solid var(--border);
        border-radius: 8px;
        background: var(--bg);
        color: var(--text);
        font: inherit;
        font-size: 0.82rem;
        cursor: pointer;
      }
      .trigger:hover:not(:disabled) {
        border-color: var(--accent);
      }
      .select.open .trigger {
        border-color: var(--accent);
        box-shadow: 0 0 0 2px var(--accent-dim);
      }
      .caret {
        color: var(--accent);
        font-size: 0.7rem;
      }
      .menu {
        position: absolute;
        top: calc(100% + 4px);
        right: 0;
        z-index: 40;
        margin: 0;
        padding: 0.25rem;
        list-style: none;
        min-width: 100%;
        background: var(--surface);
        border: 1px solid var(--border);
        border-radius: 10px;
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
      }
      .menu li {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 1.25rem;
        padding: 0.45rem 0.6rem;
        border-radius: 6px;
        font-size: 0.85rem;
        white-space: nowrap;
        cursor: pointer;
      }
      .menu li:hover {
        background: var(--bg);
      }
      .menu li.selected {
        background: var(--accent-dim);
        color: var(--accent-dark);
        font-weight: 600;
      }
      .check {
        color: var(--accent);
      }
      .select.disabled {
        opacity: 0.55;
        pointer-events: none;
      }
    `,
  ],
})
export class SelectComponent {
  @Input() options: SelectOption[] = [];
  @Input() value: number | string | null = null;
  @Input() disabled = false;
  @Output() valueChange = new EventEmitter<number | string>();

  open = false;
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  get selectedLabel(): string {
    return this.options.find((o) => o.value === this.value)?.label ?? 'Select…';
  }

  toggle(): void {
    if (!this.disabled) this.open = !this.open;
  }

  choose(value: number | string): void {
    this.value = value;
    this.valueChange.emit(value);
    this.open = false;
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (this.open && !this.host.nativeElement.contains(event.target as Node)) {
      this.open = false;
    }
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.open = false;
  }
}
