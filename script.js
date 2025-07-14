//neotevre se popup, kdyz po kliknuti na radku v tabulce je vylet porad jeste v clusteru

import { routeList, colorsDefault, waypointOptions } from "./constants.js";
import { createTableRow } from "./tables.js";

const API_KEY = "H3kT2-i1u8kukLpZRkZGP-ANDGjqvp_TmVPVvZo9g3M";
let polylineOptions = [];
// const path = "https://jfharper.github.io/mapa/";
// const smallDir = "smalltrips/";
const bigDir = "trips/";
const years = [];
const people = [];
const gpxLayers = [];
const markers = [];
//const markersCluster = L.markerClusterGroup(); //cluster

function getOtherLineOptions() {
  return { opacity: 1.0, weight: 4, lineCap: "round" };
}

function getLineOptions(colorsArray = colorsDefault) {
  return colorsArray.forEach((color) =>
    polylineOptions.push({
      ...{ color: color },
      ...getOtherLineOptions(),
    })
  );
}

//pocet vyletu
document.getElementById("vylety").innerHTML = routeList.length;
//otevira menu
const tripsTable = document.getElementById("tripsTable");
const tripsTableBtn = document.getElementById("tripsTableBtn");
tripsTableBtn.addEventListener("click", function () {
  tripsTable.classList.toggle("show");
});

const map = L.map("map").setView([49.8729317, 14.8981184], 9);

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

//setGranularity("small");

//zobrazi checkbox na ohniste
document.addEventListener("keydown", function (event) {
  if ((event.ctrlKey || event.metaKey) && event.altKey && event.key === "u") {
    document.getElementById("private").classList.toggle("hidden");
  }
});

const camps = new L.GPX("spani.gpx", waypointOptions).on(
  "addpoint",
  function (e) {
    if (e.point_type === "waypoint") {
      e.point.unbindPopup();
    }
  }
);

const checkboxFirepit = document.getElementById("firepit");
checkboxFirepit.addEventListener("click", function () {
  if (checkboxFirepit.checked) {
    map.addLayer(camps);
  } else {
    map.removeLayer(camps);
  }
});

// function setGranularity(granularity = "small") {
//   let dir;
//   if (granularity === "small") {
//     // pocetBodu = podrobnostMalo;
//     dir = smallDir;
//   } else {
//     // pocetBodu = podrobnostHodne;
//     dir = bigDir;
//   }
//   return dir;
// }

async function loadGPXData(url) {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error("Failed to fetch GPX data");
    }
    const gpxData = await response.text();
    let parser = new DOMParser();
    const metadata = parser
      .parseFromString(gpxData, "application/xml")
      .querySelector("metadata");
    const name = metadata.querySelector("name").textContent.slice(0, -4);
    const id = name.slice(0, 8);
    const lide = metadata
      .querySelector("keywords")
      .textContent.split(",")
      .map((a) => a.trim());
    if (lide === undefined) {
      console.log("Doplnit lidi: " + name);
    }
    for (const val of lide) {
      const peopleIndex = people.findIndex((person) => person.item === val);
      if (peopleIndex === -1) {
        people.push({ item: val, value: 1, ids: [id] });
      } else {
        people[peopleIndex].value += 1;
        people[peopleIndex].ids.push(id);
      }
    }
    const desc = metadata.querySelector("desc").textContent.trim().split(",");
    const startTmp = parser
      .parseFromString(gpxData, "application/xml")
      .querySelector("trkpt");
    const start = [startTmp.getAttribute("lat"), startTmp.getAttribute("lon")];
    //souhrny za jednotlive roky
    let rocnik = id.slice(0, 4);
    const yearsIndex = years.findIndex((a) => a.item === rocnik);
    if (yearsIndex === -1) {
      years.push({ item: rocnik, value: Number(desc[0]), ids: [id] });
    } else {
      years[yearsIndex].value += Number(desc[0]);
      years[yearsIndex].ids.push(id);
    }
    createTableRow(name, id, desc[0]);

    const marker = L.marker([start[0], start[1]], {
      title: name,
      id: id,
    }).addTo(map); //cluster
    markers.push(marker);
    //markersCluster.addLayer(marker);//cluster
    let content =
      name +
      "<br>Vyprava: <b>" +
      lide +
      "</b><br>Usli jsme: <b>" +
      desc[0] +
      " km</b><br>Stoupani: <b>" +
      desc[1] +
      " m</b> a klesani <b>" +
      desc[2] +
      " m</b>";
    marker.bindPopup(content, { id: id });
    document.getElementById("km").innerHTML =
      Number(document.getElementById("km").textContent) + Number(desc[0]);
    return gpxData;
  } catch (error) {
    console.error("Error loading GPX data:", error);
    throw error;
  }
}

