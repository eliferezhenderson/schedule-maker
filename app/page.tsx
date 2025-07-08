// app/page.tsx
'use client';

import { useEffect, useState } from 'react';
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult
} from '@hello-pangea/dnd';

type ScheduleRow = { id: string; name: string; time: string };

export default function HomePage() {
  // ─── form state ─────────────────────────────────────────────────────────────
  const [start, setStart] = useState('09:00');
  const [end, setEnd] = useState('17:00');
  const [numSlots, setNumSlots] = useState<number | ''>('');
  const [slotLength, setSlotLength] = useState<number | ''>('');
  const [numBreaks, setNumBreaks] = useState(2);
  const [breakLength, setBreakLength] = useState(10);
  const [includeLunch, setIncludeLunch] = useState(false);
  const [lunchStart, setLunchStart] = useState('12:30');
  const [lunchLength, setLunchLength] = useState(60);

  const [schedule, setSchedule] = useState<ScheduleRow[]>([]);
  const [currentTime, setCurrentTime] = useState('');

  // ─── live clock ─────────────────────────────────────────────────────────────
  useEffect(() => {
    const tick = () => {
      const now = new Date();
      const hh = now.getHours().toString().padStart(2, '0');
      const mm = now.getMinutes().toString().padStart(2, '0');
      const ss = now.getSeconds().toString().padStart(2, '0');
      setCurrentTime(`${hh}:${mm}:${ss}`);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  // ─── core time helpers ───────────────────────────────────────────────────────
  const toMins = (t: string) => {
    const [h, m] = t.split(':').map(Number);
    return h * 60 + m;
  };
  const fromMins = (m: number) => {
    const hh = Math.floor(m / 60);
    const mm = m % 60;
    return `${hh.toString().padStart(2, '0')}:${mm.toString().padStart(2, '0')}`;
  };

  // ─── generate schedule ──────────────────────────────────────────────────────
  const generateSchedule = () => {
    const startM = toMins(start);
    const endM = toMins(end);
    const lunchM = toMins(lunchStart);

    // total free minutes (excluding lunch + breaks)
    const totalAvailable =
      endM - startM - (includeLunch ? lunchLength : 0) - numBreaks * breakLength;

    // decide slots vs length
    let slots = numSlots || 0;
    let len = (slotLength as number) || 0;
    if ((!len || len <= 0) && slots) {
      len = Math.floor(totalAvailable / slots);
    } else if ((!slots || slots <= 0) && len) {
      slots = Math.floor(totalAvailable / len);
    }
    if (!slots || !len) return;

    // build per-slot lengths with remainder distribution
    const base = Math.floor(totalAvailable / slots);
    const rem = totalAvailable - base * slots;
    const slotLens = Array.from({ length: slots }, (_, i) =>
      i < rem ? base + 1 : base
    );

    // output rows
    const out: ScheduleRow[] = [];
    let cursor = startM;
    let usedBreakBefore = 0,
      usedBreakAfter = 0;
    const breaksBefore = Math.floor(numBreaks / 2);
    const breaksAfter = numBreaks - breaksBefore;
    const interval = (n: number, b: number) => Math.ceil(n / (b + 1));

    // helper to push a slot (and split around lunch)
    function pushSlot(length: number, label: string, idx: number) {
      const slotStart = cursor;
      const slotEnd = cursor + length;

      if (includeLunch && slotStart < lunchM && lunchM < slotEnd) {
        out.push({
          id: `${label}-pre`,
          name: label,
          time: `${fromMins(slotStart)} – ${fromMins(lunchM)}`,
        });
        out.push({
          id: 'lunch',
          name: 'Lunch',
          time: `${fromMins(lunchM)} – ${fromMins(lunchM + lunchLength)}`,
        });
        out.push({
          id: `${label}-post`,
          name: label,
          time: `${fromMins(lunchM + lunchLength)} – ${fromMins(
            slotEnd + lunchLength
          )}`,
        });
        cursor = slotEnd + lunchLength;
      } else {
        out.push({
          id: label,
          name: label,
          time: `${fromMins(slotStart)} – ${fromMins(slotEnd)}`,
        });
        cursor = slotEnd;
      }

      // break logic
      const beforeLunch = cursor <= (includeLunch ? lunchM : endM);
      if (beforeLunch) {
        if (
          usedBreakBefore < breaksBefore &&
          (idx + 1) % interval(slots, breaksBefore) === 0
        ) {
          const bS = cursor;
          const bE = bS + breakLength;
          out.push({
            id: `break-before-${idx}`,
            name: 'Break',
            time: `${fromMins(bS)} – ${fromMins(bE)}`,
          });
          cursor = bE;
          usedBreakBefore++;
        }
      } else {
        if (
          usedBreakAfter < breaksAfter &&
          (idx + 1 - Math.ceil(slots / 2)) %
            interval(Math.ceil(slots / 2), breaksAfter) ===
            0
        ) {
          const bS = cursor;
          const bE = bS + breakLength;
          out.push({
            id: `break-after-${idx}`,
            name: 'Break',
            time: `${fromMins(bS)} – ${fromMins(bE)}`,
          });
          cursor = bE;
          usedBreakAfter++;
        }
      }
    }

    // build each slot
    slotLens.forEach((L, i) => pushSlot(L, `Slot ${i + 1}`, i));

    // ensure lunch if never inserted
    if (includeLunch && !out.find((r) => r.id === 'lunch')) {
      out.splice(
        Math.floor(out.length / 2),
        0,
        {
          id: 'lunch',
          name: 'Lunch',
          time: `${fromMins(lunchM)} – ${fromMins(lunchM + lunchLength)}`,
        }
      );
    }

    // snap last slot to end
    for (let i = out.length - 1; i >= 0; i--) {
      if (out[i].name.startsWith('Slot')) {
        const [s] = out[i].time.split(' – ');
        out[i].time = `${s} – ${end}`;
        break;
      }
    }

    setSchedule(out);
  };

  // ─── drag/drop handler ───────────────────────────────────────────────────────
  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    const items = Array.from(schedule);
    const [moved] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, moved);

    const durations = items.map((r) => {
      const [st, en] = r.time.split(' – ');
      return toMins(en) - toMins(st);
    });
    let cursor = toMins(start);
    const updated = items.map((r, i) => {
      const en = cursor + durations[i];
      const rng = `${fromMins(cursor)} – ${fromMins(en)}`;
      cursor = en;
      return { ...r, time: rng };
    });
    setSchedule(updated);
  };

  // ─── render ─────────────────────────────────────────────────────────────────
  return (
    <main className="min-h-screen bg-vwBg bg-grain bg-repeat text-vwRed font-caslon p-8 tracking-tight">
      <div className="max-w-4xl mx-auto">
        {/* top bar */}
        <div className="flex justify-between items-center font-mono text-xs mb-4">
          <div>SCHEDULE-MAKER [BETA]</div>
          <div>{currentTime}</div>
        </div>

        {/* header with icon & title */}
        <header className="mb-10">
          <div className="flex items-start gap-4">
            <img
              src="/clock.svg"
              alt="Clock Icon"
              className="w-14 h-14 object-contain flex-none mt-[5px]"
            />
            <h1 className="text-6xl font-semibold leading-none">SLICE THE TIME</h1>
          </div>
          <p className="text-lg leading-snug mt-8 max-w-4xl">
            This tool generates editable time-blocked schedules for critiques, meetings, or personal planning. Enter your preferences below and click Make My Schedule to begin. Play around and regenerate until you have a schedule that works for you. 
          </p>
        </header>

        {/* OUTPUT above */}
        {schedule.length > 0 && (
          <section className="bg-white p-6 rounded shadow mb-10">
            <h2 className="text-2xl font-medium mb-2">Your Schedule</h2>
            <p className="text-sm font-mono italic mb-4">
              Drag and drop the time slots to reorder. Edit names by clicking in.
            </p>
            <DragDropContext onDragEnd={handleDragEnd}>
              <Droppable droppableId="schedule">
                {(provided) => (
                  <div
                    {...provided.droppableProps}
                    ref={provided.innerRef}
                    className="space-y-2"
                  >
                    {schedule.map((row, i) => (
                      <Draggable
                        key={row.id}
                        draggableId={row.id}
                        index={i}
                      >
                        {(prov) => (
                          <div
                            ref={prov.innerRef}
                            {...prov.draggableProps}
                            {...prov.dragHandleProps}
                            className="grid grid-cols-[auto,1fr] gap-x-3 items-center p-1"
                          >
                            <div className="font-mono text-sm">
                              {row.time}
                            </div>
                            <input
                              type="text"
                              defaultValue={row.name}
                              className="w-full bg-transparent border-b border-vwAccent focus:border-vwRed outline-none font-medium text-sm"
                            />
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </DragDropContext>
          </section>
        )}

        {/* setup */}
        <section className="bg-white p-6 rounded shadow mb-10">
          <h2 className="text-2xl font-medium mb-2">SETUP</h2>
          <p className="text-lg mb-4">Adjust your schedule parameters below.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 gap-6">
            <label className="flex flex-col gap-1 text-sm">
              Start Time
              <input
                type="time"
                value={start}
                onChange={e => setStart(e.target.value)}
                className="border border-vwAccent p-2 rounded focus:border-vwRed"/>
            </label>
            <label className="flex flex-col gap-1 text-sm">
              End Time
              <input
                type="time"
                value={end}
                onChange={e => setEnd(e.target.value)}
                className="border border-vwAccent p-2 rounded focus:border-vwRed"/>
            </label>
             
             <label className="flex flex-col gap-1 text-sm border-2 border-vwRed p-2 rounded">
              Number of Slots
              <input
                type="number"
                placeholder="e.g. 8"
                value={numSlots}
                onChange={e => setNumSlots(e.target.value === '' ? '' : +e.target.value)}
                className="border border-vwAccent p-2 rounded focus:border-vwRed"/>
            </label>

             <label className="flex flex-col gap-1 text-sm border-2 border-vwRed p-2 rounded">
              Slot Duration (min)
              <input
                type="number"
                placeholder="e.g. 30"
                value={slotLength}
                onChange={e => setSlotLength(e.target.value === '' ? '' : +e.target.value)}
                className="border border-vwAccent p-2 rounded focus:border-vwRed"/>
            </label>
            
           
            <div className="col-span-full text-s italic text-vwRed">Leave one of the two above blank to auto-calc.</div>
            <label className="flex flex-col gap-1 text-sm">
              Number of Breaks
              <input
                type="number"
                value={numBreaks}
                onChange={e => setNumBreaks(+e.target.value)}
                className="border border-vwAccent p-2 rounded focus:border-vwRed"/>
            </label>
            <label className="flex flex-col gap-1 text-sm">
              Break Duration (min)
              <input
                type="number"
                value={breakLength}
                onChange={e => setBreakLength(+e.target.value)}
                className="border border-vwAccent p-2 rounded focus:border-vwRed"/>
            </label>
             
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={includeLunch}
                onChange={e => setIncludeLunch(e.target.checked)}
                className="h-4 w-4"/>
              Add a lunch break?
            </label>
           <br />
            {includeLunch && (
              <>
                <label className="flex flex-col gap-1 text-sm">
                  Lunch Start Time
                  <input
                    type="time"
                    value={lunchStart}
                    onChange={e => setLunchStart(e.target.value)}
                    className="border border-vwAccent p-2 rounded focus:border-vwRed"/>
                </label>
                
                <label className="flex flex-col gap-1 text-sm">
                  Lunch Duration (min)
                  <input
                    type="number"
                    value={lunchLength}
                    onChange={e => setLunchLength(+e.target.value)}
                    className="border border-vwAccent p-2 rounded focus:border-vwRed"/>
                </label>
              </>
            )}
          </div>
          <button
            onClick={generateSchedule}
            className="mt-6 px-6 py-3 border border-vwRed rounded hover:bg-vwAccent"
          >MAKE MY SCHEDULE</button>
        </section>

        {/* footer */}
        <footer className="text-xs font-mono text-vwRed text-center mt-12">
          <a href="https://eliferezhenderson.cardd.co/" target="_blank" rel="noopener noreferrer">
            Built with care by Elif Erez-Henderson
          </a>
        </footer>
      </div>
    </main>
  );
}
