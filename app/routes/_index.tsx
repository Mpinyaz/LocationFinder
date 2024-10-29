import type { LoaderFunctionArgs, MetaFunction } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import {
  GoogleMap,
  useJsApiLoader,
  Marker,
  Autocomplete,
} from "@react-google-maps/api";
import { useCallback, useState, useEffect, useRef } from "react";

export const meta: MetaFunction = () => {
  return [{ title: "Location Finder" }];
};

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const env = process.env.MAPS_API_KEY;
  if (!env) {
    throw new Error("MAPS_API_KEY environment variable is not set");
  }
  return json({ mapsApiKey: env });
};

interface Location {
  lat: number;
  lng: number;
}

interface SearchResult extends google.maps.places.Autocomplete {
  getPlace(): google.maps.places.PlaceResult;
}

export default function Index() {
  const data = useLoaderData<typeof loader>();
  const { isLoaded } = useJsApiLoader({
    id: "google-map-script",
    googleMapsApiKey: data.mapsApiKey,
    libraries: ["places"],
  });
  const [currentLocation, setCurrentLocation] = useState<Location>({
    lat: -26.189062153074467,
    lng: 28.042714208499355,
  });
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [loadingLocation, setLoadingLocation] = useState(true);
  const [searchResult, setSearchResult] = useState<SearchResult | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(
    null
  );
  const [address, setAddress] = useState<string>("");

  const autocompleteRef = useRef<HTMLInputElement>(null);
  const geocodeLatLng = (lat: number, lng: number) => {
    const geocoder = new google.maps.Geocoder();
    const latLng = new google.maps.LatLng(lat, lng);

    geocoder.geocode({ location: latLng }, (results, status) => {
      if (status === "OK" && results[0]) {
        setAddress(results[0].formatted_address);
        if (autocompleteRef.current) {
          autocompleteRef.current.value = results[0].formatted_address;
        }
      } else {
        console.error("Geocoder failed due to:", status);
      }
    });
  };
  const containerStyle = {
    width: "700px",
    height: "700px",
  };

  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setCurrentLocation({
            lat: latitude,
            lng: longitude,
          });
          setLoadingLocation(false);
        },
        (error) => {
          console.error("Error getting location:", error);
          setLoadingLocation(false);
        },
        {
          timeout: 10000,
          maximumAge: 0,
          enableHighAccuracy: true,
        }
      );
    } else {
      console.log("Geolocation is not supported by this browser.");
      setLoadingLocation(false);
    }
  }, []);

  const onLoad = useCallback(
    (map: google.maps.Map) => {
      const bounds = new window.google.maps.LatLngBounds(currentLocation);
      map.fitBounds(bounds);
      map.setZoom(15);
      setMap(map);
    },
    [currentLocation]
  );

  const onUnmount = useCallback(() => {
    setMap(null);
  }, []);

  const onAutoCompleteLoad = (autocomplete: SearchResult) => {
    setSearchResult(autocomplete);
  };

  const onPlaceChanged = () => {
    if (searchResult) {
      const place = searchResult.getPlace();

      if (place.geometry?.location) {
        const newLocation = {
          lat: place.geometry.location.lat(),
          lng: place.geometry.location.lng(),
        };
        setSelectedLocation(newLocation);

        if (map) {
          map.panTo(newLocation);
          map.setZoom(13);
        }
      }

      console.log({
        name: place.name,
        status: place.business_status,
        address: place.formatted_address,
      });
    }
  };

  if (loadingLocation) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <h1 className="text-3xl font-semibold">Location Finder</h1>
          <div className="text-gray-600">Getting your location...</div>
          <div
            className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]"
            role="status"
          >
            <span className="!absolute !-m-px !h-px !w-px !overflow-hidden !whitespace-nowrap !border-0 !p-0 ![clip:rect(0,0,0,0)]">
              Getting your location...
            </span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen items-center justify-center">
      <div className="flex flex-col items-center gap-8">
        <h1 className="text-xl font-semibold">Location Finder</h1>
        {isLoaded ? (
          <div className="flex flex-col gap-4">
            <Autocomplete
              onLoad={onAutoCompleteLoad}
              onPlaceChanged={onPlaceChanged}
              options={{ componentRestrictions: { country: "za" } }}
            >
              <input
                ref={autocompleteRef}
                type="text"
                placeholder="Search for a location"
                className="w-1/2 h-10 px-3 rounded-md shadow-md text-sm outline-none border border-transparent absolute top-10 left-1/2 transform -translate-x-1/2"
              />
            </Autocomplete>
            <div className="rounded-lg overflow-hidden shadow-lg">
              <GoogleMap
                mapContainerStyle={containerStyle}
                center={selectedLocation || currentLocation}
                zoom={13}
                onLoad={onLoad}
                onUnmount={onUnmount}
                onDblClick={(e) => {
                  setSelectedLocation({
                    lat: e.latLng?.lat() ?? 0,
                    lng: e.latLng?.lng() ?? 0,
                  });
                  geocodeLatLng(e.latLng?.lat() ?? 0, e.latLng?.lng() ?? 0);
                }}
              >
                {/* Current location marker */}
                <Marker
                  position={currentLocation}
                  animation={window.google.maps.Animation.DROP}
                  title="You are here"
                />

                {/* Selected location marker */}
                {selectedLocation && (
                  <Marker
                    position={selectedLocation}
                    animation={window.google.maps.Animation.DROP}
                    title="Selected location"
                    draggable
                    onDragEnd={(e) => {
                      setSelectedLocation({
                        lat: e.latLng?.lat() ?? 0,
                        lng: e.latLng?.lng() ?? 0,
                      });
                      geocodeLatLng(e.latLng?.lat() ?? 0, e.latLng?.lng() ?? 0);
                    }}
                  />
                )}
              </GoogleMap>
            </div>
          </div>
        ) : (
          <div className="text-gray-600">Loading map...</div>
        )}
      </div>
    </div>
  );
}
