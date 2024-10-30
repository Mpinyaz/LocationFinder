import type { LoaderFunctionArgs, MetaFunction } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import {
  GoogleMap,
  useJsApiLoader,
  Marker,
  MarkerF,
  Circle,
  Autocomplete,
  InfoWindowF,
  DirectionsRenderer,
} from "@react-google-maps/api";

import { useCallback, useState, useEffect, useRef, RefObject } from "react";

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
  const [searchResultOrigin, setSearchResultOrigin] =
    useState<SearchResult | null>(null);
  const [searchResultDest, setSearchResultDest] = useState<SearchResult | null>(
    null
  );
  const [originLocation, setOriginLocation] = useState<Location | null>(null);
  const [destLocation, setDestLocation] = useState<Location | null>(null);
  const [radius, setRadius] = useState<number>(0);
  const [mapInitialized, setMapInitialized] = useState(false);
  const [infowindowOpen, setInfowindowOpen] = useState(true);
  const originRef = useRef<HTMLInputElement>(null);
  const destRef = useRef<HTMLInputElement>(null);

  const [directionsResponse, setDirectionsResponse] = useState<any>(null);
  const [distance, setDistance] = useState("");
  const [duration, setDuration] = useState("");
  const geocodeLatLng = (
    lat: number,
    lng: number,
    inputRef: RefObject<HTMLInputElement>
  ) => {
    const geocoder = new google.maps.Geocoder();
    const latLng = new google.maps.LatLng(lat, lng);

    geocoder.geocode({ location: latLng }, (results, status) => {
      if (status === "OK" && results[0]) {
        if (inputRef.current) {
          inputRef.current.value = results[0].formatted_address;
        }
      } else {
        console.error("Geocoder failed due to:", status);
      }
    });
  };

  const containerStyle = {
    width: "100%",
    height: "100%",
  };
  async function showRoute() {
    if (!originRef.current?.value || !destRef.current?.value) {
      return;
    }

    if (!originLocation || !destLocation) {
      return;
    }

    clearRoute();
    try {
      const directionsService = new google.maps.DirectionsService();

      const results = await directionsService.route({
        origin: new google.maps.LatLng(originLocation.lat, originLocation.lng),
        destination: new google.maps.LatLng(destLocation.lat, destLocation.lng),
        travelMode: google.maps.TravelMode.DRIVING,
      });

      // Update state with the route information
      setDirectionsResponse(results);
      setDistance(results.routes[0].legs[0].distance.text);
      setDuration(results.routes[0].legs[0].duration.text);
    } catch (error) {
      console.error("Error fetching directions:", error);
    }
  }
  function clearRoute() {
    setDirectionsResponse(null);
    setDistance("");
    setDuration("");
  }

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

  useEffect(() => {
    if (map && currentLocation && !mapInitialized) {
      map.panTo(currentLocation);
      map.setZoom(15);
      setMapInitialized(true);
    }
  }, [map, currentLocation, mapInitialized]);

  const onLoad = useCallback((map: google.maps.Map) => {
    setMap(map);
  }, []);

  const onUnmount = useCallback(() => {
    setMap(null);
  }, []);

  const onAutoCompleteLoad = (
    autocomplete: SearchResult,
    isOrigin: boolean
  ) => {
    if (isOrigin) {
      setSearchResultOrigin(autocomplete);
    } else {
      setSearchResultDest(autocomplete);
    }
  };

  const onPlaceChanged = (isOrigin: boolean) => {
    const searchResult = isOrigin ? searchResultOrigin : searchResultDest;
    const inputRef = isOrigin ? originRef : destRef;
    if (searchResult) {
      const place = searchResult.getPlace();

      if (place.geometry?.location) {
        const newLocation = {
          lat: place.geometry.location.lat(),
          lng: place.geometry.location.lng(),
        };
        if (isOrigin) {
          setOriginLocation(newLocation);
        } else {
          setDestLocation(newLocation);
        }

        if (map) {
          map.panTo(newLocation);
          map.setZoom(13);
        }
      }

      if (inputRef.current) {
        inputRef.current.value = place.formatted_address || "";
      }
    }
  };

  if (loadingLocation) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-900">
        <div className="flex flex-col items-center gap-4">
          <h1 className="text-3xl font-semibold text-white">Location Finder</h1>
          <div className="text-gray-400">Getting your location...</div>
          <div
            className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-white border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]"
            role="status"
          >
            <span className="sr-only">Getting your location...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen items-center justify-center bg-gray-900">
      <div className="flex flex-col items-center gap-8 w-[90%] max-w-2xl">
        <h1 className="text-2xl font-semibold text-white">Location Finder</h1>
        {isLoaded ? (
          <div className="flex flex-col gap-4 w-full">
            <div className="flex items-center justify-between">
              <label htmlFor="origin" className="text-white">
                Origin:{" "}
              </label>
              <Autocomplete
                onLoad={(autocomplete) => {
                  onAutoCompleteLoad(autocomplete, true);
                }}
                onPlaceChanged={() => {
                  onPlaceChanged(true);
                }}
                options={{ componentRestrictions: { country: "za" } }}
              >
                <input
                  ref={originRef}
                  type="text"
                  placeholder="Enter start location"
                  className="w-[450px] h-10 px-3 rounded-md shadow-md text-sm outline-none border border-gray-600 bg-gray-800 text-white"
                />
              </Autocomplete>
            </div>
            <div className="flex items-center justify-between">
              <label htmlFor="origin" className="text-white">
                Destination:{" "}
              </label>
              <Autocomplete
                onLoad={(autocomplete) =>
                  onAutoCompleteLoad(autocomplete, false)
                }
                onPlaceChanged={() => onPlaceChanged(false)}
                options={{ componentRestrictions: { country: "za" } }}
              >
                <input
                  ref={destRef}
                  type="text"
                  placeholder="Search for destination"
                  className="w-[450px] h-10 px-3 rounded-md shadow-md text-sm outline-none border border-gray-600 bg-gray-800 text-white"
                />
              </Autocomplete>
            </div>
            <div className="flex flex-col">
              {originLocation && (
                <>
                  <label
                    htmlFor="minmax-range"
                    className="block mb-2 text-lg font-medium text-gray-900 dark:text-white"
                  >
                    {"Set Origin Radius: " + radius + "km"}
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="50"
                    value={radius}
                    onChange={(e) => setRadius(Number(e.target.value))}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
                  />
                </>
              )}

              {originLocation && destLocation && (
                <button
                  onClick={showRoute}
                  className="my-4 px-6 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors duration-200 shadow-md"
                >
                  Show Route
                </button>
              )}
              {directionsResponse && (
                <div className="flex justify-between items-center px-4">
                  <p>{"Distance: " + distance}</p>
                  <p>{"Duration: " + duration}</p>
                </div>
              )}
            </div>
            <div className="rounded-lg overflow-hidden shadow-lg h-[500px] w-full">
              <GoogleMap
                mapContainerStyle={containerStyle}
                center={currentLocation}
                zoom={15}
                onLoad={onLoad}
                onUnmount={onUnmount}
                onDblClick={(e) => {
                  setOriginLocation({
                    lat: e.latLng?.lat() ?? 0,
                    lng: e.latLng?.lng() ?? 0,
                  });
                  geocodeLatLng(
                    e.latLng?.lat() ?? 0,
                    e.latLng?.lng() ?? 0,
                    originRef
                  );
                }}
              >
                <MarkerF
                  position={currentLocation}
                  icon={{
                    path: window.google.maps.SymbolPath.CIRCLE,
                    scale: 8,
                    fillColor: "#4285F4",
                    fillOpacity: 1,
                    strokeColor: "white",
                    strokeWeight: 2,
                  }}
                  onClick={() => {
                    setInfowindowOpen(!infowindowOpen);
                  }}
                  animation={window.google.maps.Animation.DROP}
                  title="You are here"
                >
                  {infowindowOpen && (
                    <InfoWindowF
                      position={currentLocation}
                      onCloseClick={() => setInfowindowOpen(false)}
                    >
                      <div>
                        <p className="font-semibold text-black">You are here</p>
                      </div>
                    </InfoWindowF>
                  )}
                </MarkerF>
                {originLocation && (
                  <>
                    <Marker
                      position={originLocation}
                      icon={{
                        path: window.google.maps.SymbolPath.CIRCLE,
                        scale: 10,
                        fillColor: "#00FF00", // Green color for origin
                        fillOpacity: 1,
                        strokeColor: "white",
                        strokeWeight: 2,
                      }}
                      animation={window.google.maps.Animation.DROP}
                      title="Selected location"
                      draggable
                      onDragEnd={(e) => {
                        setOriginLocation({
                          lat: e.latLng?.lat() ?? 0,
                          lng: e.latLng?.lng() ?? 0,
                        });
                        geocodeLatLng(
                          e.latLng?.lat() ?? 0,
                          e.latLng?.lng() ?? 0,
                          originRef
                        );
                      }}
                    />
                    <Circle
                      center={originLocation}
                      radius={radius * 1000}
                      options={{
                        zIndex: -1, // Set zIndex to control layering
                        fillColor: "grey",
                        fillOpacity: 0.2,
                        strokeColor: "blue",
                        strokeOpacity: 0.5,
                      }}
                    />
                  </>
                )}
                {destLocation && (
                  <Marker
                    position={destLocation}
                    icon={{
                      path: window.google.maps.SymbolPath.CIRCLE,
                      scale: 8,
                      fillColor: "#FF0000",
                      fillOpacity: 1,
                      strokeColor: "white",
                      strokeWeight: 2,
                    }}
                    animation={window.google.maps.Animation.DROP}
                    title="Selected location"
                    draggable
                    onDragEnd={(e) => {
                      setDestLocation({
                        lat: e.latLng?.lat() ?? 0,
                        lng: e.latLng?.lng() ?? 0,
                      });
                      geocodeLatLng(
                        e.latLng?.lat() ?? 0,
                        e.latLng?.lng() ?? 0,
                        destRef
                      );
                    }}
                  />
                )}
                {directionsResponse && (
                  <DirectionsRenderer directions={directionsResponse} />
                )}
              </GoogleMap>
            </div>
          </div>
        ) : (
          <div className="text-gray-400">Loading map...</div>
        )}
      </div>
    </div>
  );
}
