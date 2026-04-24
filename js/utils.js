import { COLORS_DEFAULT, BARVY, COLORS_HELPERS } from "./config.js";

/**
 * Builds polyline options for Leaflet GPX.
 * @param {string|string[]} colorsInput - Name of helper, array of names, or hex codes.
 * @returns {object[]} Array of options objects.
 */
export function buildPolylineOptions(colorsInput = COLORS_DEFAULT) {
  let colorsArray = [];

  if (typeof colorsInput === "string") {
    if (COLORS_HELPERS[colorsInput]) {
      colorsArray = COLORS_HELPERS[colorsInput];
    } else {
      colorsArray = [colorsInput];
    }
  } else if (Array.isArray(colorsInput)) {
    colorsArray = colorsInput;
  }

  return colorsArray.map((colorName) => {
    const hex = BARVY[colorName] || colorName;
    return {
      color: hex,
      opacity: 1.0,
      weight: 4,
      lineCap: "round",
    };
  });
}

/**
 * Parses GPX metadata in a single pass.
 * @param {string} gpxData - The GPX XML string.
 * @returns {object|null} Parsed metadata or null.
 */
export function parseGPXMetadata(gpxData) {
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(gpxData, "application/xml");
  const metadata = xmlDoc.querySelector("metadata");

  if (!metadata) return null;

  const name = metadata.querySelector("name")?.textContent.slice(0, -4) || "";
  const id = name.slice(0, 8);
  const people = metadata
    .querySelector("keywords")
    ?.textContent.split(",")
    .map((a) => a.trim())
    .filter((a) => a) || [];

  const descText = metadata.querySelector("desc")?.textContent.trim() || "";
  const desc = descText.split(",").map((v) => v.trim());

  const startTmp = xmlDoc.querySelector("trkpt");
  const start = startTmp
    ? [startTmp.getAttribute("lat"), startTmp.getAttribute("lon")]
    : null;

  return {
    name,
    id,
    people,
    km: desc[0] ? Number(desc[0]) : 0,
    ascent: desc[1] ? Number(desc[1]) : 0,
    descent: desc[2] ? Number(desc[2]) : 0,
    start,
    year: id.slice(0, 4),
  };
}

/**
 * Helper to get element by ID.
 * @param {string} id 
 * @returns {HTMLElement}
 */
export const $ = (id) => document.getElementById(id);

/**
 * Helper to select elements.
 * @param {string} selector 
 * @param {HTMLElement} context 
 * @returns {NodeList}
 */
export const $$ = (selector, context = document) => context.querySelectorAll(selector);
