// JavaScript Document
//type="text/javascript"
import { seznamTras, barvyDefault } from "./constants.js";
const API_KEY = "H3kT2-i1u8kukLpZRkZGP-ANDGjqvp_TmVPVvZo9g3M";

function getOtherLineOptions() {
  return { opacity: 1.0, weight: 4, lineCap: "round" };
}

function getLineOptions(colorsArray = barvyDefault) {
  return colorsArray.forEach((barva) =>
    polylineOptions.push({
      ...{ color: barva },
      ...getOtherLineOptions(),
    })
  );
}
var polylineOptions = [];

const path = "https://jfharper.github.io/mapa/";
const smallDir = "smalltrips/";
const bigDir = "trips/";
var roky = [];
var people = [];
//var tripsCounter = 0;
var metadataObj = {};
var gpxLayers = [];
const markers = [];
var otevreneId = null;

document.getElementById("vylety").innerHTML = seznamTras.length;
var tabulka = document.getElementById("tabulka");
window.zobrazMenu = function (el) {
  document.getElementById(el).classList.toggle("show");
};

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

  onAdd: function (map) {
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

setGranularity("small");

//zobrazi checkbox na ohniste
document.addEventListener("keydown", function (event) {
  if (event.ctrlKey && event.altKey && event.key === "u") {
    document.getElementById("private").classList.toggle("hidden");
  }
});

const waypointOptions = {
  async: true,
  parseElements: ["waypoint"],
  marker_options: {
    iconSize: [20, 20],
    iconAnchor: [1, 1],
  },
  markers: {
    wptIcons: {
      Waypoint: "firepit.png",
      strecha: "shelter.png",
    },
  },
};
const spani = new L.GPX(path + "spani.xml", waypointOptions);

const checkboxFirepit = document.getElementById("firepit");
checkboxFirepit.addEventListener("click", function () {
  if (checkboxFirepit.checked) {
    map.addLayer(spani);
  } else {
    map.removeLayer(spani);
  }
});

function setGranularity(granularity = "small") {
  let dir;
  if (granularity === "small") {
    // pocetBodu = podrobnostMalo;
    dir = smallDir;
  } else {
    // pocetBodu = podrobnostHodne;
    dir = bigDir;
  }
  return dir;
}

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
    const lide = metadata.querySelector("keywords").textContent.split(",");
    if (lide === undefined) {
      console.log("Doplnit lidi: " + name);
    }
    for (const val of lide) {
      let peopleIndex = people.findIndex((person) => person.item === val);
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
    var rokyIndex = roky.findIndex((a) => a.item === rocnik);
    if (rokyIndex === -1) {
      roky.push({ item: rocnik, value: Number(desc[0]), ids: [id] });
    } else {
      roky[rokyIndex].value += Number(desc[0]);
      roky[rokyIndex].ids.push(id);
    }
    metadataObj[id] = {
      id: id,
      name: name,
      lide: lide,
      desc: desc,
      start: start,
      rok: rocnik,
    };
    radekTabulky(name, id, desc[0]);

    const marker = L.marker([start[0], start[1]], {
      title: name,
      id: id,
    }).addTo(map);
    markers.push(marker);
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
    marker.bindPopup(content); //.openPopup();
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
      const gpxData = await loadGPXData(path + bigDir + tracks[i].url);
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
      })
        .on("loaded", (e) => {
          //console.log(e.target);
        })
        .addTo(map);
      gpxLayers[i].id = tracks[i].url.slice(1, 9);
      //console.log(gpxLayers)
    } catch (error) {
      console.error("Error loading GPX data:", error);
    }
  }
  return true;
}

function radekTabulky(jmeno, id, delka) {
  const pocetRadku = tabulka.tBodies[0].rows.length;
  const row = tabulka.tBodies[0].insertRow(pocetRadku);
  row.id = id;
  const cell1 = row.insertCell(0);
  const cell2 = row.insertCell(1);
  const cell3 = row.insertCell(2);
  const cell4 = row.insertCell(3);
  cell1.setAttribute("onclick", "posun(parentNode.id)");
  cell1.innerHTML = jmeno;
  cell2.innerHTML = delka;
  cell3.innerHTML = '<input type="checkbox" class="podrobnost">';
  cell4.innerHTML = '<input type="checkbox" class="zobrazeni" checked>';
  const zobrazeni = document
    .getElementById(id)
    .getElementsByClassName("zobrazeni")[0];
  const podrobnost = document
    .getElementById(id)
    .getElementsByClassName("podrobnost")[0];
  //zobrazeni/skryti
  zobrazeni.addEventListener("click", function () {
    var layer = getLayerWithId(id);
    if (zobrazeni.checked) {
      addRoute(layer);
      podrobnost.disabled = false;
    } else {
      removeRoute(layer);
      podrobnost.disabled = true;
    }
  });
}

function addRoute(layer) {
  map.addLayer(layer);
  map.addLayer(getMarkerWithId(layer.id));
}

function removeRoute(layer) {
  map.removeLayer(layer);
  map.removeLayer(getMarkerWithId(layer.id));
}

