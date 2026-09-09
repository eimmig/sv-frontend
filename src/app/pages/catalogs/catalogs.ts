import { Component } from '@angular/core';
import { MatTabsModule } from '@angular/material/tabs';
import { TranslocoPipe } from '@jsverse/transloco';

import { CatalogManager } from '../../shared/catalog-manager/catalog-manager';

@Component({
  imports: [MatTabsModule, TranslocoPipe, CatalogManager],
  selector: 'app-catalogs',
  styleUrl: './catalogs.scss',
  templateUrl: './catalogs.html',
})
export class Catalogs {}
