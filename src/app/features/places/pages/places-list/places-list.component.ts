import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { Subject, Observable } from 'rxjs';
import { takeUntil, debounceTime, distinctUntilChanged } from 'rxjs/operators';

import { PlacesService } from '../../../../core/services/places.service';
import { Place } from '../../../../core/models/place';

@Component({
  selector: 'app-places-list',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './places-list.component.html',
  styleUrls: ['./places-list.component.css']
})
export class PlacesListComponent implements OnInit, OnDestroy {

  // Lifecycle control
  private destroy$ = new Subject<void>();

  // Data properties
  places$!: Observable<Place[]>;
  loading$!: Observable<boolean>;

  // UI properties
  searchControl = new FormControl('');
  filterType = new FormControl('');
  filterZone = new FormControl('');

  typesAvailable: string[] = [];
  zonesAvailable: string[] = [];

  placesFiltered: Place[] = [];

  constructor(private placesService: PlacesService) {}

  ngOnInit(): void {

    // Group 1: Initialize observables
    this.places$ = this.placesService.places$;
    this.loading$ = this.placesService.loading$;

    // Group 2: Load places
    this.loadPlaces();

    // Group 3: Setup search with debounce
    this.searchControl.valueChanges
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        takeUntil(this.destroy$)
      )
      .subscribe((term: string | null) => {
        if (term) {
          this.search(term);
        } else {
          this.places$.pipe(takeUntil(this.destroy$))
            .subscribe(places => this.placesFiltered = places);
        }
      });

    // Group 4: Filter changes
    this.filterType.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((type: string | null) => {
        if (type) {
          this.placesService.filterByType(type)
            .pipe(takeUntil(this.destroy$))
            .subscribe(places => this.placesFiltered = places);
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadPlaces(): void {

    // Group 1: Load data
    this.placesService.getPlaces()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (places) => {

          // Group 1.1: Save locally
          this.placesFiltered = places;

          // Group 1.2: Extract filter options
          this.typesAvailable = [
            ...new Set(places.map(p => p.type))
          ].sort();

          this.zonesAvailable = [
            ...new Set(places.map(p => p.zone))
          ].sort();
        },
        error: (error) => {

          // Group 2: Error handling
          console.error('Error loading places:', error);
        }
      });
  }

  private search(term: string): void {

    // Group 1: Execute search
    this.placesService.search(term)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (results) => {

          // Group 1.1: Save results
          this.placesFiltered = results;
        },
        error: (error) => {
          console.error('Error in search:', error);
        }
      });
  }

  refresh(): void {
    this.searchControl.reset();
    this.filterType.reset();
    this.loadPlaces();
  }

  clearCache(): void {
    this.placesService.clearCache();
    this.refresh();
  }

  getTypeColor(type: string): string {
    const colors: { [key: string]: string } = {
      'PUESTO DE SALUD': '#ef4444',           // red-500
      'CENTRO DE SALUD A': '#f97316',         // orange-500
      'CENTRO DE SALUD B': '#eab308',         // yellow-500
      'CENTRO DE SALUD C': '#22c55e',         // green-500
      'HOSPITAL BASICO': '#3b82f6',           // blue-500
      'HOSPITAL GENERAL': '#8b5cf6',          // purple-500
      'HOSPITAL ESPECIALIZADO': '#ec4899'     // pink-500
    };

    return colors[type] || '#6b7280'; // gray-500 as default
  }
}
