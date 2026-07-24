import { Component, Input, signal } from '@angular/core';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { Dispute } from '../../../../core/models/Dispute';
import { TransactionView } from '../../../../core/models/TransactionView';
import { DrawerComponent } from '../../../../shared/drawer/drawer.component';
import { TollExceptionsService } from '../../../../core/services/toll-exceptions.service';

@Component({
  selector: 'app-toll-exceptions',
  standalone: true,
  imports: [CurrencyPipe, DatePipe, DrawerComponent],
  templateUrl: './toll-exceptions.component.html',
  styleUrl: './toll-exceptions.component.scss',
})
export class TollExceptionsComponent {
  @Input() disputes: Dispute[] = [];
  @Input() violations: TransactionView[] = [];
  @Input() loading = false;

  readonly selected = signal<Dispute | null>(null);

  constructor(private readonly tollExceptions: TollExceptionsService) {}

  badgeClass(dispute: Dispute): string {
    if (dispute.decision === 'approved') return 'badge-approved';
    if (dispute.decision === 'denied') return 'badge-denied';
    return 'badge-pending';
  }

  badgeLabel(dispute: Dispute): string {
    if (dispute.decision === 'approved') return 'Approved';
    if (dispute.decision === 'denied') return 'Denied';
    return dispute.status === 'Filed' ? 'Filed' : 'Under review';
  }

  open(dispute: Dispute): void {
    this.selected.set(dispute);
  }

  close(): void {
    this.selected.set(null);
  }

  imageUrl(documentId: string): string {
    return this.tollExceptions.documentUrl(documentId);
  }
}
