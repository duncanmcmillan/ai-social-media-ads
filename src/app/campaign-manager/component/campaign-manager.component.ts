/**
 * @fileoverview Campaign & Ad Manager shell component.
 * Provides sub-tab navigation between Campaigns, Ad Sets, and Ads tables.
 */
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

/** Shell component for the Campaign & Ad Manager section. */
@Component({
  selector: 'app-campaign-manager',
  imports: [RouterLink, RouterLinkActive, RouterOutlet],
  templateUrl: './campaign-manager.component.html',
  styleUrl: './campaign-manager.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CampaignManagerComponent {}
