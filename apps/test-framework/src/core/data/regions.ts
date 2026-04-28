export interface AlertRegion {
  uid: number;
  title: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
}

export const AlertRegions = {
  KHMELNYTSKYI_OBLAST: {
    uid: 3,
    title: 'Хмельницька область',
    coordinates: {
      latitude: 49.2686,
      longitude: 27.0635,
    },
  },
  VINNYTSIA_OBLAST: {
    uid: 4,
    title: 'Вінницька область',
    coordinates: {
      latitude: 49.2333,
      longitude: 28.4833,
    },
  },
  RIVNE_OBLAST: {
    uid: 5,
    title: 'Рівненська область',
    coordinates: {
      latitude: 51.2074,
      longitude: 26.5208,
    },
  },
  VOLYN_OBLAST: {
    uid: 8,
    title: 'Волинська область',
    coordinates: {
      latitude: 50.75,
      longitude: 25.3358,
    },
  },
  DNIPRO_OBLAST: {
    uid: 9,
    title: 'Дніпропетровська область',
    coordinates: {
      latitude: 48.6625,
      longitude: 34.9501,
    },
  },
  ZHYTOMYR_OBLAST: {
    uid: 10,
    title: 'Житомирська область',
    coordinates: {
      latitude: 50.25,
      longitude: 28.6667,
    },
  },
  ZAKARPATTIA_OBLAST: {
    uid: 11,
    title: 'Закарпатська область',
    coordinates: {
      latitude: 48.6239,
      longitude: 22.295,
    },
  },
  ZAPORIZHZHIA_OBLAST: {
    uid: 12,
    title: 'Запорізька область',
    coordinates: {
      latitude: 47.85,
      longitude: 35.1175,
    },
  },
  IVANO_FRANKIVSK_OBLAST: {
    uid: 13,
    title: 'Івано-Франківська область',
    coordinates: {
      latitude: 48.7481,
      longitude: 24.5207,
    },
  },
  KYIV_OBLAST: {
    uid: 14,
    title: 'Київська область',
    coordinates: {
      latitude: 50.1785,
      longitude: 30.4924,
    },
  },
  KIROVOHRAD_OBLAST: {
    uid: 15,
    title: 'Кіровоградська область',
    coordinates: {
      latitude: 48.3725,
      longitude: 31.7834,
    },
  },
  LUHANSK_OBLAST: {
    uid: 16,
    title: 'Луганська область',
    coordinates: {
      latitude: 49.2724,
      longitude: 38.915,
    },
  },
  MYKOLAIV_OBLAST: {
    uid: 17,
    title: 'Миколаївська область',
    coordinates: {
      latitude: 47.3886,
      longitude: 31.9442,
    },
  },
  ODESA_OBLAST: {
    uid: 18,
    title: 'Одеська область',
    coordinates: {
      latitude: 46.1147,
      longitude: 29.9567,
    },
  },
  POLTAVA_OBLAST: {
    uid: 19,
    title: 'Полтавська область',
    coordinates: {
      latitude: 49.8607,
      longitude: 33.7498,
    },
  },
  SUMY_OBLAST: {
    uid: 20,
    title: 'Сумська область',
    coordinates: {
      latitude: 50.7696,
      longitude: 34.3289,
    },
  },
  TERNOPIL_OBLAST: {
    uid: 21,
    title: 'Тернопільська область',
    coordinates: {
      latitude: 49.5667,
      longitude: 25.6,
    },
  },
  KHARKIV_OBLAST: {
    uid: 22,
    title: 'Харківська область',
    coordinates: {
      latitude: 49.8299,
      longitude: 36.3788,
    },
  },
  KHERSON_OBLAST: {
    uid: 23,
    title: 'Херсонська область',
    coordinates: {
      latitude: 46.5421,
      longitude: 33.4079,
    },
  },
  CHERKASY_OBLAST: {
    uid: 24,
    title: 'Черкаська область',
    coordinates: {
      latitude: 49.146,
      longitude: 31.2271,
    },
  },
  CHERNIHIV_OBLAST: {
    uid: 25,
    title: 'Чернігівська область',
    coordinates: {
      latitude: 51.2725,
      longitude: 31.7417,
    },
  },
  CHERNIVTSI_OBLAST: {
    uid: 26,
    title: 'Чернівецька область',
    coordinates: {
      latitude: 48.381,
      longitude: 26.1081,
    },
  },
  LVIV_OBLAST: {
    uid: 27,
    title: 'Львівська область',
    coordinates: {
      latitude: 49.6512,
      longitude: 23.8266,
    },
  },
  DONETSK_OBLAST: {
    uid: 28,
    title: 'Донецька область',
    coordinates: {
      latitude: 47.9212,
      longitude: 37.7809,
    },
  },
  CRIMEA: {
    uid: 29,
    title: 'Автономна Республіка Крим',
    coordinates: {
      latitude: 45.1813,
      longitude: 34.7915,
    },
  },
  SEVASTOPOL: {
    uid: 30,
    title: 'м. Севастополь',
    coordinates: {
      latitude: 44.605,
      longitude: 33.5225,
    },
  },
  KYIV_CITY: {
    uid: 31,
    title: 'м. Київ',
    coordinates: {
      latitude: 50.45,
      longitude: 30.5233,
    },
  },
} as const satisfies Record<string, AlertRegion>;
