import type { MetaFunction } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { GoogleMap, useJsApiLoader, Marker } from "@react-google-maps/api";
import { useCallback, useState, useEffect } from "react";

export const meta: MetaFunction = () => {
  return [{ title: "Location Finder" }];
};

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const env = process.env.MAPS_API_KEY;

  return json({ mapsApiKey: env });
};

export default function Index() {
  const data = useLoaderData<typeof loader>();
  const [currentLocation, setCurrentLocation] = useState({
    lat: -3.745,
    lng: -38.523,
  });
  const [map, setMap] = useState(null);
  const [loadingLocation, setLoadingLocation] = useState(true);

  const { isLoaded } = useJsApiLoader({
    id: "google-map-script",
    googleMapsApiKey: data.mapsApiKey,
  });

  const containerStyle = {
    width: "400px",
    height: "400px",
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
          timeout: 5000,
          maximumAge: 0,
        }
      );
    } else {
      console.log("Geolocation is not supported by this browser.");
      setLoadingLocation(false);
    }
  }, []);

  const onLoad = useCallback(
    function callback(map) {
      if (map) {
        const bounds = new window.google.maps.LatLngBounds(currentLocation);
        map.fitBounds(bounds);
        map.setZoom(15);
        setMap(map);
      }
    },
    [currentLocation]
  );

  const onUnmount = useCallback(function callback(map) {
    setMap(null);
  }, []);

  if (loadingLocation) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <h1 className="text-xl font-semibold">Location Finder</h1>
          <div className="text-gray-600">Getting your location...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen items-center justify-center">
      <div className="flex flex-col items-center gap-8">
        <h1 className="text-xl font-semibold">Location Finder</h1>
        {isLoaded ? (
          <div className="rounded-lg overflow-hidden shadow-lg">
            <GoogleMap
              mapContainerStyle={containerStyle}
              center={currentLocation}
              zoom={15}
              onLoad={onLoad}
              onUnmount={onUnmount}
            >
              <Marker
                position={currentLocation}
                animation={window.google.maps.Animation.DROP}
                title="You are here"
              />
            </GoogleMap>
          </div>
        ) : (
          <div className="text-gray-600">Loading map...</div>
        )}
      </div>
    </div>
  );
}
