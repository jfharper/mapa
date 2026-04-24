export const state = {
  routeList: [],
  gpxLayers: [],
  markers: [],
  people: [],
  years: [],
  totalKm: 0,
  currentHashId: null,
};

export function updateState(newState) {
  Object.assign(state, newState);
}

export function resetState() {
  state.gpxLayers = [];
  state.markers = [];
  state.people = [];
  state.years = [];
  state.totalKm = 0;
}
