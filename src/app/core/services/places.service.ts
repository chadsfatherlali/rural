import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, map, tap, catchError } from 'rxjs';
import { throwError } from 'rxjs';

import { Place } from '../models/place';

@Injectable({
  providedIn: 'root'
})
export class PlacesService {

  private readonly CSV_URL = 'plazas_msp_septiembre_2025_agosto_2026_con_coords.csv';
  private readonly CACHE_KEY = 'places_cache';
  private readonly CACHE_TIMEOUT = 24 * 60 * 60 * 1000; // 24 hours

  private placesSubject = new BehaviorSubject<Place[]>([]);
  public places$ = this.placesSubject.asObservable();

  private loadingSubject = new BehaviorSubject<boolean>(false);
  public loading$ = this.loadingSubject.asObservable();

  private errorSubject = new BehaviorSubject<string | null>(null);
  public error$ = this.errorSubject.asObservable();

  constructor(private http: HttpClient) {
    this.initializePlaces();
  }

  // Group 1: Initialization
  private initializePlaces(): void {

    // Group 1.1: Try to load from cache
    const placesFromCache = this.loadFromCache();
    if (placesFromCache && placesFromCache.length > 0) {
      this.placesSubject.next(placesFromCache);
      return;
    }

    // Group 1.2: Load from file
    this.getPlaces();
  }

  // Group 2: Load data
  getPlaces(): Observable<Place[]> {

    // Group 2.1: Set loading state
    this.loadingSubject.next(true);
    this.errorSubject.next(null);

    // Group 2.2: Fetch CSV
    return this.http.get(this.CSV_URL, { responseType: 'text' })
      .pipe(
        map(csvContent => this.parseCsv(csvContent)),
        tap(places => {

          // Group 2.3: Save to subject
          this.placesSubject.next(places);

          // Group 2.4: Save to cache
          this.saveToCache(places);

          // Group 2.5: Update loading state
          this.loadingSubject.next(false);
        }),
        catchError(error => {

          // Group 2.6: Error handling
          const errorMsg = 'Error loading health care places';
          this.errorSubject.next(errorMsg);
          this.loadingSubject.next(false);
          console.error('Error in getPlaces:', error);

          return throwError(() => new Error(errorMsg));
        })
      );
  }

  // Group 3: CSV parsing
  private parseCsv(csvContent: string): Place[] {

    // Group 3.1: Split lines
    const lines = csvContent.trim().split('\n');
    const places: Place[] = [];

    // Group 3.2: Process each line (skip header)
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();

      // Skip empty lines
      if (!line) continue;

      // Group 3.3: Parse values
      try {
        const place = this.parseLine(line);
        if (place) {
          places.push(place);
        }
      } catch (error) {
        console.warn(`Error parsing line ${i}:`, line);
        continue;
      }
    }

    // Group 3.4: Return processed places
    console.log(`Loaded ${places.length} places successfully`);
    return places;
  }

  private parseLine(line: string): Place | null {

    // Group 1: Split by commas
    const values = line.split(',').map(v => v.trim());

    // Group 2: Validate column count
    if (values.length < 12) {
      return null;
    }

    // Group 3: Extract and type values
    const id = parseInt(values[0]) || 0;
    const latitude = parseFloat(values[11]) || 0;
    const longitude = parseFloat(values[12]) || 0;
    const availableSlots = parseInt(values[8]) || 0;

    // Group 4: Build Place object
    return {
      id,
      zone: values[1],
      district: values[2],
      province: values[3],
      canton: values[4],
      code: values[5],
      name: values[6],
      type: values[7],
      availableSlots,
      specialization: values[9],
      page: parseInt(values[10]) || 0,
      latitude,
      longitude,
      hasLocation: latitude !== 0 && longitude !== 0
    };
  }

  // Group 4: Search and filtering
  search(term: string): Observable<Place[]> {
    return this.places$.pipe(
      map(places => {

        // Group 1: Normalize term
        const termLower = term.toLowerCase().trim();

        // Group 2: Filter matches
        return places.filter(place =>
          place.name.toLowerCase().includes(termLower) ||
          place.province.toLowerCase().includes(termLower) ||
          place.canton.toLowerCase().includes(termLower) ||
          place.zone.toLowerCase().includes(termLower) ||
          place.code.includes(termLower)
        );
      })
    );
  }

  filterByProvince(province: string): Observable<Place[]> {
    return this.places$.pipe(
      map(places =>
        places.filter(p => p.province === province)
      )
    );
  }

  filterByType(type: string): Observable<Place[]> {
    return this.places$.pipe(
      map(places =>
        places.filter(p => p.type === type)
      )
    );
  }

  filterByZone(zone: string): Observable<Place[]> {
    return this.places$.pipe(
      map(places =>
        places.filter(p => p.zone === zone)
      )
    );
  }

  // Group 5: Get single place
  getByCode(code: string): Observable<Place | undefined> {
    return this.places$.pipe(
      map(places =>
        places.find(p => p.code === code)
      )
    );
  }

  // Group 6: Statistics
  getStatistics(): Observable<{
    total: number;
    withLocation: number;
    withoutLocation: number;
    totalSlots: number;
    provinces: Set<string>;
    types: Set<string>;
  }> {
    return this.places$.pipe(
      map(places => ({
        total: places.length,
        withLocation: places.filter(p => p.hasLocation).length,
        withoutLocation: places.filter(p => !p.hasLocation).length,
        totalSlots: places.reduce((sum, p) => sum + p.availableSlots, 0),
        provinces: new Set(places.map(p => p.province)),
        types: new Set(places.map(p => p.type))
      }))
    );
  }

  // Group 7: Sorting
  sortBy(places: Place[], field: keyof Place, ascending: boolean = true): Place[] {
    return [...places].sort((a, b) => {
      const valA = a[field];
      const valB = b[field];

      if (valA === undefined || valB === undefined) return 0;
      if (valA < valB) return ascending ? -1 : 1;
      if (valA > valB) return ascending ? 1 : -1;
      return 0;
    });
  }

  // Group 8: Cache management
  private saveToCache(places: Place[]): void {
    const cacheData = {
      places,
      timestamp: Date.now()
    };
    try {
      localStorage.setItem(this.CACHE_KEY, JSON.stringify(cacheData));
    } catch (error) {
      console.error('Error saving to cache:', error);
    }
  }

  private loadFromCache(): Place[] | null {

    // Group 1: Get from storage
    try {
      const cached = localStorage.getItem(this.CACHE_KEY);
      if (!cached) return null;

      // Group 2: Validate and parse
      const { places, timestamp } = JSON.parse(cached);

      // Group 3: Check expiration
      if (Date.now() - timestamp > this.CACHE_TIMEOUT) {
        localStorage.removeItem(this.CACHE_KEY);
        return null;
      }

      return places;
    } catch (error) {
      console.error('Error loading cache:', error);
      try {
        localStorage.removeItem(this.CACHE_KEY);
      } catch (e) {
        // ignore
      }
      return null;
    }
  }

  clearCache(): void {
    try {
      localStorage.removeItem(this.CACHE_KEY);
    } catch (error) {
      console.error('Error clearing cache:', error);
    }
    this.placesSubject.next([]);
  }
}
