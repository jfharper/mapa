import {move, removeRoute, addRoute, getLayerWithId, years, people, gpxLayers, map} from "./script.js"

function createTableRow(jmeno, id, delka) {
  const pocetRadku = tripsTable.tBodies[0].rows.length;
  const row = tripsTable.tBodies[0].insertRow(pocetRadku);
  row.id = id;
  const cell1 = row.insertCell(0);
  const cell2 = row.insertCell(1);
  const cell3 = row.insertCell(2);
  const cell4 = row.insertCell(3);
  cell1.innerHTML = jmeno;
  cell1.addEventListener("click", function () {
    move(this.parentNode.id);
  });
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
    const layer = getLayerWithId(id);
    if (zobrazeni.checked) {
      addRoute(layer);
      podrobnost.disabled = false;
    } else {
      removeRoute(layer);
      podrobnost.disabled = true;
    }
  });
}

window.createTable = function (type) {
  let sources = [];
  if (type === "peopleTable") {
    sources = people;
    sources.sort(function (a, b) {
      return b.value - a.value;
    });
  } else {
    sources = years;
  }
  let tableCreated = document.getElementById(type).getElementsByTagName("tr");
  let table = document.getElementById(type);
  if (tableCreated.length === 1) {
    var k = "<tbody>";
    for (const source of sources) {
      if (type !== "peopleTable" || source.value > 3) {
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
    if (type === "peopleTable") {
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
  let tableLidi = document.getElementById("peopleTable");
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
      let yearsPos = years.findIndex((a) => a.item === val);
      if (tripIds.length === 0 && first === true) {
        tripIds = years[yearsPos].ids.slice(0);
        first = false;
      } else {
        tripIds = tripIds.filter(function (n) {
          return years[yearsPos].ids.indexOf(n) !== -1;
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

export { createTableRow };
