import { state } from "./state.js";
import { map, addRoute, removeRoute, campsLayer } from "./map.js";
import { $, $$ } from "./utils.js";
import { BIG_DIR, SMALL_DIR, COLORS_DEFAULT } from "./config.js";

/**
 * Builds standard polyline options with optional custom weight.
 */
function getLineOptions(weight = 4) {
  return { opacity: 1.0, weight: weight, lineCap: "round" };
}

/**
 * Initializes global UI listeners.
 */
export function initEventListeners() {
  // Trips table toggle
  $("tripsTableBtn").addEventListener("click", () => {
    $("tripsTable").classList.toggle("show");
  });

  // Reset trips button
  $("resetTrips").addEventListener("click", resetTrips);

  // Single view reset button
  $("singleViewReset").addEventListener("click", () => {
    window.location.href = window.location.href.split("#")[0];
  });

  // Private mode toggle (Ctrl+Alt+U)
  document.addEventListener("keydown", (e) => {
    if (e.ctrlKey && (e.altKey || e.metaKey) && e.key === "u") {
      $("private").classList.toggle("hidden");
    }
  });

  // Firepit checkbox
  $("firepit").addEventListener("click", (e) => {
    if (e.target.checked) {
      map.addLayer(campsLayer);
    } else {
      map.removeLayer(campsLayer);
    }
  });

  // Handle marker clicks to remove from cluster before popup opens
  state.markersCluster.on("click", (a) => {
    const marker = a.layer;
    const id = marker.options.id;
    if (
      !state.isSingleView &&
      !state.markersRemovedFromCluster.find((m) => m.options.id === id)
    ) {
      state.isMovingMarker = true;
      state.markersCluster.removeLayer(marker);
      marker.addTo(map);
      state.markersRemovedFromCluster.push(marker);

      // Open popup on the marker now that it's directly on the map
      setTimeout(() => {
        marker.openPopup();
        state.isMovingMarker = false;
      }, 50);

      // Stop standard click handling to prevent conflicting popup toggle
      if (a.originalEvent) {
        L.DomEvent.stop(a.originalEvent);
      }
    }
  });

  // Map popup events for highlighting tracks
  map.on("popupopen", (e) => {
    const id = e.popup.options.id;
    const layer = getLayerById(id);

    if (layer) {
      layer.options.polyline_options.forEach((opt) => (opt.weight = 8));
      layer.reload();
      const row = $(id);
      if (row) row.classList.add("selected");
    }
  });

  map.on("popupclose", (e) => {
    const id = e.popup.options.id;
    const layer = getLayerById(id);

    if (layer) {
      layer.options.polyline_options.forEach((opt) => (opt.weight = 4));
      layer.reload();
      const row = $(id);
      if (row) row.classList.remove("selected");
    }

    // Return marker to cluster if it was removed
    // But ONLY if we are not currently moving it
    if (state.isMovingMarker) return;

    setTimeout(() => {
      if (state.isSingleView) return; // No clustering in single view

      const markerIdx = state.markersRemovedFromCluster.findIndex(
        (m) => m.options.id === id
      );
      if (markerIdx !== -1) {
        const marker = state.markersRemovedFromCluster[markerIdx];
        map.removeLayer(marker);
        state.markersRemovedFromCluster.splice(markerIdx, 1);

        // Only add back to cluster if the route is still visible
        if (layer && map.hasLayer(layer)) {
          state.markersCluster.addLayer(marker);
        }
      }
    }, 0);
  });
}

/**
 * Updates the summary display (total trips and km).

 */
export function updateSummary() {
  $("vylety").textContent = state.markers.length;
  $("km").textContent = Math.round(state.totalKm);
}

/**
 * Creates a table row for a trip.
 */
export function createTripsTableRow(name, id, km, onGranularityChange) {
  const table = $("tripsTable");
  const row = table.tBodies[0].insertRow();
  row.id = id;

  const cellName = row.insertCell(0);
  cellName.textContent = name;
  cellName.style.cursor = "pointer";
  cellName.addEventListener("click", () => move(id));

  const cellKm = row.insertCell(1);
  cellKm.textContent = km;

  const cellGran = row.insertCell(2);
  const granCheckbox = document.createElement("input");
  granCheckbox.type = "checkbox";
  granCheckbox.className = "granularity";
  granCheckbox.addEventListener("click", async () => {
    const isBig = granCheckbox.checked;
    await onGranularityChange(id, isBig);
  });
  cellGran.appendChild(granCheckbox);

  const cellShow = row.insertCell(3);
  const showCheckbox = document.createElement("input");
  showCheckbox.type = "checkbox";
  showCheckbox.className = "showHide";
  showCheckbox.checked = true;
  showCheckbox.addEventListener("click", () => {
    const layer = getLayerById(id);
    const marker = getMarkerById(id);
    if (showCheckbox.checked) {
      addRoute(layer, marker);
      granCheckbox.disabled = false;
    } else {
      removeRoute(layer, marker);
      granCheckbox.disabled = true;
    }
  });
  cellShow.appendChild(showCheckbox);
}

/**
 * Opens a trip popup and handles unclustering if necessary.
 */
