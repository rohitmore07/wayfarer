import type { Hotel, HotelClass } from '@/lib/types';
import { HOTEL_PHOTOS, unsplash } from './unsplash';

/**
 * Curated, fictional-but-plausible demo inventory. Prices in INR per night for
 * a standard double room, benchmarked to typical seasonal rates. Swap
 * `lib/providers/hotels.ts` for a live provider (Booking/Expedia/Amadeus) when
 * credentials are available — the shape of the data is what the UI consumes.
 */

type Seed = {
  n: string;
  a: string;
  st: number;
  r: number;
  rc: number;
  p: number;
  pt: Hotel['propertyType'];
  t: HotelClass;
  am: string[];
  d: string;
  lat: number;
  lng: number;
  near: [string, number][];
};

const S: Record<string, Seed[]> = {
  tokyo: [
    { n: 'Ginza Lantern Hotel', a: 'Ginza', st: 4, r: 8.9, rc: 2140, p: 14800, pt: 'hotel', t: 'comfort', am: ['Free Wi-Fi', 'Breakfast', 'Air conditioning', 'Gym', 'Bar', '24h front desk'], d: 'Sleek business hotel two blocks from Ginza’s main crossing, with compact but brilliantly planned rooms and a top-floor lounge.', lat: 35.6717, lng: 139.765, near: [['Ginza Six', 0.3], ['Tsukiji Market', 1.4], ['Tokyo Station', 1.1]] },
    { n: 'Asakusa Kumo Ryokan', a: 'Asakusa', st: 3, r: 9.1, rc: 860, p: 9600, pt: 'ryokan', t: 'budget', am: ['Free Wi-Fi', 'Breakfast', 'Onsen bath', 'Tatami rooms', 'Luggage storage'], d: 'Family-run ryokan with tatami rooms, yukata and a cedar bath — a 6-minute walk to Sensō-ji through lantern streets.', lat: 35.7139, lng: 139.7924, near: [['Sensō-ji', 0.5], ['Asakusa Station', 0.4], ['Skytree', 1.8]] },
    { n: 'Shibuya Sky Terrace', a: 'Shibuya', st: 5, r: 9.3, rc: 1480, p: 29500, pt: 'hotel', t: 'luxury', am: ['Free Wi-Fi', 'Breakfast', 'Rooftop bar', 'Spa', 'Gym', 'City view', 'Concierge'], d: 'Design hotel above the scramble with floor-to-ceiling views, an excellent cocktail bar and a calm, minimal aesthetic.', lat: 35.6581, lng: 139.7017, near: [['Shibuya Crossing', 0.2], ['Meiji Jingū', 1.6], ['Harajuku', 1.2]] },
    { n: 'Shinjuku Cedar House', a: 'Shinjuku', st: 3, r: 8.5, rc: 3260, p: 7800, pt: 'hotel', t: 'budget', am: ['Free Wi-Fi', 'Air conditioning', 'Laundry', '24h front desk'], d: 'Reliable, spotless and steps from Shinjuku Station — the practical choice if you plan to be out from morning to midnight.', lat: 35.6924, lng: 139.6995, near: [['Shinjuku Station', 0.3], ['Golden Gai', 0.5], ['Shinjuku Gyoen', 0.9]] },
    { n: 'Yanaka Machiya Stay', a: 'Yanaka', st: 4, r: 9.4, rc: 420, p: 16500, pt: 'apartment', t: 'comfort', am: ['Free Wi-Fi', 'Kitchen', 'Washer', 'Garden', 'Self check-in'], d: 'A restored wooden townhouse in Tokyo’s quietest old neighbourhood — tatami, a tiny courtyard and excellent coffee nearby.', lat: 35.7276, lng: 139.7669, near: [['Yanaka Ginza', 0.3], ['Ueno Park', 1.0], ['Nezu Shrine', 0.8]] },
    { n: 'Odaiba Bay Resort', a: 'Odaiba', st: 4, r: 8.6, rc: 1970, p: 13200, pt: 'resort', t: 'comfort', am: ['Free Wi-Fi', 'Pool', 'Breakfast', 'Bay view', 'Spa', 'Airport shuttle'], d: 'Waterfront resort with a pool and bay views — good for families, 20 minutes from central Tokyo on the Yurikamome.', lat: 35.6297, lng: 139.7741, near: [['teamLab Planets', 1.2], ['Rainbow Bridge', 0.9], ['Tsukiji', 3.4]] },
  ],
  kyoto: [
    { n: 'Gion Willow Ryokan', a: 'Gion', st: 4, r: 9.5, rc: 640, p: 21500, pt: 'ryokan', t: 'luxury', am: ['Breakfast', 'Kaiseki dinner', 'Onsen bath', 'Garden', 'Yukata', 'Free Wi-Fi'], d: 'A 12-room ryokan with a moss garden and private cypress bath, five minutes from the Shirakawa canal.', lat: 35.0021, lng: 135.7752, near: [['Gion', 0.2], ['Kiyomizu-dera', 1.1], ['Pontochō', 0.8]] },
    { n: 'Nishiki Central Hotel', a: 'Nakagyo', st: 3, r: 8.7, rc: 2410, p: 8900, pt: 'hotel', t: 'budget', am: ['Free Wi-Fi', 'Breakfast', 'Laundry', 'Air conditioning'], d: 'Simple, central and excellent value — you can walk to Nishiki Market, Pontochō and two subway lines.', lat: 35.0055, lng: 135.7661, near: [['Nishiki Market', 0.2], ['Kyoto Station', 2.1], ['Gion', 1.4]] },
    { n: 'Higashiyama Machiya Suites', a: 'Higashiyama', st: 4, r: 9.2, rc: 780, p: 17200, pt: 'apartment', t: 'comfort', am: ['Free Wi-Fi', 'Kitchen', 'Washer', 'Garden', 'Self check-in'], d: 'Restored townhouses with cedar baths and small courtyards, a short walk from Kiyomizu-dera’s stone lanes.', lat: 34.9968, lng: 135.7791, near: [['Kiyomizu-dera', 0.6], ['Sannenzaka', 0.3], ['Gion', 0.9]] },
    { n: 'Arashiyama River Retreat', a: 'Arashiyama', st: 4, r: 9.0, rc: 510, p: 15800, pt: 'resort', t: 'comfort', am: ['Breakfast', 'Onsen bath', 'River view', 'Bike hire', 'Free Wi-Fi'], d: 'Riverside retreat at the edge of the bamboo grove, with an open-air bath and bicycles to borrow.', lat: 35.0139, lng: 135.6778, near: [['Bamboo Grove', 0.4], ['Togetsukyō Bridge', 0.5], ['Tenryū-ji', 0.6]] },
    { n: 'Kyoto Station Vista', a: 'Shimogyo', st: 3, r: 8.4, rc: 4120, p: 7400, pt: 'hotel', t: 'budget', am: ['Free Wi-Fi', 'Laundry', '24h front desk', 'Luggage storage'], d: 'Practical base above the shinkansen platforms — ideal for day trips to Nara, Osaka and Himeji.', lat: 34.9858, lng: 135.7588, near: [['Kyoto Station', 0.1], ['Fushimi Inari', 2.4], ['Nishiki Market', 2.0]] },
    { n: 'Kamo River Glasshouse', a: 'Kamigyō', st: 5, r: 9.4, rc: 320, p: 38000, pt: 'hotel', t: 'luxury', am: ['Breakfast', 'Spa', 'River view', 'Bar', 'Concierge', 'Free Wi-Fi'], d: 'A minimalist 20-suite hotel overlooking the Kamo river, with a tea room and one of the city’s best breakfasts.', lat: 35.0139, lng: 135.7716, near: [['Kamo River', 0.05], ['Imperial Palace', 0.9], ['Pontochō', 1.2]] },
  ],
  osaka: [
    { n: 'Namba Neon Hotel', a: 'Namba', st: 3, r: 8.6, rc: 3810, p: 8200, pt: 'hotel', t: 'budget', am: ['Free Wi-Fi', 'Breakfast', 'Laundry', '24h front desk'], d: 'Two minutes from Dōtonbori’s signs, with compact rooms and a 24-hour desk — you are here for the food anyway.', lat: 34.6668, lng: 135.5012, near: [['Dōtonbori', 0.2], ['Namba Station', 0.3], ['Kuromon Market', 0.7]] },
    { n: 'Umeda Skyline Suites', a: 'Umeda', st: 4, r: 9.0, rc: 1240, p: 13600, pt: 'hotel', t: 'comfort', am: ['Free Wi-Fi', 'Breakfast', 'Gym', 'City view', 'Bar'], d: 'High-floor rooms with skyline views, directly connected to Osaka Station and the airport limousine stop.', lat: 34.7039, lng: 135.4951, near: [['Umeda Sky Building', 0.6], ['Osaka Station', 0.3], ['Grand Front', 0.2]] },
    { n: 'Shinsekai Retro Inn', a: 'Shinsekai', st: 2, r: 8.2, rc: 1580, p: 5200, pt: 'hotel', t: 'budget', am: ['Free Wi-Fi', 'Shared kitchen', 'Laundry'], d: 'A cheerful, slightly retro budget inn under Tsūtenkaku — the cheapest decent bed in central Osaka.', lat: 34.6527, lng: 135.5062, near: [['Tsūtenkaku', 0.2], ['Shinsekai', 0.1], ['Abeno Harukas', 1.4]] },
    { n: 'Nakanoshima River House', a: 'Nakanoshima', st: 5, r: 9.3, rc: 690, p: 24800, pt: 'hotel', t: 'luxury', am: ['Free Wi-Fi', 'Spa', 'Breakfast', 'River view', 'Bar', 'Concierge'], d: 'A quiet luxury address on the river island, walking distance to the art museum and the castle park.', lat: 34.6931, lng: 135.4937, near: [['National Museum of Art', 0.3], ['Osaka Castle', 1.6], ['Umeda', 1.2]] },
    { n: 'Tempozan Harbour Hotel', a: 'Tempozan', st: 4, r: 8.8, rc: 2210, p: 11800, pt: 'resort', t: 'comfort', am: ['Free Wi-Fi', 'Breakfast', 'Pool', 'Family rooms', 'Parking'], d: 'Family-friendly harbour hotel next to the aquarium and ferris wheel, with the largest rooms in the city.', lat: 34.6563, lng: 135.4312, near: [['Kaiyūkan Aquarium', 0.2], ['Ferris Wheel', 0.3], ['Universal Studios', 2.8]] },
  ],
  bali: [
    { n: 'Ubud Rice Terrace Villas', a: 'Ubud', st: 4, r: 9.4, rc: 1420, p: 9200, pt: 'villa', t: 'comfort', am: ['Pool', 'Breakfast', 'Free Wi-Fi', 'Yoga deck', 'Airport transfer'], d: 'Private-pool villas looking over the Tegallalang terraces, with breakfast brought to your deck each morning.', lat: -8.5069, lng: 115.2625, near: [['Ubud Market', 1.2], ['Monkey Forest', 1.6], ['Tegallalang', 9.4]] },
    { n: 'Seminyak Beach Club Resort', a: 'Seminyak', st: 5, r: 9.1, rc: 2980, p: 26500, pt: 'resort', t: 'luxury', am: ['Beachfront', 'Pool', 'Spa', 'Breakfast', 'Bar', 'Free Wi-Fi'], d: 'A polished beachfront resort with three pools, a sunset bar and a spa that actually deserves its price.', lat: -8.6913, lng: 115.1571, near: [['Seminyak Beach', 0.05], ['Petitenget Temple', 0.6], ['Eat Street', 0.9]] },
    { n: 'Canggu Surf Lodge', a: 'Canggu', st: 3, r: 8.8, rc: 890, p: 4800, pt: 'hotel', t: 'budget', am: ['Pool', 'Free Wi-Fi', 'Breakfast', 'Surf rental', 'Coworking'], d: 'Barefoot surf lodge with a pool, board rental and long-stay digital nomads who will tell you where to eat.', lat: -8.6551, lng: 115.1311, near: [['Batu Bolong Beach', 0.4], ['Echo Beach', 1.9], ['Canggu Shortcut', 0.8]] },
    { n: 'Uluwatu Cliff Villas', a: 'Uluwatu', st: 5, r: 9.5, rc: 620, p: 31000, pt: 'villa', t: 'luxury', am: ['Private pool', 'Cliff view', 'Breakfast', 'Spa', 'Butler'], d: 'Cliff-edge villas with infinity pools over the Indian Ocean. Book the sunset-facing units (2 and 5).', lat: -8.8145, lng: 115.0886, near: [['Uluwatu Temple', 2.4], ['Padang Padang', 3.1], ['Bingin Beach', 4.2]] },
    { n: 'Sanur Garden Bungalows', a: 'Sanur', st: 3, r: 8.6, rc: 1130, p: 5600, pt: 'resort', t: 'budget', am: ['Pool', 'Breakfast', 'Free Wi-Fi', 'Garden', 'Bike hire'], d: 'Quiet garden bungalows near Sanur’s calm beach and the fast boats to Nusa Penida.', lat: -8.6914, lng: 115.2625, near: [['Sanur Beach', 0.3], ['Sanur Harbour', 1.7], ['Denpasar', 6.2]] },
  ],
  hanoi: [
    { n: 'Old Quarter Lantern House', a: 'Hoan Kiem', st: 3, r: 9.0, rc: 1640, p: 3600, pt: 'hotel', t: 'budget', am: ['Free Wi-Fi', 'Breakfast', 'Air conditioning', 'Tour desk'], d: 'A narrow, friendly hotel in the middle of the Old Quarter with balconies over the street-food action.', lat: 21.0341, lng: 105.8499, near: [['Hoan Kiem Lake', 0.5], ['Dong Xuan Market', 0.7], ['Ta Hien Street', 0.3]] },
    { n: 'West Lake Serenity Hotel', a: 'Tay Ho', st: 4, r: 8.9, rc: 980, p: 6200, pt: 'hotel', t: 'comfort', am: ['Free Wi-Fi', 'Pool', 'Breakfast', 'Spa', 'Lake view'], d: 'A calm lakeside hotel in expat Tay Ho, with a pool and a rooftop bar — a quiet retreat from the Old Quarter.', lat: 21.0542, lng: 105.8231, near: [['West Lake', 0.1], ['Tran Quoc Pagoda', 0.9], ['Old Quarter', 3.4]] },
    { n: 'Imperial Citadel Hotel', a: 'Ba Dinh', st: 4, r: 8.7, rc: 1320, p: 5400, pt: 'hotel', t: 'comfort', am: ['Free Wi-Fi', 'Breakfast', 'Gym', 'Restaurant'], d: 'Business-class comfort beside the mausoleum and Museum of Fine Arts, with generous breakfast buffets.', lat: 21.0352, lng: 105.8352, near: [['Mausoleum', 0.6], ['Temple of Literature', 1.2], ['Old Quarter', 1.8]] },
    { n: 'Sofitel-style Metropole annexe (demo)', a: 'Hoan Kiem', st: 5, r: 9.2, rc: 2100, p: 13500, pt: 'hotel', t: 'luxury', am: ['Free Wi-Fi', 'Spa', 'Pool', 'Breakfast', 'Bar', 'Concierge'], d: 'Colonial-era grandeur with a courtyard pool and a jazz bar that has hosted guests since 1901.', lat: 21.0245, lng: 105.8572, near: [['Hoan Kiem Lake', 0.3], ['Opera House', 0.4], ['Old Quarter', 0.9]] },
  ],
  'hoi-an': [
    { n: 'Anantara-style Riverside Hoi An (demo)', a: 'Old Town', st: 5, r: 9.4, rc: 1490, p: 11500, pt: 'resort', t: 'luxury', am: ['Pool', 'Spa', 'Breakfast', 'River view', 'Free Wi-Fi', 'Bike hire'], d: 'Lush riverside gardens, a long pool and lantern-light dinners — a five-minute walk to the old town.', lat: 15.8796, lng: 108.3332, near: [['Ancient Town', 0.6], ['Night Market', 0.8], ['An Bang Beach', 4.2]] },
    { n: 'Lantern Lane Villa', a: 'Old Town', st: 3, r: 9.1, rc: 760, p: 3900, pt: 'villa', t: 'budget', am: ['Free Wi-Fi', 'Breakfast', 'Bike hire', 'Pool'], d: 'A small family villa with a courtyard pool inside the old-town lanes, with genuinely warm hosts.', lat: 15.8772, lng: 108.3302, near: [['Japanese Bridge', 0.3], ['Night Market', 0.5], ['An Bang Beach', 4.4]] },
    { n: 'An Bang Beach Cottages', a: 'An Bang', st: 4, r: 8.9, rc: 540, p: 6800, pt: 'resort', t: 'comfort', am: ['Beachfront', 'Pool', 'Breakfast', 'Free Wi-Fi', 'Restaurant'], d: 'Beachfront cottages with hammocks and a pool — the best choice if you would rather swim than sightsee.', lat: 15.9121, lng: 108.3369, near: [['An Bang Beach', 0.05], ['Old Town', 4.6], ['Cua Dai', 2.1]] },
    { n: 'Tra Que Garden Stay', a: 'Trà Quế', st: 3, r: 9.0, rc: 410, p: 3200, pt: 'apartment', t: 'budget', am: ['Free Wi-Fi', 'Kitchen', 'Garden', 'Bike hire'], d: 'Garden bungalows between herb farms and rice paddies, with bicycles included and farmers as neighbours.', lat: 15.8929, lng: 108.3469, near: [['Tra Que Village', 0.2], ['Old Town', 2.4], ['An Bang Beach', 2.9]] },
  ],
  bangkok: [
    { n: 'Riverside Heritage Bangkok', a: 'Riverside', st: 5, r: 9.2, rc: 3410, p: 16800, pt: 'hotel', t: 'luxury', am: ['Pool', 'Spa', 'Breakfast', 'River view', 'Bar', 'Shuttle boat'], d: 'Colonial-style riverside hotel with a free shuttle boat to the skytrain and the best breakfast on the river.', lat: 13.7222, lng: 100.5152, near: [['Chao Phraya', 0.05], ['Wat Pho', 4.2], ['ICONSIAM', 1.4]] },
    { n: 'Sukhumvit Social Hotel', a: 'Sukhumvit', st: 4, r: 8.8, rc: 4210, p: 6200, pt: 'hotel', t: 'comfort', am: ['Pool', 'Free Wi-Fi', 'Gym', 'Breakfast', 'Rooftop bar'], d: 'A social mid-range hotel with a rooftop pool, a two-minute walk from the BTS — the best value in the city.', lat: 13.7372, lng: 100.5601, near: [['BTS Asok', 0.2], ['Terminal 21', 0.3], ['Benjasiri Park', 0.6]] },
    { n: 'Khaosan Backpacker Loft', a: 'Khaosan', st: 2, r: 8.1, rc: 2870, p: 1900, pt: 'hostel', t: 'budget', am: ['Free Wi-Fi', 'Shared kitchen', 'Rooftop', 'Lockers'], d: 'Private double rooms at dorm prices, a rooftop and a five-minute walk to Wat Pho’s temples and street food.', lat: 13.7585, lng: 100.497, near: [['Khaosan Road', 0.1], ['Grand Palace', 2.2], ['Wat Pho', 2.4]] },
    { n: 'Silom Sky Suites', a: 'Silom', st: 4, r: 8.7, rc: 1980, p: 8200, pt: 'hotel', t: 'comfort', am: ['Pool', 'Free Wi-Fi', 'Breakfast', 'Spa', 'Airport transfer'], d: 'Modern tower between two skytrain stations and two night markets, with a pool that stays cool at noon.', lat: 13.7286, lng: 100.5296, near: [['Lumphini Park', 0.6], ['Patpong', 0.5], ['Sala Daeng BTS', 0.3]] },
  ],
  singapore: [
    { n: 'Marina Quay Glasshouse', a: 'Marina Bay', st: 5, r: 9.3, rc: 2680, p: 26500, pt: 'hotel', t: 'luxury', am: ['Pool', 'Spa', 'Breakfast', 'City view', 'Bar', 'Gym'], d: 'Infinity pool on the 21st floor and a direct view of the Supertree light show from the bar.', lat: 1.2847, lng: 103.8564, near: [['Gardens by the Bay', 0.8], ['Marina Bay Sands', 0.6], ['ArtScience Museum', 0.7]] },
    { n: 'Chinatown Shophouse Hotel', a: 'Chinatown', st: 4, r: 9.0, rc: 1740, p: 12800, pt: 'hotel', t: 'comfort', am: ['Free Wi-Fi', 'Breakfast', 'Rooftop', 'Restaurant'], d: 'A row of restored shophouses with plunge-pool roofs, walkable to Maxwell Food Centre and the MRT.', lat: 1.2822, lng: 103.8441, near: [['Maxwell Food Centre', 0.2], ['Buddha Tooth Temple', 0.4], ['Chinatown MRT', 0.3]] },
    { n: 'Little India Garden Inn', a: 'Little India', st: 3, r: 8.5, rc: 1290, p: 7600, pt: 'hotel', t: 'budget', am: ['Free Wi-Fi', 'Breakfast', 'Laundry', 'Air conditioning'], d: 'Colourful, clean and inexpensive, with roti canai downstairs and the MRT two minutes away.', lat: 1.3066, lng: 103.8515, near: [['Mustafa Centre', 0.4], ['Sri Veeramakaliamman', 0.5], ['Little India MRT', 0.2]] },
    { n: 'Sentosa Beach Resort', a: 'Sentosa', st: 4, r: 8.9, rc: 3110, p: 19500, pt: 'resort', t: 'comfort', am: ['Beachfront', 'Pool', 'Breakfast', 'Kids club', 'Free Wi-Fi'], d: 'Family beach resort with waterslides and a kids’ club, 15 minutes from the city by cable car.', lat: 1.2491, lng: 103.8238, near: [['Siloso Beach', 0.1], ['Skyline Luge', 0.5], ['Universal Studios', 1.1]] },
  ],
  paris: [
    { n: 'Rue Cler Boutique Hôtel', a: '7th arr.', st: 4, r: 9.1, rc: 1520, p: 17800, pt: 'hotel', t: 'comfort', am: ['Free Wi-Fi', 'Breakfast', 'Bar', 'Air conditioning', 'Concierge'], d: 'A 24-room boutique hotel off a market street, with parquet floors and a five-minute walk to the Eiffel Tower.', lat: 48.8558, lng: 2.3053, near: [['Eiffel Tower', 0.9], ['Rue Cler market', 0.1], ['Invalides', 1.0]] },
    { n: 'Le Marais Atelier', a: '3rd arr.', st: 4, r: 8.9, rc: 1080, p: 15600, pt: 'apartment', t: 'comfort', am: ['Free Wi-Fi', 'Kitchen', 'Washer', 'Self check-in'], d: 'Designer apartments in a 17th-century building — space, a kitchen and the best falafel in Paris downstairs.', lat: 48.8586, lng: 2.3606, near: [['Rue des Rosiers', 0.2], ['Centre Pompidou', 0.8], ['Notre-Dame', 1.1]] },
    { n: 'Montmartre Artist’s Nest', a: '18th arr.', st: 3, r: 8.6, rc: 960, p: 9800, pt: 'hotel', t: 'budget', am: ['Free Wi-Fi', 'Breakfast', 'Air conditioning'], d: 'A creaky, charming small hotel on a Montmartre side street with a view of Sacré-Cœur from two rooms.', lat: 48.8861, lng: 2.3392, near: [['Sacré-Cœur', 0.4], ['Place du Tertre', 0.3], ['Abbesses metro', 0.2]] },
    { n: 'Palais Royal Grand (demo)', a: '1st arr.', st: 5, r: 9.4, rc: 2240, p: 52000, pt: 'hotel', t: 'luxury', am: ['Spa', 'Pool', 'Breakfast', 'Bar', 'Concierge', 'Free Wi-Fi'], d: 'Palace-level service near the Louvre, with a Michelin kitchen, a marble pool and absurdly good bedding.', lat: 48.8639, lng: 2.3372, near: [['Louvre', 0.4], ['Palais Royal garden', 0.1], ['Tuileries', 0.4]] },
  ],
  reykjavik: [
    { n: 'Laugavegur Design Hotel', a: 'Downtown', st: 4, r: 9.0, rc: 1180, p: 19800, pt: 'hotel', t: 'comfort', am: ['Free Wi-Fi', 'Breakfast', 'Bar', 'Sauna'], d: 'Scandi-minimal rooms on the main shopping street, with a good bar and aurora wake-up calls.', lat: 64.1443, lng: -21.9256, near: [['Hallgrímskirkja', 0.5], ['Old Harbour', 1.0], ['Harpa', 0.8]] },
    { n: 'Harbour Loft Apartments', a: 'Old Harbour', st: 3, r: 8.8, rc: 640, p: 15900, pt: 'apartment', t: 'comfort', am: ['Free Wi-Fi', 'Kitchen', 'Washer', 'Self check-in'], d: 'Converted harbour lofts with full kitchens — the sensible option for a self-drive Iceland trip.', lat: 64.1509, lng: -21.9412, near: [['Whale watching', 0.2], ['Downtown', 0.9], ['Maritime Museum', 0.3]] },
    { n: 'Aurora Guesthouse', a: 'Hlemmur', st: 2, r: 8.4, rc: 910, p: 11200, pt: 'hostel', t: 'budget', am: ['Free Wi-Fi', 'Shared kitchen', 'Breakfast', 'Laundry'], d: 'Clean private rooms with shared kitchens — Iceland’s prices make this feel like a bargain.', lat: 64.143, lng: -21.9162, near: [['Laugavegur', 0.2], ['BSÍ bus terminal', 1.2], ['Sun Voyager', 1.4]] },
    { n: 'Blue Lagoon Retreat (demo)', a: 'Grindavík', st: 5, r: 9.5, rc: 720, p: 62000, pt: 'resort', t: 'luxury', am: ['Spa', 'Private lagoon', 'Breakfast', 'Restaurant', 'Free Wi-Fi'], d: 'Suites with private lagoon access and a Michelin-starred kitchen — the splurge option, 45 min from KEF.', lat: 63.8799, lng: -22.4498, near: [['Blue Lagoon', 0.05], ['Grindavík', 4.6], ['Keflavík Airport', 22]] },
  ],
  interlaken: [
    { n: 'Aare Riverside Lodge', a: 'Interlaken West', st: 4, r: 9.1, rc: 980, p: 22500, pt: 'hotel', t: 'comfort', am: ['Free Wi-Fi', 'Breakfast', 'Sauna', 'Mountain view', 'Bike hire'], d: 'Wood-and-glass lodge on the Aare with Matterhorn-facing balconies and a very good breakfast buffet.', lat: 46.685, lng: 7.8564, near: [['Interlaken West', 0.4], ['Harder Kulm', 0.9], ['Höheweg', 0.2]] },
    { n: 'Brienz Lake Chalet', a: 'Brienz', st: 3, r: 8.9, rc: 420, p: 17800, pt: 'villa', t: 'comfort', am: ['Free Wi-Fi', 'Kitchen', 'Lake view', 'Parking', 'Washer'], d: 'A traditional wooden chalet above the turquoise lake, with a terrace and a wood stove for cool evenings.', lat: 46.7244, lng: 8.0384, near: [['Lake Brienz', 0.6], ['Giessbach Falls', 2.4], ['Interlaken', 8.9]] },
    { n: 'Valley Hostel Interlaken', a: 'Interlaken Ost', st: 2, r: 8.6, rc: 2140, p: 9200, pt: 'hostel', t: 'budget', am: ['Free Wi-Fi', 'Shared kitchen', 'Breakfast', 'Luggage storage'], d: 'The classic backpacker base: private doubles, a big kitchen and a garden with mountain views.', lat: 46.6908, lng: 7.869, near: [['Interlaken Ost', 0.3], ['Harder Kulm', 1.2], ['Lake Thun', 1.6]] },
    { n: 'Victoria Grand Interlaken (demo)', a: 'Höheweg', st: 5, r: 9.4, rc: 1560, p: 46000, pt: 'hotel', t: 'luxury', am: ['Spa', 'Pool', 'Breakfast', 'Mountain view', 'Bar', 'Concierge'], d: 'Belle-Époque grande dame on the Höheweg with Jungfrau views, a spa and a terrace for afternoon tea.', lat: 46.6866, lng: 7.8622, near: [['Höheweg', 0.05], ['Harder Kulm', 0.7], ['Interlaken West', 0.6]] },
  ],
  dubai: [
    { n: 'Downtown Burj View Hotel', a: 'Downtown', st: 4, r: 8.9, rc: 3420, p: 14500, pt: 'hotel', t: 'comfort', am: ['Pool', 'Free Wi-Fi', 'Breakfast', 'Gym', 'Burj view'], d: 'Burj Khalifa views from the pool deck and a 10-minute walk to Dubai Mall — the best-value Downtown address.', lat: 25.1928, lng: 55.2766, near: [['Burj Khalifa', 0.5], ['Dubai Mall', 0.4], ['Fountain', 0.5]] },
    { n: 'Marina Yacht Club Suites', a: 'Dubai Marina', st: 5, r: 9.2, rc: 2680, p: 26500, pt: 'hotel', t: 'luxury', am: ['Beach access', 'Pool', 'Spa', 'Breakfast', 'Bar', 'Marina view'], d: 'Marina-front suites with a private beach club and a rooftop pool that catches the sunset.', lat: 25.0809, lng: 55.1394, near: [['Marina Walk', 0.2], ['JBR Beach', 0.9], ['Ain Dubai', 0.7]] },
    { n: 'Al Fahidi Heritage Stay', a: 'Bur Dubai', st: 3, r: 8.7, rc: 890, p: 7200, pt: 'hotel', t: 'budget', am: ['Free Wi-Fi', 'Breakfast', 'Courtyard', 'Air conditioning'], d: 'A restored wind-tower courtyard house in old Dubai, near the abra crossing and spice souk.', lat: 25.2631, lng: 55.2976, near: [['Al Fahidi', 0.1], ['Abra station', 0.6], ['Gold Souk', 1.2]] },
    { n: 'Palm Jumeirah Beach Resort', a: 'Palm Jumeirah', st: 5, r: 9.3, rc: 4110, p: 38000, pt: 'resort', t: 'luxury', am: ['Private beach', 'Aquaventure access', 'Pool', 'Kids club', 'Spa', 'Breakfast'], d: 'Full-resort experience on the Palm with waterpark access — book for families and beach days.', lat: 25.1301, lng: 55.1173, near: [['Aquaventure', 0.1], ['The Pointe', 1.4], ['Marina', 6.2]] },
  ],
  jaipur: [
    { n: 'Haveli Pink City', a: 'Old City', st: 4, r: 9.2, rc: 1420, p: 6200, pt: 'hotel', t: 'comfort', am: ['Free Wi-Fi', 'Breakfast', 'Rooftop restaurant', 'Courtyard', 'Air conditioning'], d: 'A restored haveli with frescoed walls and a rooftop view of Nahargarh at sunset. Excellent staff.', lat: 26.9211, lng: 75.8248, near: [['Hawa Mahal', 0.4], ['City Palace', 0.6], ['Johari Bazaar', 0.5]] },
    { n: 'Amer Fort View Retreat', a: 'Amer', st: 4, r: 9.0, rc: 640, p: 7800, pt: 'resort', t: 'comfort', am: ['Pool', 'Free Wi-Fi', 'Breakfast', 'Fort view', 'Spa'], d: 'A quiet resort below Amber Fort with a pool, gardens and a terrace facing the ramparts.', lat: 26.9846, lng: 75.8551, near: [['Amber Fort', 0.9], ['Anokhi Museum', 0.6], ['Jal Mahal', 4.2]] },
    { n: 'Bani Park Guest House', a: 'Bani Park', st: 2, r: 8.5, rc: 2180, p: 2100, pt: 'hostel', t: 'budget', am: ['Free Wi-Fi', 'Breakfast', 'Garden', 'Rooftop'], d: 'Simple, spotless family guesthouse with a garden and a rooftop — the best budget base in Jaipur.', lat: 26.9339, lng: 75.7978, near: [['Jaipur Junction', 1.1], ['City Palace', 2.6], ['Albert Hall', 2.1]] },
    { n: 'Rajmahal Palace Suites (demo)', a: 'Civil Lines', st: 5, r: 9.5, rc: 780, p: 24500, pt: 'hotel', t: 'luxury', am: ['Pool', 'Spa', 'Breakfast', 'Restaurant', 'Butler', 'Free Wi-Fi'], d: 'A pink-stucco palace hotel with peacocks on the lawn and suites the size of apartments.', lat: 26.9132, lng: 75.7867, near: [['Albert Hall', 0.8], ['Old City', 3.1], ['Airport', 11.2]] },
  ],
  udaipur: [
    { n: 'Pichola Lake Haveli', a: 'Lake Pichola', st: 4, r: 9.3, rc: 1120, p: 7800, pt: 'hotel', t: 'comfort', am: ['Free Wi-Fi', 'Breakfast', 'Lake view', 'Rooftop restaurant', 'Air conditioning'], d: 'A lakeside haveli with jharokha windows, a rooftop restaurant and the City Palace lit up across the water.', lat: 24.5789, lng: 73.6827, near: [['City Palace', 0.5], ['Ambrai ghat', 0.2], ['Bagore ki Haveli', 0.3]] },
    { n: 'Aravalli Hills Resort', a: 'Sajjangarh', st: 5, r: 9.1, rc: 640, p: 21500, pt: 'resort', t: 'luxury', am: ['Pool', 'Spa', 'Breakfast', 'Hill view', 'Bar', 'Free Wi-Fi'], d: 'A hill resort in the sanctuary with private terraces over the valley — the quiet luxury choice.', lat: 24.5931, lng: 73.6482, near: [['Monsoon Palace', 1.1], ['Lake Pichola', 5.6], ['City Palace', 5.9]] },
    { n: 'Gangaur Ghat Guesthouse', a: 'Gangaur Ghat', st: 2, r: 8.8, rc: 840, p: 2600, pt: 'hostel', t: 'budget', am: ['Free Wi-Fi', 'Breakfast', 'Rooftop', 'Lake view'], d: 'A cheerful guesthouse right on the ghats, with a rooftop that beats every paid viewpoint in the city.', lat: 24.5803, lng: 73.6832, near: [['Gangaur Ghat', 0.05], ['City Palace', 0.4], ['Ambrai', 0.2]] },
    { n: 'Jag Mandir Island Villas (demo)', a: 'Lake Pichola', st: 5, r: 9.6, rc: 320, p: 42000, pt: 'villa', t: 'luxury', am: ['Private boat', 'Pool', 'Spa', 'Breakfast', 'Butler', 'Lake view'], d: 'Private island-style villas reached by boat, with butlers, plunge pools and absolute silence.', lat: 24.5661, lng: 73.6806, near: [['Jag Mandir', 0.1], ['City Palace', 1.1], ['Ambrai', 1.4]] },
  ],
  kerala: [
    { n: 'Vembanad Houseboat (premium)', a: 'Alleppey', st: 4, r: 9.4, rc: 1640, p: 11500, pt: 'resort', t: 'comfort', am: ['Air conditioning', 'Chef on board', 'Sun deck', 'Breakfast, lunch & dinner'], d: 'A two-bedroom premium kettuvallam with an upper deck, an onboard chef and a route away from the busy channels.', lat: 9.4987, lng: 76.3392, near: [['Punnamada Lake', 0.4], ['Alleppey Beach', 4.2], ['Kumarakom', 14]] },
    { n: 'Munnar Tea Bungalow', a: 'Munnar', st: 4, r: 9.2, rc: 720, p: 7600, pt: 'villa', t: 'comfort', am: ['Breakfast', 'Tea estate views', 'Fireplace', 'Free Wi-Fi', 'Trek guide'], d: 'A colonial-era planter’s bungalow inside a working tea estate, with mist at the windows by 18:00.', lat: 10.0892, lng: 77.0599, near: [['Tea Museum', 3.2], ['Top Station', 12.4], ['Kolukkumalai', 18]] },
    { n: 'Fort Kochi Heritage Inn', a: 'Fort Kochi', st: 3, r: 8.9, rc: 980, p: 4600, pt: 'hotel', t: 'budget', am: ['Free Wi-Fi', 'Breakfast', 'Courtyard', 'Bike hire'], d: 'A Dutch-era house with a courtyard and fan-cooled verandas, two streets from the Chinese fishing nets.', lat: 9.9663, lng: 76.2427, near: [['Chinese fishing nets', 0.4], ['St Francis Church', 0.3], ['Mattancherry', 1.9]] },
    { n: 'Kumarakom Lake Resort (demo)', a: 'Kumarakom', st: 5, r: 9.5, rc: 1280, p: 26500, pt: 'resort', t: 'luxury', am: ['Pool', 'Ayurveda spa', 'Breakfast', 'Lake view', 'Restaurant', 'Free Wi-Fi'], d: 'Lakeside villas with private plunge pools and a serious Ayurveda centre — the classic Kerala splurge.', lat: 9.6172, lng: 76.4276, near: [['Vembanad Lake', 0.1], ['Bird sanctuary', 1.2], ['Alleppey', 16]] },
  ],
  'new-york': [
    { n: 'SoHo Loft Hotel', a: 'SoHo', st: 4, r: 8.9, rc: 2140, p: 29500, pt: 'hotel', t: 'comfort', am: ['Free Wi-Fi', 'Gym', 'Bar', 'Air conditioning', 'Rooftop'], d: 'Cast-iron SoHo building with generous loft rooms, a rooftop and the subway one block away.', lat: 40.7233, lng: -74.0009, near: [['SoHo shopping', 0.1], ['Prince St station', 0.2], ['High Line', 1.6]] },
    { n: 'Midtown Skyline Hotel', a: 'Midtown', st: 4, r: 8.5, rc: 4620, p: 24500, pt: 'hotel', t: 'comfort', am: ['Free Wi-Fi', 'Gym', 'Bar', 'City view', 'Concierge'], d: 'High-floor rooms with Empire State views and a location that puts Broadway, the Met and Central Park within reach.', lat: 40.7549, lng: -73.984, near: [['Times Square', 0.4], ['Bryant Park', 0.5], ['Top of the Rock', 0.8]] },
    { n: 'Brooklyn Bridge Hostel', a: 'DUMBO', st: 2, r: 8.3, rc: 1890, p: 9800, pt: 'hostel', t: 'budget', am: ['Free Wi-Fi', 'Shared kitchen', 'Rooftop', 'Lockers'], d: 'Private rooms in a converted warehouse with a rooftop facing the Manhattan skyline.', lat: 40.7033, lng: -73.9881, near: [['Brooklyn Bridge', 0.4], ['DUMBO', 0.2], ['York St station', 0.3]] },
    { n: 'Central Park Grand (demo)', a: 'Upper East Side', st: 5, r: 9.4, rc: 2680, p: 62000, pt: 'hotel', t: 'luxury', am: ['Spa', 'Pool', 'Breakfast', 'Park view', 'Bar', 'Concierge'], d: 'Old-world grand hotel facing the park, with a legendary bar and rooms the size of small apartments.', lat: 40.7662, lng: -73.9771, near: [['Central Park', 0.05], ['The Met', 1.4], ['Fifth Ave', 0.2]] },
  ],
};

