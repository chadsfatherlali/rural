import { Component, signal, OnInit, OnDestroy } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { PlacesService } from './core/services/places.service';
import { Place } from './core/models/place';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnInit, OnDestroy {

  protected readonly title = signal('rural');
  places: Place[] = [];
  loading = signal<boolean>(false);

  private destroy$ = new Subject<void>();

  constructor(private placesService: PlacesService) {}

  ngOnInit(): void {

    // Group 1: Subscribe to loading state
    this.placesService.loading$
      .pipe(takeUntil(this.destroy$))
      .subscribe(loading => {
        this.loading.set(loading);
        console.log('Loading state:', loading);
      });

    // Group 2: Subscribe to error state
    this.placesService.error$
      .pipe(takeUntil(this.destroy$))
      .subscribe(error => {
        if (error) {
          console.error('Error from PlacesService:', error);
        }
      });

    // Group 3: Load places
    this.placesService.getPlaces()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (places) => {

          // Group 3.1: Store places
          this.places = places;

          // Group 3.2: Console log results
          console.log('✅ Places loaded successfully');
          console.log('Total places:', places.length);
          console.log('All places:', places);
        },
        error: (error) => {

          // Group 4: Error handling
          console.error('❌ Error loading places:', error);
        },
        complete: () => {
          console.log('✓ Places observable completed');
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
