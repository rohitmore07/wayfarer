import { CITY_ALIASES, cityById, resolveCityId } from '@/lib/data/cities';
import type { HotelClass, Interest, Pace, TravelBrief } from '@/lib/types';
import { addDays, todayISO } from '@/lib/utils';

export interface ParsedIntent {
  brief: Partial<TravelBrief>;
  missing: ('destination' | 'dates' | 'budget' | 'travelers')[];
  confidence: number;
  followUps: string[];
  interpreted: string[];
}

const INTEREST_KEYWORDS: Record<Interest, string[]> = {
  culture: ['culture', 'cultural', 'tradition', 'temple', 'shrine', 'heritage', 'local life'],
  food: ['food', 'eat', 'cuisine', 'culinary', 'restaurant', 'street food', 'ramen', 'sushi', 'foodie', 'michelin'],
  nature: ['nature', 'mountain', 'forest', 'lake', 'beach', 'waterfall', 'scenery', 'outdoors', 'hiking trail'],
  adventure: ['adventure', 'trek', 'hike', 'hiking', 'diving', 'scuba', 'surf', 'paraglid', 'bungee', 'rafting', 'adrenaline', 'thrill'],
  nightlife: ['nightlife', 'bar', 'club', 'party', 'drinks', 'pub', 'izakaya'],
  shopping: ['shopping', 'shop', 'market', 'boutique', 'mall', 'souvenir', 'vintage', 'fashion'],
  art: ['art', 'museum', 'gallery', 'design', 'architecture', 'exhibition'],
  history: ['history', 'historic', 'ancient', 'castle', 'fort', 'ruins', 'monument', 'archaeolog'],
  photography: ['photograph', 'photo', 'instagram', 'camera', 'scenic', 'sunset spot'],
  relaxation: ['relax', 'slow', 'spa', 'onsen', 'wellness', 'ayurveda', 'chill', 'peaceful', 'unwind', 'luxury stay'],
  family: ['family', 'kids', 'children', 'toddler', 'with my parents', 'grandparents'],
  anime: ['anime', 'manga', 'akihabara', 'otaku', 'gaming', 'pokemon', 'ghibli'],
};

const MONTHS = [
  'january', 'february', 'march', 'april', 'may', 'june',
  'july', 'august', 'september', 'october', 'november', 'december',
];

function parseMoney(text: string): number | null {
  const t = text.replace(/,/g, '');
  // ₹1,50,000 style, 150000, 1.5 lakh, 80k, 2L
  const lakh = /(\d+(?:\.\d+)?)\s*(?:lakh|lac|l\b)/i.exec(t);
  if (lakh) return Math.round(parseFloat(lakh[1]) * 100000);
  const k = /(\d+(?:\.\d+)?)\s*k\b/i.exec(t);
  if (k) return Math.round(parseFloat(k[1]) * 1000);
  const rupee = /(?:₹|rs\.?|inr)\s*([\d]{1,3}(?:[\d,]{2,})*)/i.exec(text);
  if (rupee) return parseInt(rupee[1].replace(/,/g, ''), 10);
  const big = /\b(\d{5,7})\b/.exec(t);
  if (big) return parseInt(big[1], 10);
  return null;
}

