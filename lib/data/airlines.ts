export interface Airline {
  code: string;
  name: string;
  color: string;
  rating: number; // 1-5, used to shape the "recommended" score
  regions: string[];
}

export const AIRLINES: Airline[] = [
  { code: 'AI', name: 'Air India', color: '#B3232C', rating: 3.8, regions: ['IN'] },
  { code: '6E', name: 'IndiGo', color: '#1B3A8B', rating: 4.0, regions: ['IN'] },
  { code: 'UK', name: 'Vistara', color: '#5B2D88', rating: 4.3, regions: ['IN'] },
  { code: 'EK', name: 'Emirates', color: '#D71920', rating: 4.7, regions: ['AE', 'IN'] },
  { code: 'QR', name: 'Qatar Airways', color: '#5C0632', rating: 4.7, regions: ['QA', 'IN'] },
  { code: 'EY', name: 'Etihad', color: '#BD8B13', rating: 4.4, regions: ['AE'] },
  { code: 'SQ', name: 'Singapore Airlines', color: '#F2A900', rating: 4.8, regions: ['SG'] },
  { code: 'NH', name: 'All Nippon Airways', color: '#123C8B', rating: 4.6, regions: ['JP'] },
  { code: 'JL', name: 'Japan Airlines', color: '#C8102E', rating: 4.5, regions: ['JP'] },
  { code: 'TG', name: 'Thai Airways', color: '#5C2D91', rating: 4.1, regions: ['TH'] },
  { code: 'MH', name: 'Malaysia Airlines', color: '#0B4C7C', rating: 4.0, regions: ['MY'] },
  { code: 'CX', name: 'Cathay Pacific', color: '#00645A', rating: 4.6, regions: ['HK'] },
  { code: 'VN', name: 'Vietnam Airlines', color: '#1B6B4A', rating: 4.0, regions: ['VN'] },
  { code: 'AK', name: 'AirAsia', color: '#E31E24', rating: 3.6, regions: ['MY', 'TH'] },
  { code: 'AF', name: 'Air France', color: '#002157', rating: 4.3, regions: ['FR'] },
  { code: 'LH', name: 'Lufthansa', color: '#05164D', rating: 4.4, regions: ['DE'] },
  { code: 'BA', name: 'British Airways', color: '#075AAA', rating: 4.2, regions: ['GB'] },
  { code: 'KL', name: 'KLM', color: '#00A1DE', rating: 4.3, regions: ['NL'] },
  { code: 'FI', name: 'Icelandair', color: '#0A3D62', rating: 4.2, regions: ['IS'] },
  { code: 'LX', name: 'SWISS', color: '#D8232A', rating: 4.5, regions: ['CH'] },
  { code: 'AA', name: 'American Airlines', color: '#0078D2', rating: 3.9, regions: ['US'] },
  { code: 'UA', name: 'United', color: '#0033A0', rating: 3.8, regions: ['US'] },
  { code: 'DL', name: 'Delta', color: '#003366', rating: 4.0, regions: ['US'] },
  { code: 'GA', name: 'Garuda Indonesia', color: '#0C60A8', rating: 4.1, regions: ['ID'] },
  { code: 'OD', name: 'Batik Air', color: '#0F3A6C', rating: 3.7, regions: ['ID', 'MY'] },
  { code: 'WY', name: 'Oman Air', color: '#8C1D40', rating: 4.2, regions: ['OM'] },
];

export const airlineByCode = (code: string) => AIRLINES.find((a) => a.code === code);

/** Carriers that plausibly serve a route, used by the demo fare generator. */
export function carriersFor(originCountry: string, destCountry: string): Airline[] {
  const pool = AIRLINES.filter(
    (a) => a.regions.includes(originCountry) || a.regions.includes(destCountry)
  );
  const hub = ['EK', 'QR', 'SQ', 'TG', 'MH', 'CX', 'EY', 'WY'].map((c) => AIRLINES.find((a) => a.code === c)!);
  const all = [...pool, ...hub.filter((h) => !pool.some((p) => p.code === h.code))];
  return all.length ? all : AIRLINES.slice(0, 6);
}
