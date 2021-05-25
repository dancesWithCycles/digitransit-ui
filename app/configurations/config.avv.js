/* eslint-disable */
import configMerger from '../util/configMerger';

const CONFIG = 'avv';
const APP_TITLE = 'AVV';
const APP_DESCRIPTION = 'stadtnavi - AVV';
const API_URL = process.env.API_URL || 'https://api.stadtnavi.de';
const MAP_URL = process.env.MAP_URL || 'https://tiles.stadtnavi.eu/streets/{z}/{x}/{y}{r}.png';
const SEMI_TRANSPARENT_MAP_URL = process.env.SEMI_TRANSPARENT_MAP_URL ||         'https://api.maptiler.com/maps/ffa4d49e-c68c-46c8-ab3f-60543337cecb/256/{z}/{x}/{y}.png?key=eA0drARBA1uPzLR6StGD';
const GEOCODING_BASE_URL = process.env.GEOCODING_BASE_URL || "https://photon.stadtnavi.eu/pelias/v1";
const LOCATIONIQ_API_KEY = process.env.LOCATIONIQ_API_KEY;
const YEAR = 1900 + new Date().getYear();
const STATIC_MESSAGE_URL =
process.env.STATIC_MESSAGE_URL ||
'/assets/messages/message.hb.json';

const walttiConfig = require('./config.waltti.js').default;

const minLat = 48.395;
const maxLat = 48.6075;
const minLon = 9.0901;
const maxLon = 9.3616;

export default configMerger(walttiConfig, {
  CONFIG,
  URL: {
    OTP: process.env.OTP_URL || `${API_URL}/routing/v1/router/`,
    MAP: {
      default: MAP_URL,
      satellite: `${API_URL}/tiles/orthophoto/{z}/{x}/{y}.jpg`,
      semiTransparent: SEMI_TRANSPARENT_MAP_URL,
      bicycle: 'https://{s}.tile-cyclosm.openstreetmap.fr/cyclosm/{z}/{x}/{y}.png',
    },
    STOP_MAP: `${API_URL}/map/v1/stop-map/`,
    GEOCODING_BASE_URL: GEOCODING_BASE_URL,
    CITYBIKE_MAP: `${API_URL}/map/v1/regiorad-map/`
  },

  appBarLink: false,

  availableLanguages: ['de', 'en'],
  defaultLanguage: 'de',

  mainMenu: {
    showDisruptions: false,
  },

  logo: 'hb/stadtnavi-logo.svg',

  colors: {
    primary: '#ff5300',
  },

  socialMedia: {
    title: APP_TITLE,
    description: APP_DESCRIPTION,
  },

  title: APP_TITLE,

  textLogo: false,

  feedIds: ['Reutlingen'],

  searchParams: {
    'boundary.rect.min_lat': minLat,
    'boundary.rect.max_lat': maxLat,
    'boundary.rect.min_lon': minLon,
    'boundary.rect.max_lon': maxLon,
  },
  
  map: {
    useRetinaTiles: true,
    tileSize: 256,
    zoomOffset: 0
  },

  areaPolygon: [
    [minLon, minLat],
    [minLon, maxLat],
    [maxLon, maxLat],
    [maxLon, minLat],
  ],

  defaultEndpoint: {
    address: 'Reutlingen',
    lat: 0.5 * (minLat + maxLat),
    lon: 0.5 * (minLon + maxLon),
  },

  defaultOrigins: [
    {
      icon: 'icon-icon_bus',
      label: 'ZOB Herrenberg',
      lat: 48.5942066,
      lon: 8.8644041,
    },
    {
      icon: 'icon-icon_star',
      label: 'Krankenhaus',
      lat: 48.59174,
      lon: 8.87536,
    },
    {
      icon: 'icon-icon_star',
      label: 'Waldfriedhof / Schönbuchturm',
      lat: 48.6020352,
      lon: 8.9036348,
    },
  ],

  footer: {
    content: [
      { label: `© Reutlingen ${walttiConfig.YEAR}` },
      {},
      {
        name: 'about-this-service',
        nameEn: 'About this service',
        route: '/dieser-dienst',
        icon: 'icon-icon_info',
      },
    ],
  },

  aboutThisService: {
    de: [
      {
        header: 'Über diesen Dienst',
        paragraphs: [
          '<a href="https://stadtnavi.de/">Stadtnavi</a> ist eine Reiseplannungs-Anwendung für die Region Herrenberg. Dieser Dienst umfasst ÖPNV, Fußwege, Radverkehr, PKW-Routing (inklusive Park & Ride) und Fahrgemeinschaften.',
          'Gefördert durch <br>',
          '<a href="https://www.herrenberg.de/stadtluft"><img src="https://www.herrenberg.de/ceasy/resource/?id=4355&predefinedImageSize=rightEditorContent"/></a>',
          '<a href="https://stadtnavi.de/">Zur Infoseite</a>'
        ],
      },
      {
        header: 'Digitransit Plattform',
        paragraphs: [
          'Dieser Dienst basiert auf der Digitransit Platform und dem Backend-Dienst OpenTripPlanner. Alle Software ist unter einer offenen Lizenzen verfügbar. Vielen Dank an alle Beteiligten.',        ],
      },
      {
        header: 'Datenquellen',
        paragraphs: [
          'Kartendaten: © <a target=new href=https://www.openstreetmap.org/>OpenStreetMap Mitwirkende</a>',
          'ÖPNV-Daten: Datensätze der <a target=new href=https://www.nvbw.de/aufgaben/digitale-mobilitaet/open-data/>NVBW GmbH</a> und der <a target=new href=https://www.openvvs.de/dataset/gtfs-daten>VVS GmbH</a>, Shapes (d.h. Geometrien der Streckenverläufe) jeweils angereichert mit OpenStreetMap-Daten © OpenStreetMap Mitwirkende',
          'Alle Angaben ohne Gewähr.'
        ],
      },
    ],
    fi: [
      {
        header: 'Tietoja palvelusta',
        paragraphs: [
          'Tämän palvelun tarjoaa Reutlingen reittisuunnittelua varten Reutlingen alueella. Palvelu kattaa joukkoliikenteen, kävelyn, pyöräilyn ja yksityisautoilun rajatuilta osin. Palvelu perustuu Digitransit-palvelualustaan.',
        ],
      },
    ],

    sv: [
      {
        header: 'Om tjänsten',
        paragraphs: [
          'Den här tjänsten erbjuds av Reutlingen för reseplanering inom Reutlingen region. Reseplaneraren täcker med vissa begränsningar kollektivtrafik, promenad, cykling samt privatbilism. Tjänsten baserar sig på Digitransit-plattformen.',
        ],
      },
    ],

    en: [
      {
        header: 'About this service',
        paragraphs: [
          'This service is provided by Reutlingen for route planning in Reutlingen region. The service covers public transport, walking, cycling, and some private car use. Service is built on Digitransit platform.',
        ],
      },
    ],
  },
  // geojson config:
  
});