function parseDates(text: string): { startDate?: string; days?: number; label?: string } {
  const t = text.toLowerCase();
  const today = new Date();
  let days: number | undefined;

  const dayMatch = /\b(\d{1,2})\s*(?:-|\s)?(?:day|days|nights|night)\b/.exec(t);
  if (dayMatch) days = parseInt(dayMatch[1], 10);
  if (/\ba week\b/.test(t)) days = 7;
  if (/\btwo weeks\b|\bfortnight\b/.test(t)) days = 14;
  if (/\blong weekend\b/.test(t)) days = 4;
  else if (/\bweekend\b/.test(t)) days = days ?? 3;
  const nightsMatch = /\b(\d{1,2})\s*nights?\b/.exec(t);
  if (!days && nightsMatch) days = parseInt(nightsMatch[1], 10) + 1;

  const explicit = /\b(20\d{2})-(\d{2})-(\d{2})\b/.exec(t);
  let startDate: string | undefined;
  let label: string | undefined;

  if (explicit) {
    startDate = explicit[0];
    label = explicit[0];
  } else {
    const monthIdx = MONTHS.findIndex((m) => new RegExp(`\\b${m}\\b`).test(t));
    if (monthIdx >= 0) {
      const dayMatch2 = new RegExp(`\\b(\\d{1,2})(?:st|nd|rd|th)?\\s+(?:of\\s+)?${MONTHS[monthIdx]}`).exec(t);
      const day = dayMatch2 ? parseInt(dayMatch2[1], 10) : 12;
      let year = today.getFullYear();
      let candidate = new Date(year, monthIdx, day);
      if (candidate.getTime() < today.getTime() - 86400000) {
        year += 1;
        candidate = new Date(year, monthIdx, day);
      }
      startDate = `${year}-${String(monthIdx + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      label = MONTHS[monthIdx][0].toUpperCase() + MONTHS[monthIdx].slice(1);
    } else if (/\bnext month\b/.test(t)) {
      const d = new Date(today.getFullYear(), today.getMonth() + 1, 10);
      startDate = d.toISOString().slice(0, 10);
      label = 'next month';
    } else if (/\bnext week\b/.test(t)) {
      startDate = addDays(todayISO(), 7);
      label = 'next week';
    } else if (/\bin (\d{1,2}) days?\b/.test(t)) {
      const n = parseInt(/\bin (\d{1,2}) days?\b/.exec(t)![1], 10);
      startDate = addDays(todayISO(), n);
    }
  }
  return { startDate, days, label };
}

function parseTravelers(text: string): number | undefined {
  const t = text.toLowerCase();
  const explicit = /\b(\d{1,2})\s*(?:adults?|people|travell?ers?|persons?|pax|friends?|of us)\b/.exec(t);
  if (explicit) return parseInt(travelersSafe(explicit[1]), 10);
  if (/\bsolo\b|\balone\b|\bmyself\b/.test(t)) return 1;
  if (/\bpartner\b|\bcouple\b|\bwife\b|\bhusband\b|\bgirlfriend\b|\bboyfriend\b|\bhoneymoon\b|\bwith my (?:wife|husband|partner)\b/.test(t))
    return 2;
  if (/\bfamily of (\d)\b/.exec(t)) return parseInt(/\bfamily of (\d)\b/.exec(t)![1], 10);
  if (/\bwith my (?:parents|family)\b/.test(t)) return 3;
  return undefined;
}

const travelersSafe = (s: string) => (parseInt(s, 10) > 0 && parseInt(s, 10) < 20 ? s : '2');

function parseHotelClass(text: string): HotelClass | undefined {
  const t = text.toLowerCase();
  if (/\bluxur|5[- ]star|five star|premium|splurge|high[- ]end|boutique|4[- ]star/.test(t)) return 'luxury';
  if (/\bcomfort|mid[- ]range|decent|nice hotel|good hotel|3[- ]star/.test(t)) return 'comfort';
  // "budget" only counts as a hotel preference when it is attached to the stay
  if (/\b(budget|cheap|affordable|economy)\s+(hotel|hotels|stay|stays|accommodation|hostel|inn|place)/.test(t) ||
      /on a budget|tight budget|backpack|hostel|save money/.test(t))
    return 'budget';
  return undefined;
}

function parsePace(text: string): { pace?: Pace; avoidEarlyMornings?: boolean } {
  const t = text.toLowerCase();
  if (/don'?t want to wake up early|no early|not early|sleep in|late start|slow morning|no alarm/.test(t))
    return { pace: 'relaxed', avoidEarlyMornings: true };
  if (/\brelaxed|slow|chill|laid[- ]back|not rushed|unhurried/.test(t)) return { pace: 'relaxed' };
  if (/\bpacked|pack in|see everything|maximise|maximize|busy schedule|action[- ]packed/.test(t)) return { pace: 'packed' };
  if (/\bbalanced|moderate\b/.test(t)) return { pace: 'balanced' };
  return {};
}

export function detectInterests(text: string): Interest[] {
  const t = text.toLowerCase();
  const found: Interest[] = [];
  (Object.keys(INTEREST_KEYWORDS) as Interest[]).forEach((interest) => {
    if (INTEREST_KEYWORDS[interest].some((k) => t.includes(k))) found.push(interest);
  });
  return found.length ? found : ['culture', 'food'];
}

function parseDestinations(text: string): string[] {
  const t = text.toLowerCase();
  const ids: string[] = [];

  // explicit city names first
  for (const alias of Object.keys(CITY_ALIASES)) {
    if (alias.length < 3) continue;
    const re = new RegExp(`\\b${alias.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
    if (re.test(t)) {
      const id = CITY_ALIASES[alias];
      if (!ids.includes(id)) ids.push(id);
    }
  }
  if (ids.length) return ids.slice(0, 4);

  const resolved = resolveCityId(t);
  return resolved ? [resolved] : [];
}

export function parseBrief(
  text: string,
  defaults: Partial<TravelBrief> = {}
): ParsedIntent {
  const interpreted: string[] = [];
  const raw = text.trim();
  const dates = parseDates(raw);
  const destIds = parseDestinations(raw);
  const travelers = parseTravelers(raw);
  const money = parseMoney(raw);
  const hotelClass = parseHotelClass(raw);
  const { pace, avoidEarlyMornings } = parsePace(raw);
  const interests = /\b(love|like|into|interest|enjoy|prefer|fan of|keen on)\b/i.test(raw) || destIds.length
    ? detectInterests(raw)
    : detectInterests(raw);

  const perPerson = /per person|each|pp\b/i.test(raw);
  const totalBudget = money ?? undefined;

  const brief: Partial<TravelBrief> = {
    destinationQuery: destIds.length ? destIds.map((id) => cityById(id)?.name ?? id).join(', ') : raw.slice(0, 80),
    cityIds: destIds,
    interests,
  };

  if (dates.startDate) brief.startDate = dates.startDate;
  if (dates.days) brief.days = dates.days;
  if (travelers) brief.travelers = travelers;
  if (totalBudget) brief.budgetPerPerson = perPerson ? totalBudget : travelers && travelers > 1 ? Math.round(totalBudget / travelers) : totalBudget;
  if (hotelClass) brief.hotelClass = hotelClass;
  if (pace) brief.pace = pace;
  if (avoidEarlyMornings) brief.avoidEarlyMornings = true;

  const originCity = defaults.originCity ?? 'Mumbai';
  brief.originCity = originCity;
  brief.originCode = defaults.originCode ?? 'BOM';

  // interpretation log — shown to the user so the agent is never a black box
  if (destIds.length) interpreted.push(`Destination: ${destIds.map((id) => cityById(id)?.name).join(' + ')}`);
  if (dates.days) interpreted.push(`${dates.days} days${dates.label ? ` in ${dates.label}` : ''}`);
  if (travelers) interpreted.push(`${travelers} traveller${travelers > 1 ? 's' : ''}`);
  if (totalBudget)
    interpreted.push(
      `Budget ${'₹' + totalBudget.toLocaleString('en-IN')}${perPerson ? ' per person' : travelers && travelers > 1 ? ' total' : ''}`
    );
  if (interests.length) interpreted.push(`Interests: ${interests.slice(0, 5).join(', ')}`);
  if (hotelClass) interpreted.push(`Stay style: ${hotelClass}`);
  if (pace) interpreted.push(`Pace: ${pace}${avoidEarlyMornings ? ' (late starts)' : ''}`);

  const missing: ParsedIntent['missing'] = [];
  if (!destIds.length) missing.push('destination');
  if (!dates.startDate) missing.push('dates');
  if (!totalBudget) missing.push('budget');
  if (!travelers) missing.push('travelers');

  const followUps: string[] = [];
  if (missing.includes('destination'))
    followUps.push('Which destination are you dreaming about — or should I suggest three that fit your budget?');
  if (missing.includes('dates')) followUps.push('When would you like to travel? A month and rough dates is enough.');
  if (missing.includes('budget'))
    followUps.push('What is your budget per person (excluding shopping)? I will build the plan to fit it.');
  if (missing.includes('travelers')) followUps.push('How many people are travelling?');

  const confidence = Math.min(0.98, 0.35 + interpreted.length * 0.12);

  return { brief, missing, confidence, followUps, interpreted };
}

export function mergeBrief(base: TravelBrief, patch: Partial<TravelBrief>): TravelBrief {
  return {
    ...base,
    ...patch,
    cityIds: patch.cityIds?.length ? patch.cityIds : base.cityIds,
    interests: patch.interests?.length ? patch.interests : base.interests,
  };
}

export function defaultBrief(overrides: Partial<TravelBrief> = {}): TravelBrief {
  const start = addDays(todayISO(), 45);
  return {
    originCity: 'Mumbai',
    originCode: 'BOM',
    destinationQuery: 'Japan',
    cityIds: ['tokyo', 'kyoto', 'osaka'],
    startDate: start,
    days: 7,
    travelers: 2,
    budgetPerPerson: 150000,
    interests: ['culture', 'food', 'photography', 'nature'],
    hotelClass: 'comfort',
    pace: 'balanced',
    avoidEarlyMornings: false,
    ...overrides,
  };
}
