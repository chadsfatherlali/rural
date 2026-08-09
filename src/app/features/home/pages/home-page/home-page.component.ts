import { Component, OnInit, ViewChild, ElementRef, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormControl } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatOptionModule } from '@angular/material/core';
import { MatInputModule } from '@angular/material/input';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Observable, Subject } from 'rxjs';
import { debounceTime, startWith, takeUntil, map } from 'rxjs/operators';
import { MarkerClusterer, Cluster } from '@googlemaps/markerclusterer';

import { PlacesService } from '../../../../core/services/places.service';
import { Place } from '../../../../core/models/place';

declare var google: any;

@Component({
  selector: 'app-home-page',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatSelectModule,
    MatOptionModule,
    MatInputModule,
    MatAutocompleteModule,
    MatSidenavModule,
    MatButtonModule,
    MatIconModule
  ],
  templateUrl: './home-page.component.html',
  styleUrl: './home-page.component.css'
})
export class HomePageComponent implements OnInit, OnDestroy {

  @ViewChild('mapContainer', { static: false }) mapContainer!: ElementRef;
  @ViewChild('streetViewContainer', { static: false }) streetViewContainer!: ElementRef;
  @ViewChild('sidenav') sidenav: any;
  map: any = null;
  mapInitialized = false;
  streetViewActive = false;
  streetView: any = null;
  markerClusterer: any = null;
  markersMap: Map<number, any> = new Map(); // Store markers by place ID
  allMarkers: any[] = []; // Store all markers for clustering
  sidenavOpen = false;
  isMobile = false;
  sidenavMode: 'side' | 'over' = 'side';
  controlAdded = false; // Flag to prevent duplicate controls

  // Group 1: Autocomplete properties
  searchControl = new FormControl('');
  specializationControl = new FormControl<string[]>([]);
  provinceControl = new FormControl<string[]>([]);
  filteredPlaces$!: Observable<Place[]>;
  allPlaces: Place[] = [];
  placesWithLocation: Place[] = []; // Only places with valid coordinates
  specializationList: string[] = []; // List of unique specializations
  provinceList: string[] = []; // List of unique provinces

  private destroy$ = new Subject<void>();

