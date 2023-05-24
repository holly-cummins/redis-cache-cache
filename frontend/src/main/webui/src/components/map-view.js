import { css, html } from 'lit';
import { BaseElement } from './base-element.js';
import './map-image.js';
import './seeker-path.js';
import { CoordinateConverter } from '../geometry/cooordinate-converter.js';
import { Discovery } from '../discovery/discovery.js';

// Ideally we wouldn't hard-code this, but we need to know it at render-time to do calculations; reading our own values at
// render time is not reliable because we haven't finished rendering
// If we wanted to be fancy we could do a @media query in the css and have scale factors to multiply by
const width = 1000;
const height = width * 0.65;

class MapView extends BaseElement {
  coordinateConverter;

  static styles = [
    BaseElement.styles,
    css`
      .places {
        height: ${height}px;
        width: 100%;
      }

      .outer {
        left: 0;
        margin: 80px;
      }

      .map {
        left: 0;
        top: 0;
        position: relative;
        width: ${width}px;
        height: ${height}px;
        padding: 0;
        z-index: 0;
      }

      .place {
        position: absolute;
        z-index: 18;
      }

      .seeker {
        color: blue;
      }

      .discovery {
        color: red;
        animation: pulse 1s 6;
      }

      @keyframes pulse {
        0% {
          transform: scale(0.95);
        }

        70% {
          transform: scale(1);
        }

        100% {
          transform: scale(0.95);
        }
      }

      .hiding {
        color: green;
      }

      .visited {
        color: silver;
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

  discovery = new Discovery();

  static get properties() {
    return {
      places: {},
      positions: {},
      seeks: { type: Array },
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
      return html` <h2>No places were added</h2> `;
    }
    return html`
      <div class="outer">
        <div class="map">
          <seeker-path
            count=${this.seeks?.length}
            .points="${this.seeks}"
            height="${height}"
            width="${width}"
          ></seeker-path>
          <map-image
            .converter="${this.coordinateConverter}"
            height="${height}"
            width="${width}"
          ></map-image>
          <div class="places">
            ${this.places.map(entry => this.plot(entry))}
          </div>
        </div>
      </div>
    `;
  }

  plot(place) {
    const [x, y] = this.coordinateConverter.getCoordinatesForPlace(place);

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
      const loc = await this.discovery.resolve('place', window.location.href);
      const response = await fetch(`${loc}/places/`);
      this.places = await response?.json();

      this.coordinateConverter = new CoordinateConverter({
        places: this.places,
        height,
        width,
      });
    } catch (e) {
      console.warn('Could not fetch map information.', e);
      this.places = [];
    }
  };

  queryData = async e => {
    const name = e.detail?.place;
    try {
      const response = await this.discovery
        .resolve('place', window.location.href)
        .then(location => fetch(`${location}/places/search?query=${name}`));
      const newPlaces = await response?.json();
      if (response.status === 200) {
        if (newPlaces) {
          const concatenatedPlaces = newPlaces.concat(this.places || []);
          // Strip places with the same name
          this.places = concatenatedPlaces.filter(
            (element, index) =>
              concatenatedPlaces.findIndex(
                secondElement => element.name === secondElement.name
              ) === index
          );

          this.coordinateConverter = new CoordinateConverter({
            places: this.places,
            height,
            width,
          });
        }
      }
    } catch (err) {
      console.warn('Could not fetch map information.', err);
      this.places = [];
    }
  };

  getPlace = name => this.places?.find(place => place.name === name);

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
    if (parsedEvent.kind === 'PING') {
      return;
    }
    this.updatePositions(parsedEvent);
    this.requestUpdate('positions');
  };

  async openConnection() {
    this.discovery.resolve('game', window.location.href).then(location => {
      // Server side positions
      this.eventSource = new EventSource(`${location}/games/events`);
      this.eventSource.onmessage = this.onServerUpdate;
      this.eventSource.onopen = () => {
        console.log('Map connected to game positions.');
      };
      this.eventSource.onerror = err => {
        console.warn('Error:', err);
      };
    });
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
        this.seeks = [];
        break;
      case 'PLAYER_DISCOVERED': {
        this.positions[event.place] = 'discovery';
        break;
        // Do we want to wipe this?
      }
      case 'SEEKER_MOVE': {
        if (!this.seeks) {
          this.seeks = [];
        }
        this.seeks.unshift({
          to: this.coordinateConverter.getCoordinatesForPlace(
            this.getPlace(event.destination)
          ),
          from: this.coordinateConverter.getCoordinatesForPlace(
            this.getPlace(event.place)
          ),
          duration: event.duration,
        });

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
