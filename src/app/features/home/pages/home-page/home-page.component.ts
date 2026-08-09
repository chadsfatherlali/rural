import { Component, OnInit, ViewChild, ElementRef, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormControl } from '@angular/forms';
import { Observable, Subject } from 'rxjs';
import { debounceTime, startWith, takeUntil, map } from 'rxjs/operators';

import { PlacesService } from '../../../../core/services/places.service';
import { Place } from '../../../../core/models/place';

declare var google: any;

@Component({
  selector: 'app-home-page',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule
  ],
  templateUrl: './home-page.component.html',
  styleUrl: './home-page.component.css'
})
export class HomePageComponent implements OnInit, OnDestroy {

  @ViewChild('mapContainer', { static: false }) mapContainer!: ElementRef;
  @ViewChild('streetViewContainer', { static: false }) streetViewContainer!: ElementRef;
  map: any = null;
  mapInitialized = false;
  streetViewActive = false;
  streetView: any = null;

  // Group 1: Autocomplete properties
  searchControl = new FormControl('');
  filteredPlaces$!: Observable<Place[]>;
  allPlaces: Place[] = [];

  private destroy$ = new Subject<void>();

  constructor(private placesService: PlacesService, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {

    // Group 1: Load places from service
    this.placesService.places$
      .pipe(takeUntil(this.destroy$))
      .subscribe(places => {
        this.allPlaces = places;
      });

    // Group 2: Setup autocomplete filtering
    this.filteredPlaces$ = this.searchControl.valueChanges.pipe(
      startWith(''),
      debounceTime(300),
      map(value => this._filterPlaces(value || '')),
      takeUntil(this.destroy$)
    );

    // Group 3: Initialize map
    this.initializeMap();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // Group 3: Autocomplete filtering
  private _filterPlaces(value: string): Place[] {

    // Group 1: Normalize filter value
    const filterValue = value.toLowerCase().trim();

    if (!filterValue) {
      return [];
    }

    // Group 2: Filter places by code field
    return this.allPlaces.filter(place =>
      place.code.toLowerCase().includes(filterValue)
    );
  }

  // Group 4: Handle place selection
  onPlaceSelected(place: Place): void {

    if (!place.hasLocation) {
      console.warn('Place does not have location data:', place);
      return;
    }

    // Group 1: Center map on selected place with zoom 15
    this.centerMap(place.latitude, place.longitude, 20);

    // Group 2: Add marker for selected place
    this.addMarker(place);

    // Group 3: Clear search
    this.searchControl.reset();
  }

  private initializeMap(): void {

    // Group 1: Wait for Google Maps to be loaded
    this.waitForGoogleMaps().then(() => {
      this.createMap();
    }).catch((error: any) => {
      console.error('❌ Error loading Google Maps:', error);
    });
  }

  private waitForGoogleMaps(): Promise<void> {

    return new Promise((resolve, reject) => {

      // Group 1: Check if Google Maps is already loaded
      if (typeof google !== 'undefined' && google.maps) {
        resolve();
        return;
      }

      // Group 2: Wait for Google to be available (max 10 seconds)
      let attempts = 0;
      const maxAttempts = 100; // 100 * 100ms = 10 seconds

      const checkGoogle = setInterval(() => {
        attempts++;

        if (typeof google !== 'undefined' && google.maps) {
          clearInterval(checkGoogle);
          resolve();
        } else if (attempts >= maxAttempts) {
          clearInterval(checkGoogle);
          reject(new Error('Google Maps API did not load within 10 seconds'));
        }
      }, 100);
    });
  }

  private createMap(): void {

    // Group 1: Set default center (Ecuador center)
    const defaultCenter = { lat: -1.831239, lng: -78.183406 };

    // Group 2: Create map options
    const mapOptions = {
      zoom: 7,
      center: defaultCenter,
      mapTypeId: google.maps.MapTypeId.ROADMAP,
      fullscreenControl: true,
      zoomControl: true,
      streetViewControl: false,
      mapTypeControl: true
    };

    // Group 3: Initialize map after view init
    setTimeout(() => {
      if (this.mapContainer && this.mapContainer.nativeElement) {
        this.map = new google.maps.Map(
          this.mapContainer.nativeElement,
          mapOptions
        );
        this.mapInitialized = true;
        console.log('✅ Google Maps initialized successfully');
      }
    }, 100);
  }

  addMarker(place: Place): void {

    if (!this.map) return;

    // Group 1: Create marker
    const marker = new google.maps.Marker({
      position: { lat: place.latitude, lng: place.longitude },
      map: this.map,
      title: place.name
    });

    // Group 2: Create info window with detailed information
    const infoWindow = new google.maps.InfoWindow({
      content: `
        <div style="padding: 12px; font-family: Arial, sans-serif; width: 300px;">
          <h3 style="margin: 0 0 12px 0; font-weight: 600; color: #333; font-size: 0.95rem;">
            ${place.name}
          </h3>
          
          <div style="border-top: 1px solid #e0e0e0; padding-top: 8px; font-size: 0.85rem;">
            <div style="margin-bottom: 8px;">
              <span style="font-weight: 600; color: #666;">Establecimiento Unico:</span>
              <span style="color: #333; margin-left: 4px;">${place.id}</span>
            </div>
            
            <div style="margin-bottom: 8px;">
              <span style="font-weight: 600; color: #666;">Código:</span>
              <span style="color: #ef4444; margin-left: 4px; font-family: 'Courier New';">${place.code}</span>
            </div>
            
            <div style="margin-bottom: 8px;">
              <span style="font-weight: 600; color: #666;">Tipología:</span>
              <span style="color: #333; margin-left: 4px;">${place.type}</span>
            </div>
            
            <div style="margin-bottom: 8px;">
              <span style="font-weight: 600; color: #666;">Número de Plazas:</span>
              <span style="color: #333; margin-left: 4px;">${place.availableSlots}</span>
            </div>
            
            <div style="margin-bottom: 12px;">
              <span style="font-weight: 600; color: #666;">Carrera:</span>
              <span style="color: #333; margin-left: 4px;">${place.specialization}</span>
            </div>
          </div>
          
          <div style="border-top: 1px solid #e0e0e0; padding-top: 8px; margin-top: 8px;">
            <button id="streetview-btn-${place.id}" style="
              width: 100%;
              padding: 8px 12px;
              background: #ef4444;
              color: white;
              border: none;
              border-radius: 4px;
              font-size: 0.85rem;
              font-weight: 600;
              cursor: pointer;
              transition: background 0.2s ease;
            " onmouseover="this.style.background='#dc2626'" onmouseout="this.style.background='#ef4444'">
              Ver Lugar en Street View
            </button>
          </div>
          
          <div style="border-top: 1px solid #e0e0e0; padding-top: 8px; margin-top: 8px; font-size: 0.8rem; color: #999;">
            <div>${place.province} - ${place.canton}</div>
          </div>
        </div>
      `
    });

    // Group 3: Show info window on marker click
    marker.addListener('click', () => {
      infoWindow.open(this.map, marker);
      
      // Group 4: Add event listener to button after info window opens
      setTimeout(() => {
        const button = document.getElementById(`streetview-btn-${place.id}`);
        if (button) {
          button.addEventListener('click', () => {
            this.viewPlaceStreetView(place.latitude, place.longitude);
          });
        }
      }, 100);
    });

    // Group 5: Open info window automatically
    infoWindow.open(this.map, marker);

    // Group 6: Add event listener to button after initial opening
    setTimeout(() => {
      const button = document.getElementById(`streetview-btn-${place.id}`);
      if (button) {
        button.addEventListener('click', () => {
          this.viewPlaceStreetView(place.latitude, place.longitude);
        });
      }
    }, 100);
  }

  centerMap(lat: number, lng: number, zoom: number = 12): void {

    if (!this.map) return;

    this.map.setCenter({ lat, lng });
    this.map.setZoom(zoom);
  }

  // Group 5: Street View functionality
  viewPlaceStreetView(lat: number, lng: number): void {

    // Group 1: Initialize Street View
    this.initializeStreetView(lat, lng);
  }

  private initializeStreetView(lat: number, lng: number): void {

    // Group 1: Update state to show container
    console.log('Initializing Street View at:', lat, lng);
    this.streetViewActive = true;

    // Group 2: Force change detection to render the container
    this.cdr.detectChanges();

    // Group 3: Wait for container to be rendered
    setTimeout(() => {
      if (!this.streetViewContainer) {
        console.error('Street View container not found');
        return;
      }

      if (!this.streetViewContainer.nativeElement) {
        console.error('Street View container native element not found');
        return;
      }

      const containerElement = this.streetViewContainer.nativeElement;
      console.log('Container element:', containerElement);

      try {
        // Group 4: Create Street View panorama
        this.streetView = new google.maps.StreetViewPanorama(
          containerElement,
          {
            position: { lat, lng },
            pov: {
              heading: 0,
              pitch: 0
            },
            zoom: 1,
            fullscreenControl: true,
            panControl: true
          }
        );

        console.log('✅ Street View initialized successfully');
      } catch (error) {
        console.error('Error initializing Street View:', error);
        this.streetViewActive = false;
      }
    }, 500);
  }

  closeStreetView(): void {

    // Group 1: Clean up Street View
    if (this.streetView) {
      this.streetView = null;
    }

    // Group 2: Update state
    this.streetViewActive = false;
    console.log('Street View closed');
  }
}
