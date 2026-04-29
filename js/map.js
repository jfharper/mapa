import { API_KEY, WAYPOINT_OPTIONS } from "./config.js";
import { state } from "./state.js";

export let map;
export let campsLayer;

export function initMap() {
  map = L.map("map").setView([49.8729317, 14.8981184], 9);

  L.tileLayer(
    "https://api.mapy.cz/v1/maptiles/outdoor/256/{z}/{x}/{y}?apikey=" + API_KEY,
    {
      minZoom: 0,
      maxZoom: 19,
      attribution:
        '<a href="https://api.mapy.cz/copyright" target="_blank">&copy; Seznam.cz a.s. a další</a>',
    }
  ).addTo(map);

  L.control.scale({ imperial: false }).addTo(map);

  // Initialize marker cluster group
  state.markersCluster = L.markerClusterGroup();
  map.addLayer(state.markersCluster);

  // Logo mapy.cz
  const LogoControl = L.Control.extend({
    options: {
      position: "bottomleft",
    },
    onAdd: function () {
      const container = L.DomUtil.create("div");
      const link = L.DomUtil.create("a", "", container);
      link.setAttribute("href", "http://mapy.cz/");
      link.setAttribute("target", "_blank");
      link.innerHTML = '<img src="https://api.mapy.cz/img/api/logo.svg" />';
      L.DomEvent.disableClickPropagation(link);
      return container;
    },
  });

  new LogoControl().addTo(map);

  // Camps/Firepits layer
  campsLayer = new L.GPX("spani.gpx", WAYPOINT_OPTIONS).on(
    "addpoint",
    function (e) {
      if (e.point_type === "waypoint") {
        e.point.unbindPopup();
      }
    }
  );

  return map;
}

export function addRoute(layer, marker) {
  if (layer) map.addLayer(layer);
  if (marker) {
    if (state.isSingleView) {
      map.addLayer(marker);
    } else {
      const isRemoved = state.markersRemovedFromCluster.find(
        (m) => m.options.id === marker.options.id
      );
      if (isRemoved) {
        map.addLayer(marker);
      } else {
        state.markersCluster.addLayer(marker);
      }
    }
  }
}

export function removeRoute(layer, marker) {
  if (layer) map.removeLayer(layer);
  if (marker) {
    if (state.isSingleView) {
      map.removeLayer(marker);
    } else {
      const isRemoved = state.markersRemovedFromCluster.find(
        (m) => m.options.id === marker.options.id
      );
      if (isRemoved) {
        map.removeLayer(marker);
      } else {
        state.markersCluster.removeLayer(marker);
      }
    }
  }
}
