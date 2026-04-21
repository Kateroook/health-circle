export interface AlertRegion {
  uid: number;
  title: string;
}

export const AlertRegions: Record<string, AlertRegion> = {
  KHMELNYTSKYI_OBLAST: { uid: 3, title: 'Хмельницька область' },
  VINNYTSIA_OBLAST: { uid: 4, title: 'Вінницька область' },
  RIVNE_OBLAST: { uid: 5, title: 'Рівненська область' },
  VOLYN_OBLAST: { uid: 8, title: 'Волинська область' },
  DNIPRO_OBLAST: { uid: 9, title: 'Дніпропетровська область' },
  ZHYTOMYR_OBLAST: { uid: 10, title: 'Житомирська область' },
  ZAKARPATTIA_OBLAST: { uid: 11, title: 'Закарпатська область' },
  ZAPORIZHZHIA_OBLAST: { uid: 12, title: 'Запорізька область' },
  IVANO_FRANKIVSK_OBLAST: { uid: 13, title: 'Івано-Франківська область' },
  KYIV_OBLAST: { uid: 14, title: 'Київська область' },
  KIROVOHRAD_OBLAST: { uid: 15, title: 'Кіровоградська область' },
  LUHANSK_OBLAST: { uid: 16, title: 'Луганська область' },
  MYKOLAIV_OBLAST: { uid: 17, title: 'Миколаївська область' },
  ODESA_OBLAST: { uid: 18, title: 'Одеська область' },
  POLTAVA_OBLAST: { uid: 19, title: 'Полтавська область' },
  SUMY_OBLAST: { uid: 20, title: 'Сумська область' },
  TERNOPIL_OBLAST: { uid: 21, title: 'Тернопільська область' },
  KHARKIV_OBLAST: { uid: 22, title: 'Харківська область' },
  KHERSON_OBLAST: { uid: 23, title: 'Херсонська область' },
  CHERKASY_OBLAST: { uid: 24, title: 'Черкаська область' },
  CHERNIHIV_OBLAST: { uid: 25, title: 'Чернігівська область' },
  CHERNIVTSI_OBLAST: { uid: 26, title: 'Чернівецька область' },
  LVIV_OBLAST: { uid: 27, title: 'Львівська область' },
  DONETSK_OBLAST: { uid: 28, title: 'Донецька область' },
  CRIMEA: { uid: 29, title: 'Автономна Республіка Крим' },
  SEVASTOPOL: { uid: 30, title: 'м. Севастополь' },
  KYIV_CITY: { uid: 31, title: 'м. Київ' },
} as const;
