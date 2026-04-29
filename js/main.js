import { initMap, addRoute, removeRoute, map } from "./map.js";
import { state } from "./state.js";
import {
  initEventListeners,
  createTripsTableRow,
  updateSummary,
  toggleFilterTable,
  move,
  openTripPopup,
} from "./ui.js";
import { parseGPXMetadata, buildPolylineOptions, $ } from "./utils.js";
import { ROUTES_DATA_PATH, BIG_DIR, SMALL_DIR, WAYPOINT_OPTIONS } from "./config.js";

/**
 * Loads a single GPX file and updates state if it's the first time.
 */
async function loadGPX(url, dir, isFirstLoad = false) {
  try {
    const response = await fetch(dir + url);
    if (!response.ok) throw new Error(`Failed to fetch ${url}`);
    const gpxData = await response.text();

    if (isFirstLoad) {
      const meta = parseGPXMetadata(gpxData);
      if (meta) {
        // Update summary stats
        state.totalKm += meta.km;

        // Update people state
        meta.people.forEach((personName) => {
          let p = state.people.find((item) => item.item === personName);
          if (!p) {
            p = { item: personName, value: 0, ids: [] };
            state.people.push(p);
          }
          p.value += 1;
          p.ids.push(meta.id);
        });

        // Update years state
        let y = state.years.find((item) => item.item === meta.year);
        if (!y) {
          y = { item: meta.year, value: 0, ids: [] };
          state.years.push(y);
        }
        y.value += meta.km;
        y.ids.push(meta.id);

        // Create table row
        createTripsTableRow(meta.name, meta.id, meta.km, handleGranularityChange);

        // Create marker
        if (meta.start) {
          const content = `
            ${meta.name}<br>
            Vyprava: <b>${meta.people.join(", ")}</b><br>
            Usli jsme: <b>${meta.km} km</b><br>
            Stoupani: <b>${meta.ascent} m</b> a klesani <b>${meta.descent} m</b>
          `;
          const marker = L.marker(meta.start, {
            title: meta.name,
            id: meta.id,
          }).bindPopup(content, { id: meta.id });
          state.markers.push(marker);
        }

        updateSummary();
      }
    }
    return gpxData;
  } catch (err) {
    console.error(err);
    return null;
  }
}

/**
 * Adds GPX tracks to map.
 */
async function addGPXTracks(tracks, dir, isFirstLoad = false) {
  for (const track of tracks) {
    const gpxData = await loadGPX(track.url, dir, isFirstLoad);
    if (!gpxData) continue;

    const polylineOptions = buildPolylineOptions(track.barva);
    const gpxLayer = new L.GPX(gpxData, {
      async: true,
      parseElements: ["track"],
      gpx_options: { joinTrackSegments: false },
      polyline_options: polylineOptions,
      markers: { startIcon: null, endIcon: null },
    });

    const id = track.url.slice(1, 9);
    gpxLayer.id = id;
    state.gpxLayers.push(gpxLayer);

    const marker = state.markers.find((m) => m.options.id === id);
    addRoute(gpxLayer, marker);
  }
}

/**
 * Handles switching between small and big GPX tracks.
 */
async function handleGranularityChange(id, isBig) {
  const layerIdx = state.gpxLayers.findIndex((l) => l.id === id);
  if (layerIdx === -1) return;

  const oldLayer = state.gpxLayers[layerIdx];
  const marker = state.markers.find((m) => m.options.id === id);

  // Check if popup is currently open
  const wasPopupOpen = marker && marker.isPopupOpen && marker.isPopupOpen();

  removeRoute(oldLayer, marker);
  state.gpxLayers.splice(layerIdx, 1);

  const track = state.routeList.find((r) => r.url.includes(id));
  if (track) {
    await addGPXTracks([track], isBig ? BIG_DIR : SMALL_DIR, false);

    // Reopen popup if it was open before the switch
    if (wasPopupOpen && marker) {
      setTimeout(() => {
        openTripPopup(id, false, false);
      }, 50);
    }
  }
}

/**
 * Main initialization.
 */
async function init() {
  initMap();
  initEventListeners();

  // Expose filter table functions to window (optional, but let's use proper listeners)
  $("peopleTableBtn").addEventListener("click", () => toggleFilterTable("peopleTable"));
  $("yearsTableBtn").addEventListener("click", () => toggleFilterTable("yearsTable"));

  try {
    const res = await fetch(ROUTES_DATA_PATH);
    state.routeList = await res.json();

    const hashId = window.location.hash.slice(4);
    let routesToLoad = [];
    let dir = SMALL_DIR;

    if (hashId) {
      state.isSingleView = true;
      const singleRoute = state.routeList.find((r) => r.url.includes(hashId));
      if (singleRoute) {
        routesToLoad = [singleRoute];
        dir = BIG_DIR;
        document.querySelector(".singleView").classList.remove("hidden");
        document.querySelector(".multiView").classList.add("hidden");
      }
    } else {
      state.isSingleView = false;
      routesToLoad = [...state.routeList].reverse();
    }

    await addGPXTracks(routesToLoad, dir, true);

    if (hashId) {
      setTimeout(() => move(hashId), 100);
    }

    // Enable buttons
    document.querySelectorAll(".disableable").forEach((el) => (el.disabled = false));
  } catch (err) {
    console.error("Initialization failed:", err);
  }
}

init();
