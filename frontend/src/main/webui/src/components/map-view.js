import { css, html } from 'lit';
import { BaseElement } from './base-element.js';
import './map-image.js';

// This is only needed for single-point or row or column cases, and the exact value doesn't matter then
const defaultScaleFactor = 10000;

// Ideally we wouldn't hard-code this, but we need to know it at render-time to do calculations; reading our own values at
// render time is not reliable because we haven't finished rendering
// If we wanted to be fancy we could do a @media query in the css and have scale factors to multiply by
const width = 1000;
const height = width * 0.65;

class MapView extends BaseElement {
  static styles = [
    BaseElement.styles,
    css`
      .places {
        height: ${height}px;
        width: 100%;
      }

      .outer {
        left: 0;
        position: absolute;
        margin: 80px;
      }

      .map {
        left: 0;
        top: 0;
        width: ${width}px;
        height: ${height}px;
        padding: 0;
        z-index: 0;
      }

      .place {
        position: absolute;
      }

      .seeker {
        color: blue;
      }

      .discovery {
        color: red;
      }

      .hiding {
        color: green;
      }

      .visited {
        color: grey;
      }

      .normal {
        color: black;
      }

      .marker {
        width: 4px;
        height: 4px;
        transform: translateX(-2px) translateY(-2px);
        background-color: black;
      }

      .label {
        width: 100px; // an arbitrary width, so we can center in it
        text-align: center;
        transform: translateX(-50%) translateY(-120%);
      }
    `,
  ];

  static get properties() {
    return {
      places: {},
      positions: {},
      scaleFactor: {},
      latitudeOffset: {},
      longitudeOffset: {},
      aspectRatio: {},
      eventSource: {},
      heightInDegrees: {},
      widthInDegrees: {},
      minLatitude: {},
      minLongitude: {},
    };
  }

  render() {
    if (!this.places) {
      return html` <h2>Aucun lieu n'a été ajouté</h2> `;
    }
    return html`
      <div class="outer">
        <div class="map">
          <map-image
            height="${height}"
            width="${width}"
            heightInDegrees="${this.heightInDegrees}"
            widthInDegrees="${this.widthInDegrees}"
            minLatitude="${this.minLatitude}"
            minLongitude="${this.minLongitude}"
            isSinglePoint="${this.scaleFactor === defaultScaleFactor}"
          ></map-image>
          <div class="places">
            ${this.places.map(entry => this.plot(entry))}
          </div>
        </div>
      </div>
    `;
  }

  // Turns latitude and longitude into x and y (left and top) coordinates.
  transform(coord) {
    // Remember, latitude and longitude are the opposite order from x and y, so we *would* swap them
    // ... except that redis GEO format *already* swaps them!

    // We also need to shift our coordinate system from (0,0) being in bottom-left corner to (0,0) being in the top-left corner

    const x =
      (coord[0] - this.longitudeOffset) * this.scaleFactor * this.aspectRatio;
    const y = height - (coord[1] - this.latitudeOffset) * this.scaleFactor;

    return [x, y];
  }

  plot(place) {
    const coordinates = place.coordinates.split(',').map(n => parseFloat(n));
    const transformed = this.transform(coordinates);
    const x = transformed[0];
    const y = transformed[1];

    const position = `left:${x}px; top:${y}px`;

    let activity = '';
    if (this.positions) {
      activity = this.positions[place.name] || '';
    }

    return html` <div class="place ${activity}" style=${position}>
      <div class="marker"></div>
      <div class="label">${place.name}</div>
    </div>`;
  }

  fetchData = async () => {
    try {
      const response = await fetch('http://localhost:8092/places/');
      this.places = await response?.json();

      this.processPlaces();
    } catch (e) {
      console.warn('Could not fetch map information.', e);
      this.places = [];
    }
  };

