import type { Airport } from '@/lib/types';

export const AIRPORTS: Airport[] = [
  { code: 'BOM', name: 'Chhatrapati Shivaji Maharaj Intl', city: 'Mumbai', country: 'India', lat: 19.0896, lng: 72.8656, tz: 'Asia/Kolkata' },
  { code: 'DEL', name: 'Indira Gandhi Intl', city: 'Delhi', country: 'India', lat: 28.5562, lng: 77.1, tz: 'Asia/Kolkata' },
  { code: 'BLR', name: 'Kempegowda Intl', city: 'Bengaluru', country: 'India', lat: 13.1986, lng: 77.7066, tz: 'Asia/Kolkata' },
  { code: 'MAA', name: 'Chennai Intl', city: 'Chennai', country: 'India', lat: 12.9941, lng: 80.1709, tz: 'Asia/Kolkata' },
  { code: 'HYD', name: 'Rajiv Gandhi Intl', city: 'Hyderabad', country: 'India', lat: 17.2403, lng: 78.4294, tz: 'Asia/Kolkata' },
  { code: 'GOI', name: 'Dabolim / Manohar Intl', city: 'Goa', country: 'India', lat: 15.3808, lng: 73.8314, tz: 'Asia/Kolkata' },
  { code: 'NRT', name: 'Narita Intl', city: 'Tokyo', country: 'Japan', lat: 35.772, lng: 140.3929, tz: 'Asia/Tokyo' },
  { code: 'HND', name: 'Haneda Intl', city: 'Tokyo', country: 'Japan', lat: 35.5494, lng: 139.7798, tz: 'Asia/Tokyo' },
  { code: 'KIX', name: 'Kansai Intl', city: 'Osaka', country: 'Japan', lat: 34.4342, lng: 135.2325, tz: 'Asia/Tokyo' },
  { code: 'DPS', name: 'Ngurah Rai Intl', city: 'Bali', country: 'Indonesia', lat: -8.7482, lng: 115.1672, tz: 'Asia/Makassar' },
  { code: 'HAN', name: 'Noi Bai Intl', city: 'Hanoi', country: 'Vietnam', lat: 21.2212, lng: 105.8072, tz: 'Asia/Ho_Chi_Minh' },
  { code: 'DAD', name: 'Da Nang Intl', city: 'Da Nang', country: 'Vietnam', lat: 16.0439, lng: 108.1994, tz: 'Asia/Ho_Chi_Minh' },
  { code: 'BKK', name: 'Suvarnabhumi', city: 'Bangkok', country: 'Thailand', lat: 13.69, lng: 100.7501, tz: 'Asia/Bangkok' },
  { code: 'SIN', name: 'Changi', city: 'Singapore', country: 'Singapore', lat: 1.3644, lng: 103.9915, tz: 'Asia/Singapore' },
  { code: 'CDG', name: 'Charles de Gaulle', city: 'Paris', country: 'France', lat: 49.0097, lng: 2.5479, tz: 'Europe/Paris' },
  { code: 'KEF', name: 'Keflavík Intl', city: 'Reykjavík', country: 'Iceland', lat: 63.985, lng: -22.6056, tz: 'Atlantic/Reykjavik' },
  { code: 'ZRH', name: 'Zurich', city: 'Zurich', country: 'Switzerland', lat: 47.4647, lng: 8.5492, tz: 'Europe/Zurich' },
  { code: 'DXB', name: 'Dubai Intl', city: 'Dubai', country: 'UAE', lat: 25.2532, lng: 55.3657, tz: 'Asia/Dubai' },
  { code: 'JAI', name: 'Jaipur Intl', city: 'Jaipur', country: 'India', lat: 26.8242, lng: 75.8122, tz: 'Asia/Kolkata' },
  { code: 'UDR', name: 'Maharana Pratap', city: 'Udaipur', country: 'India', lat: 24.6177, lng: 73.8961, tz: 'Asia/Kolkata' },
  { code: 'COK', name: 'Cochin Intl', city: 'Kochi', country: 'India', lat: 10.152, lng: 76.4019, tz: 'Asia/Kolkata' },
  { code: 'JFK', name: 'John F. Kennedy Intl', city: 'New York', country: 'USA', lat: 40.6413, lng: -73.7781, tz: 'America/New_York' },
  { code: 'SFO', name: 'San Francisco Intl', city: 'San Francisco', country: 'USA', lat: 37.6213, lng: -122.379, tz: 'America/Los_Angeles' },
  { code: 'LHR', name: 'Heathrow', city: 'London', country: 'UK', lat: 51.47, lng: -0.4543, tz: 'Europe/London' },
  { code: 'IST', name: 'Istanbul', city: 'Istanbul', country: 'Türkiye', lat: 41.2753, lng: 28.7519, tz: 'Europe/Istanbul' },
  { code: 'DOH', name: 'Hamad Intl', city: 'Doha', country: 'Qatar', lat: 25.2731, lng: 51.6081, tz: 'Asia/Qatar' },
  { code: 'AUH', name: 'Zayed Intl', city: 'Abu Dhabi', country: 'UAE', lat: 24.433, lng: 54.6511, tz: 'Asia/Dubai' },
  { code: 'CMB', name: 'Bandaranaike Intl', city: 'Colombo', country: 'Sri Lanka', lat: 7.1808, lng: 79.8842, tz: 'Asia/Colombo' },
  { code: 'KTM', name: 'Tribhuvan Intl', city: 'Kathmandu', country: 'Nepal', lat: 27.6966, lng: 85.3591, tz: 'Asia/Kathmandu' },
  { code: 'MLE', name: 'Velana Intl', city: 'Malé', country: 'Maldives', lat: 4.1918, lng: 73.5291, tz: 'Indian/Maldives' },
  { code: 'ICN', name: 'Incheon Intl', city: 'Seoul', country: 'South Korea', lat: 37.4602, lng: 126.4407, tz: 'Asia/Seoul' },
  { code: 'HKG', name: 'Hong Kong Intl', city: 'Hong Kong', country: 'Hong Kong', lat: 22.308, lng: 113.9185, tz: 'Asia/Hong_Kong' },
  { code: 'SYD', name: 'Kingsford Smith', city: 'Sydney', country: 'Australia', lat: -33.9399, lng: 151.1753, tz: 'Australia/Sydney' },
  { code: 'AMS', name: 'Schiphol', city: 'Amsterdam', country: 'Netherlands', lat: 52.3105, lng: 4.7683, tz: 'Europe/Amsterdam' },
  { code: 'FCO', name: 'Fiumicino', city: 'Rome', country: 'Italy', lat: 41.8003, lng: 12.2389, tz: 'Europe/Rome' },
  { code: 'BCN', name: 'El Prat', city: 'Barcelona', country: 'Spain', lat: 41.2974, lng: 2.0833, tz: 'Europe/Madrid' },
];

export const INDIA_ORIGINS = ['BOM', 'DEL', 'BLR', 'MAA', 'HYD', 'GOI'];

export const airportByCode = (code: string) => AIRPORTS.find((a) => a.code === code);

export function nearestAirport(lat: number, lng: number): Airport {
  let best = AIRPORTS[0];
  let bestD = Infinity;
  for (const a of AIRPORTS) {
    const d = haversine(lat, lng, a.lat, a.lng);
    if (d < bestD) {
      bestD = d;
      best = a;
    }
  }
  return best;
}

export function haversine(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return Math.round(2 * R * Math.asin(Math.sqrt(a)));
}
