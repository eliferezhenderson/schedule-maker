'use client';

import styles from './page.module.css';


import { useEffect, useState } from 'react';

export default function HomePage() {
  const [start, setStart] = useState('09:00');
  const [end, setEnd] = useState('17:00');
  const [slotLength, setSlotLength] = useState(30);
  const [numSlots, setNumSlots] = useState(8);
  const [numBreaks, setNumBreaks] = useState(1);
  const [breakLength, setBreakLength] = useState(10);
  const [lunchStart, setLunchStart] = useState('12:30');
  const [lunchLength, setLunchLength] = useState(60);
  const [output, setOutput] = useState('');
  const [currentTime, setCurrentTime] = useState('');

  useEffect(() => {
    const tick = () => setCurrentTime(new Date().toLocaleTimeString());
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, []);

  const parseTime = (t: string) => {
    const [h, m] = t.split(':').map(Number);
    return new Date(0, 0, 0, h, m);
  };

  const formatTime = (d: Date) => d.toTimeString().slice(0, 5);

  const generateSchedule = () => {
    let current = parseTime(start);
    const totalEvents = Array(numSlots).fill('slot');
    if (numBreaks > 0) {
      const interval = Math.floor(numSlots / (numBreaks + 1));
      for (let i = 0; i < numBreaks; i++) {
        totalEvents.splice((i + 1) * interval + i, 0, 'break');
      }
    }

    const lunchTime = parseTime(lunchStart);
    let insertedLunch = false;
    const rows = [['Time', 'Event']];

    totalEvents.forEach((item, i) => {
      if (!insertedLunch && current >= lunchTime) {
        const lunchEnd = new Date(current.getTime() + lunchLength * 60000);
        rows.push([`${formatTime(current)} - ${formatTime(lunchEnd)}`, 'Lunch']);
        current = lunchEnd;
        insertedLunch = true;
      }

      const duration = item === 'slot' ? slotLength : breakLength;
      const end = new Date(current.getTime() + duration * 60000);
      const label = item === 'slot' ? `Slot ${i + 1}` : 'Break';
      rows.push([`${formatTime(current)} - ${formatTime(end)}`, label]);
      current = end;
    });

    if (!insertedLunch && current <= lunchTime) {
      const lunchEnd = new Date(current.getTime() + lunchLength * 60000);
      rows.push([`${formatTime(current)} - ${formatTime(lunchEnd)}`, 'Lunch']);
    }

    const table = rows.map(([t, e]) => `${t.padEnd(16)} | ${e}`).join('\n');
    setOutput(table);
  };

  return (
     <div className={styles.page}>
    <main className="main max-w-4xl w-full mx-auto">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center font-mono text-xs mb-4">
           <div>SCHEDULE MAKER [BETA]</div>
           <div>{currentTime}</div>
        </div>

        <header className="mb-10">
          <div className="flex items-start gap-4">
        
            <img
              src="/clock.svg"
              alt="Clock Icon"
             className="h-12 w-auto mt-[2px] shrink-0"
            />

            <h1 className="text-6xl font-semibold leading-none">HELLO, FRIEND</h1>
          </div>
          <p className="text-base leading-snug mt-6 max-w-xl">
            This tool generates editable time-blocked schedules for critiques, meetings, or personal planning.
            Enter your preferences below and click <span className="underline font-medium">Make My Schedule</span> to begin.
          </p>
        </header>

        <section className="bg-white rounded-xl shadow border border-vwAccent p-6 mb-10">
          <h2 className="text-xl font-semibold mb-2">SETUP</h2>
          <p className="text-sm font-mono mb-6">Adjust your schedule parameters below.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm font-mono">
            <label className="flex flex-col gap-1">Start Time<input type="time" className="border border-vwAccent p-2 rounded" value={start} onChange={(e) => setStart(e.target.value)} /></label>
            <label className="flex flex-col gap-1">End Time<input type="time" className="border border-vwAccent p-2 rounded" value={end} onChange={(e) => setEnd(e.target.value)} /></label>
            <label className="flex flex-col gap-1">Slot Duration (min)<input type="number" className="border border-vwAccent p-2 rounded" value={slotLength} onChange={(e) => setSlotLength(+e.target.value)} /></label>
            <label className="flex flex-col gap-1">Number of Slots<input type="number" className="border border-vwAccent p-2 rounded" value={numSlots} onChange={(e) => setNumSlots(+e.target.value)} /></label>
            <label className="flex flex-col gap-1">Number of Breaks<input type="number" className="border border-vwAccent p-2 rounded" value={numBreaks} onChange={(e) => setNumBreaks(+e.target.value)} /></label>
            <label className="flex flex-col gap-1">Break Duration (min)<input type="number" className="border border-vwAccent p-2 rounded" value={breakLength} onChange={(e) => setBreakLength(+e.target.value)} /></label>
            <label className="flex flex-col gap-1">Lunch Start Time<input type="time" className="border border-vwAccent p-2 rounded" value={lunchStart} onChange={(e) => setLunchStart(e.target.value)} /></label>
            <label className="flex flex-col gap-1">Lunch Duration (min)<input type="number" className="border border-vwAccent p-2 rounded" value={lunchLength} onChange={(e) => setLunchLength(+e.target.value)} /></label>
          </div>
          <button onClick={generateSchedule} className="mt-6 border-2 border-vwRed text-vwRed px-6 py-3 hover:bg-vwRed hover:text-vwBg font-bold text-sm uppercase transition-colors">MAKE MY SCHEDULE</button>
        </section>

        {output && (
          <section className="bg-white rounded-xl shadow border border-vwAccent p-6 mb-10">
            <h2 className="text-xl font-semibold mb-4 font-mono">SCHEDULE</h2>
            <div className="grid grid-cols-2 text-sm font-mono border border-vwAccent rounded">
              {output.split('\n').map((line, i) => {
                const [time, event] = line.split('|');
                return (
                  <div key={i} className={`p-2 border-b border-vwAccent ${i === 0 ? 'font-bold bg-vwBg' : ''}`}>{time.trim()}</div>
                ) && (
                  <div key={i + 'e'} className={`p-2 border-b border-vwAccent ${i === 0 ? 'font-bold bg-vwBg' : ''}`}>{event.trim()}</div>
                );
              })}
            </div>
          </section>
        )}

        <footer className="text-center font-mono text-xs text-vwRed mt-16 mb-4">
          Built with care by{' '}
          <a href="https://eliferezhenderson.cardd.co/" className="underline hover:text-vwRed" target="_blank" rel="noopener noreferrer">
            Elif Erez-Henderson
          </a>
        </footer>
      </div>
    </main>
  );
</div>)}