# Location Finder - Remix + Vite Project

## Overview

This project is an interactive route calculator built using the [Remix](https://remix.run/) framework and Vite for fast development. It integrates Google Maps functionality via the `@react-google-maps/api` package, allowing users to input start and destination locations, calculate routes, and view detailed travel distance and duration between locations.

### Features

- **Interactive Google Map**: Displays current user location with custom markers for origin and destination.
- **Geolocation**: Automatically centers on the user’s current location on initial load.
- **Autocomplete Search**: Allows users to search and set origin and destination locations.
- **Route Calculation**: Calculates and displays the route between selected locations.
- **Real-Time Distance and Duration**: Shows distance and travel time between origin and destination points.
- **Dynamic Radius**: Allows users to set a radius around the origin, visualized as a circle on the map.

## Tech Stack

- **Frontend Framework**: [Remix](https://remix.run/) with [Vite](https://vitejs.dev/) for faster development and bundling.
- **Google Maps API**: Managed via the `@react-google-maps/api` package to simplify the integration of Google Maps features.
- **TypeScript**: Provides type safety and autocompletion for React components, Google Maps API, and other TypeScript interfaces.

## Getting Started

### Prerequisites

- **Node.js** and **npm** installed.
- A **Google Maps API Key** with Maps JavaScript and Places API enabled.

### Installation

1. **Clone the Repository**:
   ```bash
   git clone https://github.com/Mpinyaz/LocationFinder.git
   cd locationfinder
   ```
2. **Install Dependecies**:
   ```bash
   npm install
   ```
3. Set Up Environment Variables:
   ```bash
   MAPS_API_KEY=your_google_maps_api_key
   ```

## Development

Run the dev server:

```shellscript
npm run dev
```

## Deployment

First, build your app for production:

```sh
npm run build
```

Then run the app in production mode:

```sh
npm start
```

Now you'll need to pick a host to deploy it to.

### DIY

If you're familiar with deploying Node applications, the built-in Remix app server is production-ready.

Make sure to deploy the output of `npm run build`

- `build/server`
- `build/client`

## Styling

This template comes with [Tailwind CSS](https://tailwindcss.com/) already configured for a simple default starting experience. You can use whatever css framework you prefer. See the [Vite docs on css](https://vitejs.dev/guide/features.html#css) for more information.
