export const state = {
  routeList: [],
  gpxLayers: [],
  markers: [],
  markersCluster: null,
  markersRemovedFromCluster: [],
  people: [],
  years: [],
  totalKm: 0,
  currentHashId: null,
  isSingleView: false,
};

export function updateState(newState) {
  Object.assign(state, newState);
}

export function resetState() {
  state.gpxLayers = [];
  state.markers = [];
  state.markersRemovedFromCluster = [];
  state.people = [];
  state.years = [];
  state.totalKm = 0;
  if (state.markersCluster) {
    state.markersCluster.clearLayers();
  }
}