async function addGPXTracksToMap(tracks) {
  for (let i = 0; i <= tracks.length - 1; i++) {
    polylineOptions = [];
    try {
      const gpxData = await loadGPXData(bigDir + tracks[i].url);
      if (tracks[i].barva) {
        getLineOptions(tracks[i].barva);
      } else {
        getLineOptions();
      }
      gpxLayers[i] = new L.GPX(gpxData, {
        async: true,
        parseElements: ["track"],
        gpx_options: { joinTrackSegments: false },
        polyline_options: polylineOptions,
        markers: { startIcon: null, endIcon: null },
      }).addTo(map);
      gpxLayers[i].id = tracks[i].url.slice(1, 9);
    } catch (error) {
      console.error("Error loading GPX data:", error);
    }
  }
  return true;
}

function addRoute(layer) {
  map.addLayer(layer);
  map.addLayer(getMarkerWithId(layer.id));
  //markersCluster.addLayer(getMarkerWithId(layer.id));//cluster
}

function removeRoute(layer) {
  map.removeLayer(layer);
  map.removeLayer(getMarkerWithId(layer.id));
  //markersCluster.removeLayer(getMarkerWithId(layer.id));//cluster
}

// zobrazi vsechny trasy
let resetTripsButton = document.getElementById("resetTrips");
resetTripsButton.addEventListener("click", resetTrips);

function resetTrips() {
  document.location.hash = "";
  let greyRows = document.getElementsByClassName("grey");
  while (greyRows.length) {
    greyRows[0].classList.remove("grey");
  }

  for (const layer of gpxLayers) {
    if (!map.hasLayer(layer)) {
      document
        .getElementById(layer.id)
        .getElementsByClassName("zobrazeni")[0].checked = true;
      document
        .getElementById(layer.id)
        .getElementsByClassName("podrobnost")[0].disabled = false;
      addRoute(layer);
    }
  }
}

//centruje mapu na zadanou trasau
function move(id) {
  const layer = getLayerWithId(id);
  map.fitBounds(layer.getBounds());
  const green = tripsTable.getElementsByClassName("selected");
  while (green.length) {
    green[0].classList.remove("selected");
  }
  document.getElementById(id).classList.add("selected");
  document.location.hash = "id=" + id;
  if (map.hasLayer(layer)) {
    getMarkerWithId(id).openPopup();
  }
}

function getLayerWithId(id) {
  const layer = gpxLayers.find((layer) => layer.id === id);
  return layer;
}

function getMarkerWithId(id) {
  const marker = markers.find((marker) => marker.options.id === id);
  return marker;
}

//obarvi zelene radek tabulky a zvyrazni caru
map.addEventListener("popupopen", function (e) {
  const id = e.popup.options.id;
  let layer = getLayerWithId(id);
  let options = layer.options.polyline_options;
  for (const option of options) {
    option.weight = 8;
  }
  layer.reload();
  const el = document.getElementById(id);
  if (el !== null) {
    el.classList.add("selected");
  }
});

//rusi zvyrazneni po zavreni vizitky
map.addEventListener("popupclose", function (e) {
  let id = e.popup.options.id;
  let layer = getLayerWithId(id);
  let options = layer.options.polyline_options;
  for (const option of options) {
    option.weight = getOtherLineOptions().weight;
  }
  layer.reload();
  let el = document.getElementById(id);
  el.classList.remove("selected");
});

//rusi single view
let singleViewResetButton = document.getElementById("singleViewReset");
singleViewResetButton.addEventListener("click", function () {
  document.location.href = document.location.href.substr(
    0,
    document.location.href.indexOf("#")
  );
});

async function render(routeList) {
  const id = document.location.hash.slice(4);
  let routes = [];
  if (id !== "") {
    routes = [
      routeList.find((singleRoute) => singleRoute.url.indexOf(id) !== -1),
    ];
    // setGranularity("big");
    document.getElementsByClassName("singleView")[0].classList.toggle("hidden");
    document.getElementsByClassName("multiView")[0].classList.toggle("hidden");
  } else {
    routes = routeList.reverse();
  }
  //map.addLayer(markersCluster);//cluster
  const loaded = await addGPXTracksToMap(routes);
  if (id !== "" && loaded) {
    setTimeout(() => {
      move(id);
    }, 100);
  }
  return loaded;
}

// vykresleni tras
const loaded = await render(routeList);
if (loaded) {
  let disabledInputs = document.getElementsByClassName("disableable");
  for (const input of disabledInputs) {
    input.disabled = false;
  }
}

export {
  removeRoute,
  addRoute,
  move,
  getLayerWithId,
  map,
  years,
  people,
  gpxLayers,
};