const CANCELLATION: Record<HotelClass, string> = {
  budget: 'Free cancellation until 48 hours before check-in. After that, first night is charged.',
  comfort: 'Free cancellation until 24 hours before check-in. Non-refundable rate available at 12% off.',
  luxury: 'Free cancellation until 72 hours before check-in. No prepayment required.',
};

const pickPhotos = (id: string): string[] => {
  const seed = [...id].reduce((a, c) => a + c.charCodeAt(0), 0);
  return [0, 3, 6].map((o) => unsplash(HOTEL_PHOTOS[(seed + o * 5) % HOTEL_PHOTOS.length], 1200));
};

const buildHotel = (cityId: string, s: Seed, idx: number): Hotel => {
  const id = `${cityId}-h${idx + 1}`;
  const base = s.p;
  return {
    id,
    name: s.n,
    cityId,
    area: s.a,
    address: `${s.a}, ${cityId.replace(/-/g, ' ')}`,
    lat: s.lat,
    lng: s.lng,
    stars: s.st,
    rating: s.r,
    reviewCount: s.rc,
    pricePerNight: base,
    propertyType: s.pt,
    tier: s.t,
    amenities: s.am,
    images: pickPhotos(id),
    description: s.d,
    distanceToCenterKm: Number(s.near[0][1] ?? 1),
    nearby: s.near.map(([name, km]) => ({ name, km })),
    rooms: [
      { name: 'Standard double', price: base, sleeps: 2, breakfast: false, refundable: true },
      { name: 'Superior double', price: Math.round(base * 1.28), sleeps: 2, breakfast: true, refundable: true },
      { name: s.pt === 'villa' || s.pt === 'resort' ? 'Private villa' : 'Junior suite', price: Math.round(base * 1.85), sleeps: s.pt === 'villa' ? 4 : 3, breakfast: true, refundable: s.t !== 'budget' },
    ],
    cancellation: CANCELLATION[s.t],
    source: 'mock',
  };
};

export const HOTELS: Hotel[] = Object.entries(S).flatMap(([cityId, list]) =>
  list.map((s, i) => buildHotel(cityId, s, i))
);

export const hotelsByCity = (cityId: string) => HOTELS.filter((h) => h.cityId === cityId);
export const hotelById = (id: string) => HOTELS.find((h) => h.id === id);
