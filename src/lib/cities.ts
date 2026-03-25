export interface City {
  name: string;
  lat: number;
  lng: number;
  region?: string;
}

export const cities: City[] = [
  { name: "Київ", lat: 50.4501, lng: 30.5234, region: "Київська" },
  { name: "Харків", lat: 49.9935, lng: 36.2304, region: "Харківська" },
  { name: "Одеса", lat: 46.4825, lng: 30.7233, region: "Одеська" },
  { name: "Дніпро", lat: 48.4647, lng: 35.0462, region: "Дніпропетровська" },
  { name: "Запоріжжя", lat: 47.8388, lng: 35.1396, region: "Запорізька" },
  { name: "Львів", lat: 49.8397, lng: 24.0297, region: "Львівська" },
  { name: "Кривий Ріг", lat: 47.9101, lng: 33.3919, region: "Дніпропетровська" },
  { name: "Миколаїв", lat: 46.975, lng: 31.9946, region: "Миколаївська" },
  { name: "Первомайськ", lat: 48.0442, lng: 30.8567, region: "Миколаївська" },
  { name: "Вінниця", lat: 49.2331, lng: 28.4682, region: "Вінницька" },
  { name: "Полтава", lat: 49.5883, lng: 34.5514, region: "Полтавська" },
  { name: "Чернігів", lat: 51.4982, lng: 31.2893, region: "Чернігівська" },
  { name: "Черкаси", lat: 49.4444, lng: 32.0598, region: "Черкаська" },
  { name: "Хмельницький", lat: 49.4229, lng: 26.9871, region: "Хмельницька" },
  { name: "Чернівці", lat: 48.2921, lng: 25.9358, region: "Чернівецька" },
  { name: "Житомир", lat: 50.2547, lng: 28.6587, region: "Житомирська" },
  { name: "Суми", lat: 50.9077, lng: 34.7981, region: "Сумська" },
  { name: "Рівне", lat: 50.6199, lng: 26.2516, region: "Рівненська" },
  { name: "Івано-Франківськ", lat: 48.9226, lng: 24.7111, region: "Івано-Франківська" },
  { name: "Тернопіль", lat: 49.5535, lng: 25.5948, region: "Тернопільська" },
  { name: "Луцьк", lat: 50.7472, lng: 25.3254, region: "Волинська" },
  { name: "Ужгород", lat: 48.6208, lng: 22.2879, region: "Закарпатська" },
  { name: "Кропивницький", lat: 48.5079, lng: 32.2623, region: "Кіровоградська" },
  { name: "Херсон", lat: 46.6354, lng: 32.6169, region: "Херсонська" },
  { name: "Біла Церква", lat: 49.7988, lng: 30.1131, region: "Київська" },
  { name: "Кременчук", lat: 49.0656, lng: 33.4252, region: "Полтавська" },
  { name: "Маріуполь", lat: 47.0958, lng: 37.5497, region: "Донецька" },
  { name: "Краматорськ", lat: 48.7376, lng: 37.5876, region: "Донецька" },
  { name: "Мелітополь", lat: 46.8489, lng: 35.3675, region: "Запорізька" },
  { name: "Нікополь", lat: 47.5723, lng: 34.3962, region: "Дніпропетровська" },
  { name: "Бердянськ", lat: 46.7565, lng: 36.7984, region: "Запорізька" },
  { name: "Павлоград", lat: 48.5332, lng: 35.8708, region: "Дніпропетровська" },
  { name: "Конотоп", lat: 51.2398, lng: 33.2038, region: "Сумська" },
  { name: "Умань", lat: 48.7486, lng: 30.2215, region: "Черкаська" },
  { name: "Шостка", lat: 51.8632, lng: 33.4768, region: "Сумська" },
  { name: "Коростень", lat: 50.9519, lng: 28.6373, region: "Житомирська" },
  { name: "Бровари", lat: 50.5112, lng: 30.7903, region: "Київська" },
  { name: "Бориспіль", lat: 50.3498, lng: 30.9561, region: "Київська" },
  { name: "Сміла", lat: 49.2299, lng: 31.8681, region: "Черкаська" },
  { name: "Олександрія", lat: 48.6693, lng: 33.1122, region: "Кіровоградська" },
  { name: "Козятин", lat: 49.7145, lng: 28.8356, region: "Вінницька" },
  { name: "Новоград-Волинський", lat: 50.5936, lng: 27.6258, region: "Житомирська" },
  { name: "Нововолинськ", lat: 50.7293, lng: 24.1707, region: "Волинська" },
  { name: "Коломия", lat: 48.5283, lng: 25.0383, region: "Івано-Франківська" },
  { name: "Мукачево", lat: 48.4414, lng: 22.7178, region: "Закарпатська" },
  { name: "Стрий", lat: 49.2615, lng: 23.8499, region: "Львівська" },
  { name: "Дрогобич", lat: 49.3486, lng: 23.5064, region: "Львівська" },
  { name: "Червоноград", lat: 50.3886, lng: 24.2261, region: "Львівська" },
  { name: "Южноукраїнськ", lat: 47.8248, lng: 31.1739, region: "Миколаївська" },
  { name: "Вознесенськ", lat: 47.5588, lng: 31.3275, region: "Миколаївська" },
  { name: "Очаків", lat: 46.6169, lng: 31.5461, region: "Миколаївська" },
];

const ROAD_COEFFICIENT = 1.3;

function toRad(deg: number) {
  return (deg * Math.PI) / 180;
}

function haversine(a: City, b: City): number {
  const R = 6371;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const sinLat = Math.sin(dLat / 2);
  const sinLng = Math.sin(dLng / 2);
  const h = sinLat * sinLat + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * sinLng * sinLng;
  return R * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

export function calculateDistance(cityA: string, cityB: string): number | null {
  const a = cities.find((c) => c.name === cityA);
  const b = cities.find((c) => c.name === cityB);
  if (!a || !b) return null;
  return Math.round(haversine(a, b) * ROAD_COEFFICIENT);
}

export function searchCities(query: string): City[] {
  if (!query || query.length < 1) return [];
  const q = query.toLowerCase();
  return cities
    .filter((c) => c.name.toLowerCase().startsWith(q))
    .slice(0, 8);
}
