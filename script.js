// JavaScript Document
      //type="text/javascript"
      const API_KEY = "H3kT2-i1u8kukLpZRkZGP-ANDGjqvp_TmVPVvZo9g3M";
      var barvy = {
        modra: "#004c8c",
        oranzova: "#ff9b11",
        zluta: "#ffd625",
        fialova: "#840026",
        svetlemodra: "#89cdff",
        fialova2: "#522476",
        cervena: "#ff0000",
        cervena2: "#c9000e",
        svetlemodra2: "#008ad4",
        seda: "#303030",
        ruzova: "#bb6060",
        zelena: "#44f144",
      };
      function getOtherLineOptions() {
				return {opacity: 1.0, weight: 4, lineCap: "round",}
			}
			
			function getLineOptions(colorsArray = barvyDefault) {
				return colorsArray.forEach((barva) => polylineOptions.push({...{color: barva},...getOtherLineOptions()}));
			}
			var polylineOptions = [];
			
      var barvyDefault = [barvy.modra, barvy.zluta, barvy.cervena, barvy.svetlemodra, barvy.fialova, barvy.oranzova, barvy.fialova2, barvy.cervena2, barvy.svetlemodra2, barvy.seda, barvy.ruzova];
      var petBarev = [
        barvy.fialova,
        barvy.zelena,
        barvy.seda,
        barvy.cervena2,
        barvy.ruzova,
      ];
      var triBarvy = [barvy.oranzova, barvy.svetlemodra2, barvy.fialova2];
      const path = "https://jfharper.github.io/mapa/";
      const smallDir = "smalltrips/";
      const bigDir = "trips/";
      var tripsCounter = 0;
      var metadataObj = {};
			var gpxLayers = [];
      const seznamTras = [
        { url: "20070813-18%20-%20Slovensky%20raj.xml" },
        //{url: "20090801-04%20-%20Sumava%20%28Antygl%20-%20Zaton%29.xml", barva: petBarev},
        {
          url: "/20220806-07%20-%20Kasperske%20Hory%20-%20Kasperske%20Hory.xml",
          barva: petBarev,
        },
      ];
      document.getElementById("vylety").innerHTML = seznamTras.length;
      var tabulka = document.getElementById("tabulka");

      const map = L.map("map").setView([49.8729317, 14.8981184], 9);
      L.tileLayer(
        "https://api.mapy.cz/v1/maptiles/outdoor/256/{z}/{x}/{y}?apikey=" +
          API_KEY,
        {
          minZoom: 0,
          maxZoom: 19,
          attribution:
            '<a href="https://api.mapy.cz/copyright" target="_blank">&copy; Seznam.cz a.s. a další</a>',
        }
      ).addTo(map);

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
			document.addEventListener('keydown', function(event) {
				if (event.ctrlKey && event.altKey && event.key === 'u') {
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
      const spani = new L.GPX(path + "spani.xml", waypointOptions)
        
			const checkboxFirepit = document.getElementById("firepit");
			checkboxFirepit.addEventListener("click", function() {
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
          const metadata = gpxData.split('<metadata>').pop().split('</metadata>')[0];
          const name =  metadata.split('<name>').pop().split('</name>')[0];
          const lide = metadata.split('<keywords>').pop().split('</keywords>')[0];
          const desc = metadata.split('<desc>').pop().split('</desc>')[0].split('\n')[0];
          const start =  gpxData.split('<trkpt ').pop().split('<ele>')[0].trim().slice(0, -1).split(' ');
          console.log(start);
          metadataObj[name.substr(0,8)] = {'name': name,'lide': lide, 'desc': desc, 'start': start};
          console.log(metadataObj)
          return gpxData;
        } catch (error) {
          console.error("Error loading GPX data:", error);
          throw error;
        }
      }

      async function addGPXTracksToMap(tracks) {
        for (let i = 0; i <= tracks.length-1 ; i++) {
        	polylineOptions = [];
          try {
            const gpxData = await loadGPXData(
              path + bigDir + tracks[i].url
            );
						if(tracks[i].barva) {getLineOptions(tracks[i].barva)} else {getLineOptions()}
            gpxLayers[i] = new L.GPX(gpxData, {
              async: true,
              parseElements: ["track"],
              gpx_options: { joinTrackSegments: false },
              polyline_options: polylineOptions,
              markers: { startIcon: null, endIcon: null },
            }).on('loaded', (e) => {
        //console.log(e.target);
        tripsCounter += 1;
      }).addTo(map);
            //console.log(gpxLayers)
          } catch (error) {
            console.error("Error loading GPX data:", error);
          }
          
        }
        return true
      }
      
      function getLayerWithId (id) {
				const layerIndex = gpxLayers.findIndex((layer) => layer._info.name.substr(0,8) === id)
				return gpxLayers[layerIndex];
			}
			//async function init() {
				const loaded = await addGPXTracksToMap(seznamTras);
				console.log(tripsCounter);
      	if (tripsCounter !== seznamTras.length) {
      	setTimeout(() => {
  const pokus = getLayerWithId("20090801");
      		console.log("layer ", pokus)
}, "1000");
      	}
					
      	
			//}

      //await init();

      //			const trasa = new L.GPX(path + bigDir + seznamTras[1].url, {
      //  gpx_options: {
      //    joinTrackSegments: false,
      //     endIcon: null,
      //  }
      //}).on('loaded', function(e) {
      //  map.fitBounds(e.target.getBounds());
      //}).addTo(map);
      //	 console.log(trasa)