import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';
import { environment } from './environments/environment';

// Load Google Maps API dynamically
function loadGoogleMapsAPI(): Promise<void> {
  return new Promise((resolve, reject) => {
    // Check if Google Maps is already loaded
    if (typeof window !== 'undefined' && (window as any).google?.maps) {
      resolve();
      return;
    }

    // Create callback function
    (window as any).initGoogleMaps = function () {
      (window as any).googleMapsReady = true;
      console.log('📍 Google Maps API loaded');
      document.dispatchEvent(new Event('googleMapsLoaded'));
      resolve();
    };

    // Get API key from environment
    const apiKey = environment.googleMapsApiKey;

    // Create script element for Google Maps
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&callback=initGoogleMaps`;
    script.async = true;
    script.defer = true;
    script.onerror = () => {
      console.error('❌ Failed to load Google Maps API');
      reject(new Error('Failed to load Google Maps API'));
    };

    // Append to document head
    document.head.appendChild(script);
  });
}

// Load Google Maps before bootstrapping Angular
loadGoogleMapsAPI()
  .then(() => {
    bootstrapApplication(App, appConfig).catch((err) => console.error(err));
  })
  .catch((err) => {
    console.error('❌ Critical error loading Google Maps:', err);
    // Still bootstrap Angular even if Maps fails
    bootstrapApplication(App, appConfig).catch((err) => console.error(err));
  });