window.createTable = function (type) {
  let sources = [];
  if (type === "lidiTab") {
    sources = people;
    sources.sort(function (a, b) {
      return b.value - a.value;
    });
  } else {
    sources = roky;
  }
  let tableCreated = document.getElementById(type).getElementsByTagName("tr");
  let table = document.getElementById(type);
  if (tableCreated.length === 1) {
    var k = "<tbody>";
    for (const source of sources) {
      if (type !== "lidiTab" || source.value > 3) {
        //nezobrazuju lidi s mene nez 3 vylety
        k += '<tr onclick="showHideTrips(this)" id="' + source.item + '">';
      } else {
        k +=
          '<tr onclick="showHideTrips(this)" id="' +
          source.item +
          '" class="hideable hidden">';
      }
      k += "<td>" + source.item + ":</td>";
      k += "<td>" + source.value + "</td>";
      k += "</tr>";
    }
    if (type === "lidiTab") {
      k += '<tr onclick="loadMore()">';
      k += '<td colspan=2 id = "showMoreButton">Zobraz vsechny</td>';
      k += "</tr>";
    }
    k += "</tbody>";
    table.innerHTML += k;
  }
  table.classList.toggle("show");
};

window.loadMore = function () {
  let tableLidi = document.getElementById("lidiTab");
  let hideableRows = tableLidi.getElementsByClassName("hideable");
  for (const row of hideableRows) {
    row.classList.toggle("hidden");
  }
  let hiddenRows = tableLidi.getElementsByClassName("hidden");
  let showMoreButton = document.getElementById("showMoreButton");
  if (hiddenRows.length > 0) {
    showMoreButton.innerHTML = "Zobraz vsechny";
  } else {
    showMoreButton.innerHTML = "Skryj lidi s mene nez 3 vylety";
  }
};

window.showHideTrips = function (el) {
  el.classList.toggle("grey");
  let greyRows = [];
  let grey = document.getElementsByClassName("grey");
  for (let greyRow of grey) {
    greyRows.push(greyRow.id);
  }
  let tripIds = [];
  let first = true;
  for (let val of greyRows) {
    let peoplePos = people.findIndex((a) => a.item === val);
    if (peoplePos === -1) {
      let rokyPos = roky.findIndex((a) => a.item === val);
      if (tripIds.length === 0 && first === true) {
        tripIds = roky[rokyPos].ids.slice(0);
        first = false;
      } else {
        tripIds = tripIds.filter(function (n) {
          return roky[rokyPos].ids.indexOf(n) !== -1;
        });
      }
    } else {
      if (tripIds.length === 0 && first === true) {
        tripIds = people[peoplePos].ids.slice(0);
        first = false;
      } else {
        tripIds = tripIds.filter(function (n) {
          return people[peoplePos].ids.indexOf(n) !== -1;
        });
      }
    }
  }

  for (const layer of gpxLayers) {
    if (greyRows.length === 0) {
      addRoute(layer);
      document
        .getElementById(layer.id)
        .getElementsByClassName("zobrazeni")[0].checked = true;
      document
        .getElementById(layer.id)
        .getElementsByClassName("podrobnost")[0].disabled = false;
    } else {
      if (tripIds.includes(layer.id) && !map.hasLayer(layer)) {
        addRoute(layer);
        document
          .getElementById(layer.id)
          .getElementsByClassName("zobrazeni")[0].checked = true;
        document
          .getElementById(layer.id)
          .getElementsByClassName("podrobnost")[0].disabled = false;
      }
      if (!tripIds.includes(layer.id) && map.hasLayer(layer)) {
        removeRoute(layer);
        document
          .getElementById(layer.id)
          .getElementsByClassName("zobrazeni")[0].checked = false;
        document
          .getElementById(layer.id)
          .getElementsByClassName("podrobnost")[0].disabled = true;
      }
    }
  }
};

window.resetTrips = function () {
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
};

window.posun = function (id) {
  console.log(id);
  const layer = getLayerWithId(id);
  //console.log(layer)
  map.fitBounds(layer.getBounds());
  const green = tabulka.getElementsByClassName("selected");
  while (green.length) {
    green[0].classList.remove("selected");
  }
  document.getElementById(id).classList.add("selected");
  document.location.hash = "id=" + id;
  otevreneId = id;
  if (map.hasLayer(layer)) {
    getMarkerWithId(id).openPopup();
  }
};

function getLayerWithId(id) {
  const layerIndex = gpxLayers.findIndex((layer) => layer.id === id);
  return gpxLayers[layerIndex];
}

function getMarkerWithId(id) {
  const layerIndex = markers.findIndex((marker) => marker.options.id === id);
  return markers[layerIndex];
}

map.addEventListener("popupopen", function (e) {
  console.log(e);
});

window.singleViewReset = function () {
  document.location.href = document.location.href.substr(
    0,
    document.location.href.indexOf("#")
  );
};

async function render(seznamTras) {
  const id = document.location.hash.slice(4);;
  let routes = [];
  if (id !== "") {
    routes = [
      seznamTras.find((singleRoute) => singleRoute.url.indexOf(id) !== -1),
    ];
    // setGranularity("big");
    document.getElementsByClassName("singleView")[0].classList.toggle("hidden");
    document.getElementsByClassName("multiView")[0].classList.toggle("hidden");
  } else {
    routes = seznamTras.reverse();
  }
  console.log(routes);
  const loaded = await addGPXTracksToMap(routes);
  console.log(id);
   if (id !== "" && loaded) {
     window.posun(id);
   }
  

  return loaded;
}

const loaded = await render(seznamTras);
if (loaded) {
  let disabledInputs = document.getElementsByClassName("disableable");
  for (const input of disabledInputs) {
    input.disabled = false;
  }
}