  queryData = async e => {
    const name = e.detail?.place;
    try {
      const response = await fetch(
        `http://localhost:8092/places/search?query=${name}`
      );
      const newPlaces = await response?.json();
      if (response.status === 200) {
        if (newPlaces) {
          const concattedPlaces = newPlaces.concat(this.places || []);
          // Strip places with the same name
          this.places = concattedPlaces.filter(
            (element, index) =>
              concattedPlaces.findIndex(
                secondElement => element.name === secondElement.name
              ) === index
          );

          this.processPlaces();
        }
      }
    } catch (err) {
      console.warn('Could not fetch map information.', err);
      this.places = [];
    }
  };

  processPlaces = () => {
    const { places } = this;
    // NOTE! You would think the coordinates are latitude,longitude, but redis swaps those
    const latitudes = places.map(place => place.coordinates.split(',')[1]);
    const longitudes = places.map(place => place.coordinates.split(',')[0]);

    // How many degrees we expect the map to cover
    this.minLatitude = Math.min(...latitudes);
    this.minLongitude = Math.min(...longitudes);

    const latitudeRange = Math.max(...latitudes) - this.minLatitude;
    const longitudeRange = Math.max(...longitudes) - this.minLongitude;

    // This is simple equirectangular projection. The npm package proj4 would be more precise, but also harder
    // See https://stackoverflow.com/questions/16266809/convert-from-latitude-longitude-to-x-y for details
    // Convert degrees to radians
    const latitudeInRadians = (this.minLatitude / 180) * Math.PI;

    // This adjusts the up-and-down-squishedness of the map
    // We can use a geographically 'correct' value, or tune it to look good
    // No matter what value we set for this, the tests should still pass
    this.aspectRatio = Math.cos(latitudeInRadians);

    // check height and width both to make sure it fits
    this.scaleFactor = Math.min(
      longitudeRange > 0
        ? width / (longitudeRange * this.aspectRatio)
        : defaultScaleFactor,
      latitudeRange > 0 ? height / latitudeRange : defaultScaleFactor
    );

    this.heightInDegrees = height / this.scaleFactor;
    this.widthInDegrees = width / (this.scaleFactor * this.aspectRatio);

    this.latitudeOffset =
      this.minLatitude - (this.heightInDegrees - latitudeRange) / 2;
    this.longitudeOffset =
      this.minLongitude - (this.widthInDegrees - longitudeRange) / 2;
  };

  connectedCallback() {
    super.connectedCallback();
    window.addEventListener('add-all-places', this.fetchData, {});
    window.addEventListener('add-place', this.queryData, {});
    this.openConnection();
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    window.removeEventListener('add-all-places', this.fetchData, {});
    window.removeEventListener('add-place', this.queryData, {});

    this.closeConnection();
  }

  onServerUpdate = event => {
    if (!this.positions) this.positions = {};
    const parsedEvent = JSON.parse(event?.data);
    this.updatePositions(parsedEvent);
    this.requestUpdate('positions');
  };

  async openConnection() {
    // Server side positions
    this.eventSource = new EventSource('http://localhost:8091/games/events');
    this.eventSource.onmessage = this.onServerUpdate;
    this.eventSource.onopen = () => {
      console.log('Map connected to game positions.');
    };
    this.eventSource.onerror = err => {
      console.warn('Error:', err);
    };
  }

  closeConnection() {
    this.eventSource?.close();
  }

  updatePositions(event) {
    switch (event.kind) {
      case 'HIDER':
        // TODO want to show the name?
        // TODO we do not actually have hiding events
        this.positions[event.place] = 'hiding';
        break;
      case 'NEW_GAME':
        this.positions = {};
        break;
      case 'PLAYER_DISCOVERED': {
        this.positions[event.place] = 'discovery';
        break;
        // Do we want to wipe this?
      }
      case 'SEEKER_MOVE': {
        // TODO want a nice transition
        this.positions[event.destination] = 'seeker';
        // Don't overwrite discoveries when we move off them
        if (this.positions[event.place] !== 'discovery') {
          this.positions[event.place] = 'visited';
        }
        break;
      }
      case 'GAME_OVER': {
        break;
      }

      default:
    }
  }
}

// Custom elements have to have a hyphen in the name, even in cases like this, where it doesn't really make sense
customElements.define('map-view', MapView);