export function openTripPopup(id, shouldCenter = false, updateHash = true) {
  const layer = getLayerById(id);
  const marker = getMarkerById(id);
  if (!layer || !marker) return;

  if (shouldCenter) {
    map.fitBounds(layer.getBounds());
  }

  // Update table selection
  $$("#tripsTable tr.selected").forEach((el) => el.classList.remove("selected"));
  const row = $(id);
  if (row) row.classList.add("selected");

  // Update hash if requested
  if (updateHash) {
    window.location.hash = "id=" + id;
  }

  if (map.hasLayer(layer) || state.isSingleView) {
    if (!state.isSingleView) {
      if (!state.markersRemovedFromCluster.find((m) => m.options.id === id)) {
        state.isMovingMarker = true;
        state.markersCluster.removeLayer(marker);
        marker.addTo(map);
        state.markersRemovedFromCluster.push(marker);
        setTimeout(() => {
          state.isMovingMarker = false;
        }, 100);
      }
    } else {
      if (!map.hasLayer(marker)) marker.addTo(map);
    }
    // Small delay to ensure marker is ready on map before opening popup
    setTimeout(() => marker.openPopup(), 10);
  }
}

/**
 * Centers map on a specific trip and highlights it.
 */
export function move(id) {
  openTripPopup(id, true, true);
}

/**
 * Resets all trip filters and shows everything.
 */
export function resetTrips() {
  window.location.hash = "";
  $$(".grey").forEach(el => el.classList.remove("grey"));

  state.gpxLayers.forEach(layer => {
    if (!map.hasLayer(layer)) {
      const row = $(layer.id);
      if (row) {
        row.querySelector(".showHide").checked = true;
        row.querySelector(".granularity").disabled = false;
      }
      addRoute(layer, getMarkerById(layer.id));
    }
  });
}

/**
 * Creates/Toggles people or years filter table.
 */
export function toggleFilterTable(type) {
  const table = $(type);
  const sources = type === "peopleTable" 
    ? [...state.people].sort((a, b) => b.value - a.value)
    : state.years;

  const existingRows = table.getElementsByTagName("tr");
  if (existingRows.length === 1) {
    const tbody = document.createElement("tbody");
    sources.forEach(source => {
      const isHidden = type === "peopleTable" && source.value <= 3;
      const tr = document.createElement("tr");
      tr.id = source.item;
      if (isHidden) tr.className = "hideable hidden";
      tr.style.cursor = "pointer";
      tr.addEventListener("click", () => handleFilterClick(tr));

      const tdItem = document.createElement("td");
      tdItem.textContent = source.item + ":";
      const tdValue = document.createElement("td");
      tdValue.textContent = Math.round(source.value);

      tr.appendChild(tdItem);
      tr.appendChild(tdValue);
      tbody.appendChild(tr);
    });

    if (type === "peopleTable") {
      const moreTr = document.createElement("tr");
      moreTr.style.cursor = "pointer";
      const moreTd = document.createElement("td");
      moreTd.id = "showMoreButton";
      moreTd.colSpan = 2;
      moreTd.textContent = "Zobraz vsechny";
      moreTr.appendChild(moreTd);
      moreTr.addEventListener("click", toggleHiddenPeople);
      tbody.appendChild(moreTr);
    }
    table.appendChild(tbody);
  }
  table.classList.toggle("show");
}

function toggleHiddenPeople() {
  const rows = $$("#peopleTable .hideable");
  rows.forEach(r => r.classList.toggle("hidden"));
  const isNowHidden = rows[0]?.classList.contains("hidden");
  $("showMoreButton").textContent = isNowHidden ? "Zobraz vsechny" : "Skryj lidi s mene nez 3 vylety";
}

function handleFilterClick(el) {
  el.classList.toggle("grey");
  const greyIds = Array.from($$(".grey")).map(r => r.id);
  
  if (greyIds.length === 0) {
    resetTrips();
    return;
  }

  // Intersect trip IDs for all active filters
  let filteredTripIds = null;

  greyIds.forEach(filterId => {
    const data = state.people.find(p => p.item === filterId) || state.years.find(y => y.item === filterId);
    if (data) {
      if (filteredTripIds === null) {
        filteredTripIds = new Set(data.ids);
      } else {
        filteredTripIds = new Set(data.ids.filter(id => filteredTripIds.has(id)));
      }
    }
  });

  state.gpxLayers.forEach(layer => {
    const shouldShow = filteredTripIds ? filteredTripIds.has(layer.id) : false;
    const row = $(layer.id);
    const marker = getMarkerById(layer.id);

    if (shouldShow) {
      if (!map.hasLayer(layer)) addRoute(layer, marker);
      if (row) {
        row.querySelector(".showHide").checked = true;
        row.querySelector(".granularity").disabled = false;
      }
    } else {
      if (map.hasLayer(layer)) removeRoute(layer, marker);
      if (row) {
        row.querySelector(".showHide").checked = false;
        row.querySelector(".granularity").disabled = true;
      }
    }
  });
}

// Helpers for state access
function getLayerById(id) { return state.gpxLayers.find(l => l.id === id); }
function getMarkerById(id) { return state.markers.find(m => m.options.id === id); }
