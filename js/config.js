export const API_KEY = "H3kT2-i1u8kukLpZRkZGP-ANDGjqvp_TmVPVvZo9g3M";
export const SMALL_DIR = "smalltrips/";
export const BIG_DIR = "trips/";
export const ROUTES_DATA_PATH = "data/routes.json";

export const BARVY = {
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

export const COLORS_HELPERS = {
  colorsDefault: [
    "modra",
    "zluta",
    "cervena",
    "svetlemodra",
    "fialova",
    "oranzova",
    "fialova2",
    "cervena2",
    "svetlemodra2",
    "seda",
    "ruzova",
  ],
  petBarev: [
    "fialova",
    "zelena",
    "seda",
    "cervena2",
    "ruzova",
  ],
  triBarvy: ["oranzova", "svetlemodra2", "fialova2"],
};

export const COLORS_DEFAULT = COLORS_HELPERS.colorsDefault;

export const WAYPOINT_OPTIONS = {
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
