import { Component, EventEmitter, Input, Output, signal } from '@angular/core';
import { VehicleView } from '../../../../core/models/VehicleView';
import { FutureDeclaration } from '../../../../core/models/FutureDeclaration';
import { DrawerComponent } from '../../../../shared/drawer/drawer.component';
import { WeeklySchedulePanelComponent } from '../weekly-schedule-panel/weekly-schedule-panel.component';
import { UpcomingDeclarationsPanelComponent } from '../upcoming-declarations-panel/upcoming-declarations-panel.component';

type Tab = 'weekly' | 'upcoming';

/**
 * The single "Scheduled" drawer: a Weekly tab (edit the recurring schedule) and an
 * Upcoming tab (the materialized future declarations, with a count badge). Replaces
 * the two separate drawer buttons.
 */
@Component({
  selector: 'app-scheduled-drawer',
  standalone: true,
  imports: [DrawerComponent, WeeklySchedulePanelComponent, UpcomingDeclarationsPanelComponent],
  templateUrl: './scheduled-drawer.component.html',
  styleUrl: './scheduled-drawer.component.scss',
})
export class ScheduledDrawerComponent {
  @Input() open = false;
  @Input() vehicles: VehicleView[] = [];
  @Input() upcoming: FutureDeclaration[] = [];
  @Input() busyId: string | null = null;
  @Output() close = new EventEmitter<void>();
  @Output() saved = new EventEmitter<string>();
  @Output() cancelUpcoming = new EventEmitter<string>();

  readonly tab = signal<Tab>('weekly');

  setTab(tab: Tab): void {
    this.tab.set(tab);
  }
}
