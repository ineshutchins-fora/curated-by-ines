'use client';

import { useState, useRef } from 'react';
import styles from './CruisePlanner.module.css';

const DESTINATIONS = [
  'Caribbean', 'Mediterranean', 'Greek Islands', 'Alaska',
  'Bahamas', 'Europe', 'Adriatic', 'Canary Islands',
  'Norway / Fjords', 'Asia', 'Transatlantic', 'Flexible',
];

const NIGHTS_OPTIONS = [
  { label: '3–5 nights', sub: 'quick escape' },
  { label: '7 nights', sub: 'the sweet spot' },
  { label: '10–14 nights', sub: 'deep dive' },
  { label: '14+ nights', sub: 'grand voyage' },
];

const STYLE_OPTIONS = [
  { label: 'Budget-friendly', sub: 'value first' },
  { label: 'Mid-range', sub: 'best of both' },
  { label: 'Elevated', sub: 'premium experience' },
  { label: 'Luxury', sub: 'no compromises' },
];

const TRAVEL_WITH = [
  'Couple', 'Family with kids', 'Friends group',
  'Multi-generational', 'Honeymoon', 'Solo',
];

const PRIORITIES = [
  'Ports & Excursions', 'Food & Dining', 'Entertainment',
  'Relaxation & Spa', 'Value for Money', 'Luxury Experience',
  'Adventure Activities', 'Adults-only vibe',
];

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December', 'Flexible',
];

const YEARS = ['2026', '2027', '2028', 'Flexible'];

const PORTS = [
  'Miami, FL', 'Port Canaveral, FL', 'Fort Lauderdale, FL',
  'New York, NY', 'Galveston, TX', 'Seattle, WA',
  'New Orleans, LA', 'Baltimore, MD', 'Tampa, FL',
  'Rome (Civitavecchia)', 'Barcelona', 'Athens (Piraeus)',
  'Venice', 'Lisbon', 'Amsterdam', 'Southampton, UK',
  'Copenhagen', 'Dubai', 'Singapore', 'Flexible',
];

const GOOGLE_SHEET_URL = 'https://script.google.com/macros/s/AKfycbyVgPhJ0d6ZDeUaPrmUlRwo7Z8GIzyHbxlMKEVyOBAAtffQ-dORjWt7R0KTzi6yh8LMlA/exec';

