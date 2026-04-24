'use client';

import { useState, useRef } from 'react';
import styles from './TravelPlanner.module.css';

const TRAVEL_STYLES = [
  'Foodie & Dining', 'Culture & Art', 'Adventure',
  'Relaxation & Wellness', 'History', 'Nightlife',
  'Nature & Outdoors', 'Shopping',
];

const PACE_OPTIONS = [
  { label: 'Packed', sub: 'see everything' },
  { label: 'Balanced', sub: 'best of both' },
  { label: 'Relaxed', sub: 'slow & savoring' },
];

const WHO_OPTIONS = [
  'Solo', 'Couple', 'Friends', 'Family with kids', 'Multi-generational', 'Honeymoon',
];

const MONTHS = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
];

export default function TravelPlanner() {
  const [destination, setDestination] = useState('');
  const [duration, setDuration] = useState('');
  const [month, setMonth] = useState('');
  const [budget, setBudget] = useState('');
  const [selectedStyles, setSelectedStyles] = useState<string[]>([]);
  const [pace, setPace] = useState('');
  const [who, setWho] = useState('');

  const [loading, setLoading] = useState(false);
  const [itinerary, setItinerary] = useState('');
  const [error, setError] = useState('');

  const outputRef = useRef<HTMLDivElement>(null);

  const toggleStyle = (s: string) => {
    setSelectedStyles(prev =>
      prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]
    );
  };

  const handleSubmit = async () => {
    if (!destination.trim() || !duration.trim()) {
      setError('Please fill in at least the destination and trip length.');
      return;
    }

    setError('');
    setItinerary('');
    setLoading(true);

    setTimeout(() => {
      outputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);

    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          destination,
          duration,
          month,
          budget,
          styles: selectedStyles,
          pace,
          who,
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
        setItinerary(text);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unexpected error';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(itinerary);
  };

  return (
    <div className={styles.page}>
      {/* Header */}
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <p className={styles.eyebrow}>Travel Planning by</p>
          <h1 className={styles.brandTitle}>Curated by Ines</h1>
          <p className={styles.brandSub}>Your personalized journey, thoughtfully designed</p>
        </div>
      </header>

      <main className={styles.main}>
        {/* Form */}
        <section className={styles.formCard}>

          {/* Destination block */}
          <div className={styles.formSection}>
            <div className={styles.sectionLabel}>The Destination</div>
            <div className={styles.fieldFull}>
              <label className={styles.fieldLabel}>Where are you going?</label>
              <input
                className={styles.input}
                type="text"
                placeholder="e.g. Amalfi Coast, Tokyo, Marrakech…"
                value={destination}
                onChange={e => setDestination(e.target.value)}
              />
            </div>
            <div className={styles.fieldRow3}>
              <div>
                <label className={styles.fieldLabel}>Trip length</label>
                <input
                  className={styles.input}
                  type="text"
                  placeholder="e.g. 7 days"
                  value={duration}
                  onChange={e => setDuration(e.target.value)}
                />
              </div>
              <div>
                <label className={styles.fieldLabel}>Month of travel</label>
                <div className={styles.selectWrap}>
                  <select className={styles.select} value={month} onChange={e => setMonth(e.target.value)}>
                    <option value="">Select month</option>
                    {MONTHS.map(m => <option key={m}>{m}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className={styles.fieldLabel}>Budget level</label>
                <div className={styles.selectWrap}>
                  <select className={styles.select} value={budget} onChange={e => setBudget(e.target.value)}>
                    <option value="">Select</option>
                    <option>Budget-conscious</option>
                    <option>Mid-range</option>
                    <option>Elevated</option>
                    <option>Luxury</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          <div className={styles.divider} />

          {/* Travel style */}
          <div className={styles.formSection}>
            <div className={styles.sectionLabel}>Your Travel Style</div>
            <div className={styles.chipGroup}>
              {TRAVEL_STYLES.map(s => (
                <button
                  key={s}
                  className={`${styles.chip} ${selectedStyles.includes(s) ? styles.chipActive : ''}`}
                  onClick={() => toggleStyle(s)}
                  type="button"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div className={styles.divider} />

          {/* Pace */}
          <div className={styles.formSection}>
            <div className={styles.sectionLabel}>Travel Pace</div>
            <div className={styles.chipGroup}>
              {PACE_OPTIONS.map(p => (
                <button
                  key={p.label}
                  className={`${styles.chip} ${pace === p.label ? styles.chipActive : ''}`}
                  onClick={() => setPace(p.label)}
                  type="button"
                >
                  {p.label} <span className={styles.chipSub}>— {p.sub}</span>
                </button>
              ))}
            </div>
          </div>

          <div className={styles.divider} />

          {/* Who */}
          <div className={styles.formSection}>
            <div className={styles.sectionLabel}>Who&apos;s Traveling</div>
            <div className={styles.chipGroup}>
              {WHO_OPTIONS.map(w => (
                <button
                  key={w}
                  className={`${styles.chip} ${who === w ? styles.chipActive : ''}`}
                  onClick={() => setWho(w)}
                  type="button"
                >
                  {w}
                </button>
              ))}
            </div>
          </div>

          {error && <p className={styles.errorMsg}>{error}</p>}

          <button
            className={styles.generateBtn}
            onClick={handleSubmit}
            disabled={loading}
            type="button"
          >
            {loading ? 'Curating your journey…' : '✦   Plan My Journey'}
          </button>

        </section>

        {/* Output */}
        {(loading || itinerary) && (
          <section className={styles.outputCard} ref={outputRef}>
            <div className={styles.ornament}>— ✦ —</div>
            <div className={styles.outputHeader}>
              <h2 className={styles.outputTitle}>
                {destination ? `Your ${destination} Itinerary` : 'Your Itinerary'}
              </h2>
              {itinerary && (
                <button className={styles.copyBtn} onClick={handleCopy} type="button">
                  Copy
                </button>
              )}
            </div>

            {loading && !itinerary && (
              <div className={styles.loadingRow}>
                <span className={styles.dot} />
                <span className={styles.dot} />
                <span className={styles.dot} />
                <span className={styles.loadingText}>Crafting your personalized itinerary…</span>
              </div>
            )}

            {itinerary && (
              <div className={styles.itineraryText} dangerouslySetInnerHTML={{ __html: itinerary.replace(/^### (.*$)/gim, '<h3>$1</h3>').replace(/^## (.*$)/gim, '<h2>$1</h2>').replace(/^# (.*$)/gim, '<h1>$1</h1>').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\*(.*?)\*/g, '<em>$1</em>').replace(/^- (.*$)/gim, '<li>$1</li>') }} />
            )}
          </section>
        )}
      </main>

      <footer className={styles.footer}>
        <p>Curated by Ines &nbsp;·&nbsp; Every journey, thoughtfully designed</p>
      </footer>
    </div>
  );
}