  constructor(private placesService: PlacesService, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {

    // Group 0: Detect screen size and setup responsive behavior
    this.updateSidenavMode();
    window.addEventListener('resize', () => this.updateSidenavMode());

    // Group 1: Load places from service
    this.placesService.places$
      .pipe(takeUntil(this.destroy$))
      .subscribe(places => {
        this.allPlaces = places;
        
        // Group 1.1: Filter places with valid coordinates
        this.placesWithLocation = places.filter(p => p.hasLocation);
        console.log(`📍 Loaded ${this.placesWithLocation.length} places with coordinates`);

        // Group 1.2: Extract unique specializations
        const specializations = new Set(places.map(p => p.specialization).filter(s => s));
        this.specializationList = Array.from(specializations).sort();
        console.log(`🔧 Found ${this.specializationList.length} unique specializations`);

        // Group 1.3: Select all specializations by default
        this.specializationControl.setValue(this.specializationList);

        // Group 1.4: Extract unique provinces
        const provinces = new Set(places.map(p => p.province).filter(p => p));
        this.provinceList = Array.from(provinces).sort();
        console.log(`🗺️ Found ${this.provinceList.length} unique provinces`);

        // Group 1.5: Select all provinces by default
        this.provinceControl.setValue(this.provinceList);

        // Group 1.6: Initialize markers after places are loaded
        if (this.mapInitialized && this.placesWithLocation.length > 0) {
          this.addAllMarkers();
        }
      });

    // Group 2: Setup autocomplete filtering
    this.filteredPlaces$ = this.searchControl.valueChanges.pipe(
      startWith(''),
      debounceTime(300),
      map(value => this._filterPlacesByCode(value || '')),
      takeUntil(this.destroy$)
    );

    // Group 3: Setup specialization filtering
    this.specializationControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(selectedSpecializations => {
        this.applyFilters();
      });

    // Group 4: Setup province filtering
    this.provinceControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(selectedProvinces => {
        this.applyFilters();
      });

    // Group 5: Initialize map
    this.initializeMap();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // Group 3: Autocomplete filtering
  private _filterPlacesByCode(value: string): Place[] {

    // Group 1: Normalize filter value
    const filterValue = value.toLowerCase().trim();

    // Group 2: Get current filter values
    const selectedSpecializations = this.specializationControl.value || [];
    const selectedProvinces = this.provinceControl.value || [];

    // Group 3: Filter places by code and active filters
    let results = this.allPlaces.filter(place => {
      
      // Check if place matches code search
      const codeMatch = filterValue === '' || place.code.toLowerCase().includes(filterValue);
      
      // Check specialization filter
      const specializationMatch = selectedSpecializations.length === 0 || 
                                 selectedSpecializations.includes(place.specialization);
      
      // Check province filter
      const provinceMatch = selectedProvinces.length === 0 || 
                           selectedProvinces.includes(place.province);
      
      return codeMatch && specializationMatch && provinceMatch;
    });

    return results;
  }

  private filterPlacesBySpecialization(selectedSpecializations: string[]): void {

    // Group 1: If no specializations selected, show all places with location
    if (!selectedSpecializations || selectedSpecializations.length === 0) {
      this.placesWithLocation = this.allPlaces.filter(p => p.hasLocation);
      console.log(`📍 Showing all ${this.placesWithLocation.length} places`);
    } else {

      // Group 2: Filter places by selected specializations
      this.placesWithLocation = this.allPlaces.filter(p => 
        p.hasLocation && selectedSpecializations.includes(p.specialization)
      );
      console.log(`🔧 Filtered to ${this.placesWithLocation.length} places by specialization`);
    }

    // Group 3: Update markers visibility on map
    this.updateMarkersDisplay();
  }

  private applyFilters(): void {

    // Group 1: Get filter values
    const selectedSpecializations = this.specializationControl.value || [];
    const selectedProvinces = this.provinceControl.value || [];

    console.log(`🔍 Applying filters - Specializations: ${selectedSpecializations.length}, Provinces: ${selectedProvinces.length}`);

    // Group 2: Apply both filters
    this.placesWithLocation = this.allPlaces.filter(p => {
      const hasLocation = p.hasLocation;
      
      // Check specialization filter
      const specializationMatch = selectedSpecializations.length === 0 || 
                                 selectedSpecializations.includes(p.specialization);
      
      // Check province filter
      const provinceMatch = selectedProvinces.length === 0 || 
                           selectedProvinces.includes(p.province);
      
      return hasLocation && specializationMatch && provinceMatch;
    });

    console.log(`📊 Filtered to ${this.placesWithLocation.length} places`);

    // Group 3: Update markers on map
    this.updateMarkersDisplay();
  }

  private updateMarkersDisplay(): void {

    if (!this.map || !this.markerClusterer || this.allMarkers.length === 0) return;

    // Group 1: Get both filter values
    const selectedSpecializations = this.specializationControl.value || [];
    const selectedProvinces = this.provinceControl.value || [];

    console.log(`👁️ Updating markers. Specializations: ${selectedSpecializations.length}, Provinces: ${selectedProvinces.length}`);

    // Group 2: Filter markers to show based on BOTH filters
    const visibleMarkers: any[] = [];

    this.allMarkers.forEach(marker => {
      const placeId = Array.from(this.markersMap.entries()).find(
        ([_, { marker: m }]) => m === marker
      )?.[0];

      if (placeId) {
        const placeData = this.markersMap.get(placeId);
        if (placeData) {
          const place = placeData.place;

          // Check specialization filter
          const specializationMatch = selectedSpecializations.length === 0 || 
                                     selectedSpecializations.includes(place.specialization);
          
          // Check province filter
          const provinceMatch = selectedProvinces.length === 0 || 
                               selectedProvinces.includes(place.province);
          
          // Show marker only if BOTH filters match
          const shouldShow = specializationMatch && provinceMatch;
          
          if (shouldShow) {
            visibleMarkers.push(marker);
          }
        }
      }
    });

    // Group 3: Recreate MarkerClusterer with only visible markers
    if (this.markerClusterer) {
      this.markerClusterer.clearMarkers();
    }

    // Create new clusterer with filtered markers
    this.markerClusterer = new MarkerClusterer({
      map: this.map,
      markers: visibleMarkers,
      renderer: {
        render: (cluster: Cluster) => {
          return this.createClusterMarker(cluster);
        }
      }
    });

    console.log(`🔄 Markers clustering refreshed. Visible: ${visibleMarkers.length}/${this.allMarkers.length}`);
  }

  // Group 4: Handle place selection
  onPlaceSelected(place: Place): void {

    if (!place.hasLocation) {
      console.warn('Place does not have location data:', place);
      return;
    }

    // Group 1: Center map on selected place
    this.centerMap(place.latitude, place.longitude, 20);

    // Group 2: Show marker info
    this.showMarkerInfo(place);

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
      fullscreenControl: false,
      zoomControl: true,
      zoomControlOptions: {
        position: google.maps.ControlPosition.BOTTOM_LEFT
      },
      streetViewControl: false,
      mapTypeControl: true,
      mapTypeControlOptions: {
        position: google.maps.ControlPosition.BOTTOM_LEFT
      }
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

        // Group 4: Load all markers if places are already loaded
        if (this.placesWithLocation.length > 0) {
          console.log('📍 Adding markers to map...');
          this.addAllMarkers();
        }
      }
    }, 100);
  }

  private addAllMarkers(): void {

    if (!this.map || this.allMarkers.length > 0) return;

    console.log(`🔄 Creating ${this.placesWithLocation.length} markers...`);

    // Group 1: Create markers for all places with location
    const startTime = performance.now();

    this.placesWithLocation.forEach(place => {
      const marker = new google.maps.Marker({
        position: { lat: place.latitude, lng: place.longitude },
        map: null, // Don't add to map directly, MarkerClusterer will handle it
        title: place.name
      });

      // Group 1.1: Store marker reference
      this.markersMap.set(place.id, { marker, place });
      this.allMarkers.push(marker);
    });

    // Group 2: Initialize MarkerClusterer with custom renderer
    this.markerClusterer = new MarkerClusterer({
      map: this.map,
      markers: this.allMarkers,
      renderer: {
        render: (cluster: Cluster) => {
          return this.createClusterMarker(cluster);
        }
      }
    });

    // Group 3: Add click listeners to markers
    this.allMarkers.forEach((marker, index) => {
      marker.addListener('click', () => {
        const placeId = Array.from(this.markersMap.entries()).find(
          ([_, { marker: m }]) => m === marker
        )?.[0];

        if (placeId) {
          const placeData = this.markersMap.get(placeId);
          if (placeData) {
            this.centerMap(placeData.place.latitude, placeData.place.longitude, 20);
            this.showMarkerInfo(placeData.place);
          }
        }
      });
    });

    const endTime = performance.now();
    console.log(`✅ Markers created and clustered in ${(endTime - startTime).toFixed(2)}ms`);
  }

  private createClusterMarker(cluster: Cluster): any {
    const count = cluster.count;
    const bounds = cluster.bounds;

    // Determinar color basado en la cantidad de markers
    let backgroundColor = '#ef4444'; // Rojo por defecto
    let textColor = '#ffffff';

    // Si es azul (bajo número de markers), quitarle el rojo
    if (count <= 10) {
      backgroundColor = '#3b82f6'; // Azul
      textColor = '#ffffff';
    } else if (count <= 50) {
      backgroundColor = '#60a5fa'; // Azul más claro
      textColor = '#ffffff';
    } else if (count <= 100) {
      backgroundColor = '#93c5fd'; // Azul muy claro
      textColor = '#1f2937';
    } else {
      backgroundColor = '#ef4444'; // Rojo para muchos markers
      textColor = '#ffffff';
    }

    // Crear SVG personalizado
    const svg = `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40" width="40" height="40">
        <circle cx="20" cy="20" r="18" fill="${backgroundColor}" stroke="white" stroke-width="2"/>
        <text x="20" y="24" font-size="14" font-weight="bold" text-anchor="middle" fill="${textColor}">${count}</text>
      </svg>
    `;

    // Convertir SVG a data URL
    const svgDataUrl = `data:image/svg+xml;base64,${btoa(svg)}`;

    // Crear marker con la imagen SVG
    const clusterMarker = new google.maps.Marker({
      position: bounds?.getCenter(),
      icon: {
        url: svgDataUrl,
        scaledSize: new google.maps.Size(40, 40),
        anchor: new google.maps.Point(20, 20)
      },
      title: `${count} lugares`
    });

    return clusterMarker;
  }

  private showMarkerInfo(place: Place): void {

    if (!this.map) return;

    // Group 1: Get marker from map
    const markerData = this.markersMap.get(place.id);
    if (!markerData) return;

    const marker = markerData.marker;

    // Group 2: Create info window with place details
    const infoWindow = new google.maps.InfoWindow({
      content: this.createInfoWindowContent(place)
    });

    // Group 3: Open info window
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
  }

  private createInfoWindowContent(place: Place): string {
    return `
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
    `;
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

  private updateSidenavMode(): void {

    // Group 1: Get window width
    const width = window.innerWidth;

    // Group 2: Set mode based on screen size
    if (width >= 1200) {
      // Desktop: side mode, always open
      this.sidenavMode = 'side';
      this.sidenavOpen = true;
      this.isMobile = false;
    } else {
      // Mobile: over mode, closed by default
      this.sidenavMode = 'over';
      this.sidenavOpen = false;
      this.isMobile = true;
    }

    console.log(`📱 Screen size: ${width}px - Mode: ${this.sidenavMode}, Open: ${this.sidenavOpen}`);
  }
}