export default function CruisePlanner() {
  const [destinations, setDestinations] = useState<string[]>([]);
  const [departurePort, setDeparturePort] = useState('');
  const [month, setMonth] = useState('');
  const [year, setYear] = useState('');
  const [nights, setNights] = useState('');
  const [guests, setGuests] = useState('');
  const [style, setStyle] = useState('');
  const [travelWith, setTravelWith] = useState('');
  const [priorities, setPriorities] = useState<string[]>([]);
  const [firstCruise, setFirstCruise] = useState('');
  const [email, setEmail] = useState('');

  const [loading, setLoading] = useState(false);
  const [recommendation, setRecommendation] = useState('');
  const [photo, setPhoto] = useState<{ url: string; author: string } | null>(null);
  const [error, setError] = useState('');

  const outputRef = useRef<HTMLDivElement>(null);

  const toggleDestination = (d: string) => {
    setDestinations(prev =>
      prev.includes(d) ? prev.filter(x => x !== d) : [...prev, d]
    );
  };

  const togglePriority = (p: string) => {
    setPriorities(prev =>
      prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p]
    );
  };

  const handleSubmit = async () => {
    if (!destinations.length) {
      setError('Please select at least one destination.');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setError('Please enter a valid email address.');
      return;
    }

    setError('');
    setRecommendation('');
    setPhoto(null);
    setLoading(true);

    setTimeout(() => {
      outputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);

    // Fetch photo
const photoQueries: Record<string, string> = {
  'Caribbean': 'caribbean turquoise water beach tropical',
  'Mediterranean': 'mediterranean coast village sea',
  'Greek Islands': 'santorini greece white buildings blue dome',
  'Alaska': 'alaska glacier fjord mountains',
  'Bahamas': 'bahamas clear turquoise water',
  'Europe': 'european harbor coast sunset',
  'Adriatic': 'dubrovnik croatia old town coast',
  'Canary Islands': 'canary islands volcanic ocean landscape',
  'Norway / Fjords': 'norway fjord dramatic cliffs water',
  'Asia': 'southeast asia tropical bay limestone',
  'Transatlantic': 'ocean sunset horizon waves',
  'Flexible': 'luxury ocean sunset voyage',
};
const photoQuery = photoQueries[destinations[0]] || 'ocean voyage travel';
    try {
      const photoRes = await fetch(
        `https://api.unsplash.com/search/photos?query=${encodeURIComponent(photoQuery)}&orientation=landscape&per_page=1&client_id=5lZe075dK-T0K30uza8U7l4A4zET86UbyTejwH7J3yg`
      );
      const photoData = await photoRes.json();
      if (photoData.results?.[0]) {
        setPhoto({
          url: photoData.results[0].urls.regular,
          author: photoData.results[0].user.name,
        });
      }
    } catch {
      // silently fail
    }

    // Save lead
    try {
      await fetch(GOOGLE_SHEET_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          destination: destinations.join(', '),
          duration: nights,
          month: `${month} ${year}`,
          budget: style,
          styles: priorities.join(', '),
          who: travelWith,
          tool: 'Cruise Planner',
        }),
      });
    } catch {
      // silently fail
    }

    // Generate recommendation
    try {
      const res = await fetch('/api/cruise', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          destinations,
          departurePort,
          month,
          year,
          nights,
          guests,
          style,
          travelWith,
          priorities,
          firstCruise,
          email,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'Something went wrong. Please try again.');
        setLoading(false);
        return;
      }

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      if (!reader) throw new Error('No response stream');

      let text = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        text += decoder.decode(value, { stream: true });
        setRecommendation(text);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unexpected error';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(recommendation);
  };

  return (
    <div className={styles.page}>
      {/* Header */}
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <img src="/logo.png" alt="Curated by Ines" className={styles.logo} />
          <p className={styles.brandSub}>Find your perfect cruise, thoughtfully matched</p>
        </div>
      </header>

      <main className={styles.main}>
        <section className={styles.formCard}>

          {/* Destinations */}
          <div className={styles.formSection}>
            <div className={styles.sectionLabel}>Where do you want to sail?</div>
            <div className={styles.chipGroup}>
              {DESTINATIONS.map(d => (
                <button
                  key={d}
                  className={`${styles.chip} ${destinations.includes(d) ? styles.chipActive : ''}`}
                  onClick={() => toggleDestination(d)}
                  type="button"
                >
                  {d}
                </button>
              ))}
            </div>
          </div>

          <div className={styles.divider} />

          {/* When */}
          <div className={styles.formSection}>
            <div className={styles.sectionLabel}>When are you thinking?</div>
            <div className={styles.fieldRow2}>
              <div>
                <label className={styles.fieldLabel}>Month</label>
                <div className={styles.selectWrap}>
                  <select className={styles.select} value={month} onChange={e => setMonth(e.target.value)}>
                    <option value="">Select month</option>
                    {MONTHS.map(m => <option key={m}>{m}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className={styles.fieldLabel}>Year</label>
                <div className={styles.selectWrap}>
                  <select className={styles.select} value={year} onChange={e => setYear(e.target.value)}>
                    <option value="">Select year</option>
                    {YEARS.map(y => <option key={y}>{y}</option>)}
                  </select>
                </div>
              </div>
            </div>
          </div>

          <div className={styles.divider} />

          {/* Trip length */}
          <div className={styles.formSection}>
            <div className={styles.sectionLabel}>How long?</div>
            <div className={styles.chipGroup}>
              {NIGHTS_OPTIONS.map(n => (
                <button
                  key={n.label}
                  className={`${styles.chip} ${nights === n.label ? styles.chipActive : ''}`}
                  onClick={() => setNights(n.label)}
                  type="button"
                >
                  {n.label} <span className={styles.chipSub}>— {n.sub}</span>
                </button>
              ))}
            </div>
          </div>

          <div className={styles.divider} />

          {/* Departure port + guests */}
          <div className={styles.fieldRow2}>
            <div>
              <label className={styles.fieldLabel}>Departure port</label>
              <div className={styles.selectWrap}>
                <select className={styles.select} value={departurePort} onChange={e => setDeparturePort(e.target.value)}>
                  <option value="">Select or flexible</option>
                  {PORTS.map(p => <option key={p}>{p}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className={styles.fieldLabel}>Number of guests</label>
              <input
                className={styles.input}
                type="text"
                placeholder="e.g. 2 adults, 1 child"
                value={guests}
                onChange={e => setGuests(e.target.value)}
              />
            </div>
          </div>

          <div className={styles.divider} />

          {/* Style */}
          <div className={styles.formSection}>
            <div className={styles.sectionLabel}>Budget & style</div>
            <div className={styles.chipGroup}>
              {STYLE_OPTIONS.map(s => (
                <button
                  key={s.label}
                  className={`${styles.chip} ${style === s.label ? styles.chipActive : ''}`}
                  onClick={() => setStyle(s.label)}
                  type="button"
                >
                  {s.label} <span className={styles.chipSub}>— {s.sub}</span>
                </button>
              ))}
            </div>
          </div>

          <div className={styles.divider} />

          {/* Who */}
          <div className={styles.formSection}>
            <div className={styles.sectionLabel}>Who's sailing?</div>
            <div className={styles.chipGroup}>
              {TRAVEL_WITH.map(w => (
                <button
                  key={w}
                  className={`${styles.chip} ${travelWith === w ? styles.chipActive : ''}`}
                  onClick={() => setTravelWith(w)}
                  type="button"
                >
                  {w}
                </button>
              ))}
            </div>
          </div>

          <div className={styles.divider} />

          {/* Priorities */}
          <div className={styles.formSection}>
            <div className={styles.sectionLabel}>What matters most to you?</div>
            <div className={styles.chipGroup}>
              {PRIORITIES.map(p => (
                <button
                  key={p}
                  className={`${styles.chip} ${priorities.includes(p) ? styles.chipActive : ''}`}
                  onClick={() => togglePriority(p)}
                  type="button"
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          <div className={styles.divider} />

          {/* First cruise */}
          <div className={styles.formSection}>
            <div className={styles.sectionLabel}>Cruise experience</div>
            <div className={styles.chipGroup}>
              {['This is my first cruise', 'I have cruised before', 'I cruise regularly'].map(o => (
                <button
                  key={o}
                  className={`${styles.chip} ${firstCruise === o ? styles.chipActive : ''}`}
                  onClick={() => setFirstCruise(o)}
                  type="button"
                >
                  {o}
                </button>
              ))}
            </div>
          </div>

          <div className={styles.divider} />

          {/* Email */}
          <div className={styles.formSection}>
            <div className={styles.fieldFull}>
              <label className={styles.fieldLabel}>Your email address *</label>
              <input
                className={styles.input}
                type="email"
                placeholder="email@example.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
              />
              <p className={styles.emailNote}>
                I'll follow up with real pricing and availability — personally.
              </p>
            </div>
          </div>

          {error && <p className={styles.errorMsg}>{error}</p>}

          <button
            className={styles.generateBtn}
            onClick={handleSubmit}
            disabled={loading}
            type="button"
          >
            {loading ? 'Finding your perfect cruise…' : '🚢   Find My Cruise'}
          </button>

        </section>

        {/* Output */}
        {(loading || recommendation) && (
          <section className={styles.outputCard} ref={outputRef}>
            <div className={styles.ornament}>— ✦ —</div>

            {photo && (
              <div className={styles.photoWrap}>
                <img src={photo.url} alt="cruise" className={styles.editorialPhoto} />
                <span className={styles.photoCredit}>Photo by {photo.author} · Unsplash</span>
              </div>
            )}

            <div className={styles.outputHeader}>
              <h2 className={styles.outputTitle}>
                {destinations.length
                  ? `Your ${destinations[0]} Cruise`
                  : 'Your Cruise Recommendation'}
              </h2>
              {recommendation && (
                <button className={styles.copyBtn} onClick={handleCopy} type="button">
                  Copy
                </button>
              )}
            </div>

            {loading && !recommendation && (
              <div className={styles.loadingRow}>
                <span className={styles.dot} />
                <span className={styles.dot} />
                <span className={styles.dot} />
                <span className={styles.loadingText}>Matching you with the perfect cruise…</span>
              </div>
            )}

            {recommendation && (
              <div
                className={styles.recommendationText}
                dangerouslySetInnerHTML={{
  __html: recommendation
    .replace(/^### (.*$)/gim, '<h3>$1</h3>')
    .replace(/^## (.*$)/gim, '<h2>$1</h2>')
    .replace(/^# (.*$)/gim, '<h1>$1</h1>')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/^---$/gim, '<hr style="border:none;border-top:1px solid #E2D9C8;margin:1.2rem 0;">')
        .replace(/^- (.*$)/gim, '<li style="margin-left:1.2rem;margin-bottom:0.3rem;list-style:none;">$1</li>')
}}
              />
            )}

            {recommendation && (
              <div className={styles.ctaBox}>
                <p className={styles.ctaText}>
                  Ready for real pricing and the best available cabin?
                </p>
                <a
                  href="mailto:ines@curatedbyines.com?subject=Cruise Inquiry"
                  className={styles.ctaBtn}
                >
                  Get My Personalized Quote ✦
                </a>
              </div>
            )}
          </section>
        )}
      </main>

      <footer className={styles.footer}>
        <p>Curated by Ines &nbsp;·&nbsp; Every voyage, thoughtfully matched</p>
      </footer>
    </div>
  );
}
