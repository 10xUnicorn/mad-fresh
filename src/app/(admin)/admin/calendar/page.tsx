'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  X,
  Trash2,
  CalendarDays,
  Clock,
  MapPin,
  User,
  Filter,
  Loader2,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

// ── Types ──────────────────────────────────────────────
interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  event_type: string;
  start_date: string;
  start_time?: string;
  end_date?: string;
  end_time?: string;
  all_day: boolean;
  location?: string;
  assigned_to_name?: string;
  color: string;
  priority: string;
  status: string;
  notes?: string;
  tags?: string[];
}

type ViewType = 'month' | 'week' | 'day';

const SOURCE_CONFIG: Record<string, { color: string; label: string; emoji: string }> = {
  event:           { color: '#22c55e', label: 'Events',        emoji: '🎉' },
  task:            { color: '#3b82f6', label: 'Tasks',         emoji: '✅' },
  deadline:        { color: '#eab308', label: 'Deadlines',     emoji: '⏰' },
  proposal:        { color: '#f59e0b', label: 'Proposals',     emoji: '📋' },
  payment:         { color: '#ef4444', label: 'Payments',      emoji: '💰' },
  driver_schedule: { color: '#8b5cf6', label: 'Drivers',       emoji: '🚗' },
  team_schedule:   { color: '#06b6d4', label: 'Team',          emoji: '👥' },
  subscription:    { color: '#f97316', label: 'Subscriptions', emoji: '🔄' },
};

const PRIORITY_STYLES: Record<string, string> = {
  low:    'bg-gray-100 text-[#9a9080]',
  medium: 'bg-blue-50 text-blue-700',
  high:   'bg-amber-50 text-amber-700',
  urgent: 'bg-red-50 text-red-700',
};

const STORE_ID = 'b0000000-0000-0000-0000-000000000001';
const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const DAY_NAMES_SHORT = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

// ── Helpers ────────────────────────────────────────────
function formatTime(t?: string) {
  if (!t) return '';
  const [h, m] = t.split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${ampm}`;
}

function toDateStr(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

// ── Component ──────────────────────────────────────────
export default function CalendarPage() {
  const supabase = createClient();

  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<ViewType>('month');
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [enabledTypes, setEnabledTypes] = useState<Record<string, boolean>>(
    Object.fromEntries(Object.keys(SOURCE_CONFIG).map((k) => [k, true]))
  );
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    title: '', description: '', event_type: 'task',
    start_date: toDateStr(new Date()), start_time: '09:00',
    end_date: '', end_time: '17:00', all_day: false,
    location: '', assigned_to_name: '', color: '#75F663',
    priority: 'medium', status: 'scheduled', notes: '',
  });

  // ── Data fetching ──
  useEffect(() => { fetchEvents(); }, []);

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const { data } = await supabase
        .from('calendar_events')
        .select('*')
        .eq('store_id', STORE_ID)
        .order('start_date');
      if (data) setEvents(data);
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  // ── Filtered events ──
  const filteredEvents = useMemo(
    () => events.filter((e) => enabledTypes[e.event_type] !== false),
    [events, enabledTypes]
  );

  // ── Type counts ──
  const typeCounts = useMemo(() => {
    const c: Record<string, number> = {};
    events.forEach((e) => { c[e.event_type] = (c[e.event_type] || 0) + 1; });
    return c;
  }, [events]);

  // ── Calendar math ──
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay = new Date(year, month, 1).getDay();
  const todayStr = toDateStr(new Date());

  const monthLabel = currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  const getDayEvents = (day: number) => {
    const ds = toDateStr(new Date(year, month, day));
    return filteredEvents.filter(
      (e) => e.start_date === ds || (e.end_date && e.end_date >= ds && e.start_date <= ds)
    );
  };

  // ── Navigation ──
  const prev = () => setCurrentDate(new Date(year, month - 1));
  const next = () => setCurrentDate(new Date(year, month + 1));
  const goToday = () => setCurrentDate(new Date());

  // ── CRUD ──
  const resetForm = () => {
    setFormData({
      title: '', description: '', event_type: 'task',
      start_date: toDateStr(new Date()), start_time: '09:00',
      end_date: '', end_time: '17:00', all_day: false,
      location: '', assigned_to_name: '', color: '#75F663',
      priority: 'medium', status: 'scheduled', notes: '',
    });
    setEditingEvent(null);
  };

  const openAdd = (dateStr?: string) => {
    resetForm();
    if (dateStr) setFormData((p) => ({ ...p, start_date: dateStr }));
    setShowModal(true);
  };

  const openEdit = (ev: CalendarEvent) => {
    setEditingEvent(ev);
    setFormData({
      title: ev.title, description: ev.description || '',
      event_type: ev.event_type, start_date: ev.start_date,
      start_time: ev.start_time || '09:00',
      end_date: ev.end_date || ev.start_date,
      end_time: ev.end_time || '17:00', all_day: ev.all_day,
      location: ev.location || '', assigned_to_name: ev.assigned_to_name || '',
      color: ev.color, priority: ev.priority, status: ev.status,
      notes: ev.notes || '',
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!formData.title.trim()) return;
    setSaving(true);
    try {
      const payload = {
        store_id: STORE_ID, title: formData.title,
        description: formData.description || null,
        event_type: formData.event_type, start_date: formData.start_date,
        start_time: formData.all_day ? null : formData.start_time,
        end_date: formData.end_date || formData.start_date,
        end_time: formData.all_day ? null : formData.end_time,
        all_day: formData.all_day, location: formData.location || null,
        assigned_to_name: formData.assigned_to_name || null,
        color: formData.color, priority: formData.priority,
        status: formData.status, notes: formData.notes || null,
      };

      if (editingEvent) {
        await supabase.from('calendar_events').update(payload).eq('id', editingEvent.id);
      } else {
        await supabase.from('calendar_events').insert([payload]);
      }
      resetForm();
      setShowModal(false);
      fetchEvents();
    } catch (err) {
      console.error('Error saving:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this event?')) return;
    await supabase.from('calendar_events').delete().eq('id', id);
    setShowModal(false);
    resetForm();
    fetchEvents();
  };

  const set = (key: string, val: string | boolean) => setFormData((p) => ({ ...p, [key]: val }));

  // ── Render helpers ──
  const EventPill = ({ ev, compact }: { ev: CalendarEvent; compact?: boolean }) => (
    <button
      onClick={(e) => { e.stopPropagation(); openEdit(ev); }}
      className={`w-full text-left rounded-md font-medium truncate transition-all hover:brightness-110 ${
        ev.status === 'cancelled' ? 'opacity-40 line-through' : ''
      } ${compact ? 'px-1 py-0.5 text-[10px]' : 'px-2 py-1 text-xs'}`}
      style={{ backgroundColor: ev.color + '25', color: ev.color, borderLeft: `3px solid ${ev.color}` }}
      title={ev.title}
    >
      {compact ? ev.title.slice(0, 8) : ev.title}
    </button>
  );

  // ── Selected day events ──
  const selectedDayEvents = selectedDay
    ? filteredEvents.filter(
        (e) => e.start_date === selectedDay || (e.end_date && e.end_date >= selectedDay && e.start_date <= selectedDay)
      )
    : [];

  // ── RENDER ───────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* ─── Header ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-[#1e2d18] flex items-center gap-3">
            <CalendarDays size={28} className="text-[#3d6b2a]" />
            Calendar
          </h1>
          <p className="text-[#7a7060] text-sm mt-1">Events, deadlines, schedules & tasks</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => openAdd()}
            className="flex items-center gap-2 bg-[#3d6b2a] hover:bg-[#2f5720] text-white px-4 py-2.5 rounded-xl font-semibold text-sm transition min-h-[44px]"
          >
            <Plus size={18} /> Add Event
          </button>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm transition min-h-[44px] ${
              showFilters
                ? 'bg-[#e9f0e4] text-[#3d6b2a] border border-[#3d6b2a]/30'
                : 'bg-[#f2efe8] text-[#4a5e3a] border border-[#ddd8cc] hover:bg-[#f0ece3]'
            }`}
          >
            <Filter size={16} /> Filters
          </button>
        </div>
      </div>

      {/* ─── Filter Chips ─── */}
      {showFilters && (
        <div className="bg-[#f2efe8] border border-[#ddd8cc] rounded-2xl p-4">
          <div className="flex flex-wrap gap-2">
            {Object.entries(SOURCE_CONFIG).map(([type, cfg]) => {
              const on = enabledTypes[type] !== false;
              return (
                <button
                  key={type}
                  onClick={() => setEnabledTypes((p) => ({ ...p, [type]: !on }))}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold transition min-h-[36px] ${
                    on
                      ? 'text-white border'
                      : 'text-[#9a9080] bg-[#f2efe8] border border-[#ddd8cc]'
                  }`}
                  style={on ? { backgroundColor: cfg.color + '20', borderColor: cfg.color + '50', color: cfg.color } : {}}
                >
                  <span>{cfg.emoji}</span>
                  {cfg.label}
                  <span className="opacity-60">{typeCounts[type] || 0}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ─── Calendar Card ─── */}
      <div className="bg-white rounded-2xl overflow-hidden shadow-sm">
        {/* Controls bar */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <button onClick={prev} className="p-2 hover:bg-gray-100 rounded-lg transition min-h-[44px] min-w-[44px] flex items-center justify-center">
              <ChevronLeft size={20} className="text-[#9a9080]" />
            </button>
            <h2 className="text-lg sm:text-xl font-bold text-gray-900 min-w-[180px] text-center">{monthLabel}</h2>
            <button onClick={next} className="p-2 hover:bg-gray-100 rounded-lg transition min-h-[44px] min-w-[44px] flex items-center justify-center">
              <ChevronRight size={20} className="text-[#9a9080]" />
            </button>
            <button onClick={goToday} className="hidden sm:block ml-2 px-3 py-1.5 text-xs font-semibold text-[#3d6b2a] bg-[#3d6b2a]/10 hover:bg-[#3d6b2a]/20 rounded-lg transition">
              Today
            </button>
          </div>

          {/* View toggle */}
          <div className="flex bg-gray-100 rounded-lg p-0.5">
            {(['month', 'week', 'day'] as ViewType[]).map((v) => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition ${
                  view === v
                    ? 'bg-[#3d6b2a] text-white shadow-sm'
                    : 'text-[#9a9080] hover:text-gray-700'
                }`}
              >
                {v.charAt(0).toUpperCase() + v.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-32">
            <Loader2 size={32} className="text-[#3d6b2a] animate-spin" />
          </div>
        ) : (
          <>
            {/* ─── MONTH VIEW ─── */}
            {view === 'month' && (
              <div className="overflow-x-auto">
                {/* Day headers */}
                <div className="grid grid-cols-7 border-b border-gray-100">
                  {DAY_NAMES.map((d, i) => (
                    <div key={d} className="py-3 text-center">
                      <span className="hidden sm:inline text-xs font-semibold text-[#9a9080] uppercase tracking-wider">{d}</span>
                      <span className="sm:hidden text-xs font-semibold text-[#9a9080]">{DAY_NAMES_SHORT[i]}</span>
                    </div>
                  ))}
                </div>

                {/* Grid */}
                <div className="grid grid-cols-7">
                  {/* Leading empties */}
                  {Array.from({ length: firstDay }).map((_, i) => (
                    <div key={`e-${i}`} className="min-h-[80px] sm:min-h-[110px] bg-gray-50/50 border-b border-r border-gray-100" />
                  ))}

                  {/* Days */}
                  {Array.from({ length: daysInMonth }).map((_, i) => {
                    const day = i + 1;
                    const ds = toDateStr(new Date(year, month, day));
                    const dayEvs = getDayEvents(day);
                    const isToday = ds === todayStr;
                    const isSelected = ds === selectedDay;
                    const isWeekend = (firstDay + i) % 7 === 0 || (firstDay + i) % 7 === 6;

                    return (
                      <div
                        key={day}
                        onClick={() => setSelectedDay(ds === selectedDay ? null : ds)}
                        className={`min-h-[80px] sm:min-h-[110px] p-1 sm:p-2 border-b border-r border-gray-100 cursor-pointer transition-colors ${
                          isSelected
                            ? 'bg-[#e9f0e4] ring-2 ring-inset ring-[#3d6b2a]/40'
                            : isToday
                              ? 'bg-green-50/80'
                              : isWeekend
                                ? 'bg-gray-50/40 hover:bg-gray-50'
                                : 'hover:bg-gray-50/60'
                        }`}
                      >
                        <div className={`text-xs sm:text-sm font-bold mb-1 flex items-center justify-center sm:justify-start ${
                          isToday ? '' : 'text-gray-700'
                        }`}>
                          <span className={`${
                            isToday
                              ? 'w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-[#3d6b2a] text-white flex items-center justify-center text-xs'
                              : ''
                          }`}>
                            {day}
                          </span>
                        </div>
                        <div className="space-y-0.5 overflow-hidden">
                          {/* Desktop: show event pills */}
                          <div className="hidden sm:block space-y-0.5">
                            {dayEvs.slice(0, 3).map((ev) => (
                              <EventPill key={ev.id} ev={ev} />
                            ))}
                            {dayEvs.length > 3 && (
                              <span className="text-[10px] text-[#7a7060] pl-1">+{dayEvs.length - 3} more</span>
                            )}
                          </div>
                          {/* Mobile: show dots */}
                          <div className="sm:hidden flex flex-wrap gap-0.5 justify-center mt-1">
                            {dayEvs.slice(0, 4).map((ev) => (
                              <div
                                key={ev.id}
                                className="w-1.5 h-1.5 rounded-full"
                                style={{ backgroundColor: ev.color }}
                              />
                            ))}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ─── WEEK VIEW ─── */}
            {view === 'week' && (
              <div className="divide-y divide-gray-100">
                {Array.from({ length: 7 }).map((_, i) => {
                  const d = new Date(currentDate);
                  d.setDate(d.getDate() - d.getDay() + i);
                  const ds = toDateStr(d);
                  const dayEvs = filteredEvents.filter(
                    (e) => e.start_date === ds || (e.end_date && e.end_date >= ds && e.start_date <= ds)
                  );
                  const isToday = ds === todayStr;

                  return (
                    <div key={ds} className={`flex gap-4 p-4 sm:p-5 ${isToday ? 'bg-green-50/50' : 'hover:bg-gray-50/50'}`}>
                      <div className="w-16 sm:w-20 flex-shrink-0 text-center">
                        <p className="text-xs text-[#7a7060] uppercase">{d.toLocaleDateString('en-US', { weekday: 'short' })}</p>
                        <p className={`text-2xl font-black ${isToday ? 'text-[#3d6b2a]' : 'text-gray-900'}`}>{d.getDate()}</p>
                      </div>
                      <div className="flex-1 space-y-1.5 min-w-0">
                        {dayEvs.length > 0 ? dayEvs.map((ev) => (
                          <button
                            key={ev.id}
                            onClick={() => openEdit(ev)}
                            className="w-full text-left flex items-center gap-3 px-3 py-2 rounded-lg transition hover:shadow-sm"
                            style={{ backgroundColor: ev.color + '12', borderLeft: `3px solid ${ev.color}` }}
                          >
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-semibold text-gray-900 truncate">{ev.title}</p>
                              {ev.start_time && (
                                <p className="text-xs text-[#9a9080]">{formatTime(ev.start_time)}{ev.end_time ? ` – ${formatTime(ev.end_time)}` : ''}</p>
                              )}
                            </div>
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ backgroundColor: ev.color + '20', color: ev.color }}>
                              {SOURCE_CONFIG[ev.event_type]?.label || ev.event_type}
                            </span>
                          </button>
                        )) : (
                          <p className="text-sm text-[#7a7060] py-2">No events</p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* ─── DAY VIEW ─── */}
            {view === 'day' && (() => {
              const ds = toDateStr(currentDate);
              const dayEvs = filteredEvents
                .filter((e) => e.start_date === ds || (e.end_date && e.end_date >= ds && e.start_date <= ds))
                .sort((a, b) => (a.start_time || '00:00').localeCompare(b.start_time || '00:00'));

              return (
                <div className="p-4 sm:p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-bold text-gray-900">
                      {currentDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                    </h3>
                    <button
                      onClick={() => openAdd(ds)}
                      className="text-xs font-semibold text-[#3d6b2a] hover:underline flex items-center gap-1"
                    >
                      <Plus size={14} /> Add
                    </button>
                  </div>

                  {dayEvs.length > 0 ? (
                    <div className="space-y-3">
                      {dayEvs.map((ev) => (
                        <button
                          key={ev.id}
                          onClick={() => openEdit(ev)}
                          className="w-full text-left p-4 rounded-xl hover:shadow-md transition-shadow"
                          style={{ backgroundColor: ev.color + '08', borderLeft: `4px solid ${ev.color}` }}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <p className="font-bold text-gray-900 text-base">{ev.title}</p>
                              <div className="flex flex-wrap gap-3 mt-2 text-xs text-[#9a9080]">
                                {ev.start_time && (
                                  <span className="flex items-center gap-1"><Clock size={12} />{formatTime(ev.start_time)}{ev.end_time ? ` – ${formatTime(ev.end_time)}` : ''}</span>
                                )}
                                {ev.location && <span className="flex items-center gap-1"><MapPin size={12} />{ev.location}</span>}
                                {ev.assigned_to_name && <span className="flex items-center gap-1"><User size={12} />{ev.assigned_to_name}</span>}
                              </div>
                              {ev.description && <p className="text-sm text-[#9a9080] mt-2 line-clamp-2">{ev.description}</p>}
                            </div>
                            <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: ev.color + '20', color: ev.color }}>
                                {SOURCE_CONFIG[ev.event_type]?.emoji} {SOURCE_CONFIG[ev.event_type]?.label || ev.event_type}
                              </span>
                              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${PRIORITY_STYLES[ev.priority] || ''}`}>
                                {ev.priority}
                              </span>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-16">
                      <CalendarDays size={40} className="text-[#4a5e3a] mx-auto mb-3" />
                      <p className="text-[#7a7060] text-sm">Nothing scheduled</p>
                      <button onClick={() => openAdd(ds)} className="mt-3 text-sm font-semibold text-[#3d6b2a] hover:underline">
                        Add an event
                      </button>
                    </div>
                  )}
                </div>
              );
            })()}
          </>
        )}
      </div>

      {/* ─── Selected Day Detail (below calendar on mobile) ─── */}
      {selectedDay && view === 'month' && (
        <div className="bg-[#f2efe8] border border-[#ddd8cc] rounded-2xl p-4 sm:p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-[#1e2d18] font-bold text-sm">
              {new Date(selectedDay + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            </h3>
            <div className="flex gap-2">
              <button onClick={() => openAdd(selectedDay)} className="text-xs font-semibold text-[#3d6b2a] hover:underline flex items-center gap-1">
                <Plus size={14} /> Add
              </button>
              <button onClick={() => setSelectedDay(null)} className="text-[#9a9080] hover:text-[#1e2d18]"><X size={16} /></button>
            </div>
          </div>
          {selectedDayEvents.length > 0 ? (
            <div className="space-y-2">
              {selectedDayEvents.map((ev) => (
                <button
                  key={ev.id}
                  onClick={() => openEdit(ev)}
                  className="w-full text-left flex items-center gap-3 px-3 py-2.5 rounded-xl bg-white hover:bg-[#f0ece3] transition"
                >
                  <div className="w-2 h-8 rounded-full flex-shrink-0" style={{ backgroundColor: ev.color }} />
                  <div className="min-w-0 flex-1">
                    <p className="text-[#1e2d18] text-sm font-semibold truncate">{ev.title}</p>
                    <p className="text-[#7a7060] text-xs">{ev.all_day ? 'All day' : formatTime(ev.start_time)}{ev.location ? ` · ${ev.location}` : ''}</p>
                  </div>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ backgroundColor: ev.color + '20', color: ev.color }}>
                    {SOURCE_CONFIG[ev.event_type]?.emoji}
                  </span>
                </button>
              ))}
            </div>
          ) : (
            <p className="text-[#9a9080] text-sm">No events this day</p>
          )}
        </div>
      )}

      {/* ─── Add/Edit Modal ─── */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center" onClick={() => { setShowModal(false); resetForm(); }}>
          <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" />
          <div
            className="relative w-full sm:max-w-xl sm:mx-4 max-h-[92vh] bg-white rounded-t-2xl sm:rounded-2xl overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 bg-white flex-shrink-0">
              <h2 className="text-lg font-bold text-gray-900">{editingEvent ? 'Edit Event' : 'New Event'}</h2>
              <button onClick={() => { setShowModal(false); resetForm(); }} className="p-2 hover:bg-gray-100 rounded-lg transition">
                <X size={20} className="text-[#9a9080]" />
              </button>
            </div>

            {/* Modal body */}
            <div className="flex-1 overflow-y-auto p-5 space-y-5">
              {/* Title */}
              <input
                type="text"
                value={formData.title}
                onChange={(e) => set('title', e.target.value)}
                placeholder="Event title *"
                className="w-full text-lg font-semibold text-gray-900 placeholder-gray-400 border-0 border-b-2 border-gray-200 focus:border-[#3d6b2a] focus:ring-0 pb-2 outline-none text-base"
                autoFocus
              />

              {/* Type + Priority row */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#9a9080] uppercase tracking-wider mb-1.5">Type</label>
                  <select value={formData.event_type} onChange={(e) => set('event_type', e.target.value)} className="w-full text-base px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[#3d6b2a]/30 focus:border-[#3d6b2a]">
                    {Object.entries(SOURCE_CONFIG).map(([k, v]) => (
                      <option key={k} value={k}>{v.emoji} {v.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#9a9080] uppercase tracking-wider mb-1.5">Priority</label>
                  <select value={formData.priority} onChange={(e) => set('priority', e.target.value)} className="w-full text-base px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[#3d6b2a]/30 focus:border-[#3d6b2a]">
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">🔴 Urgent</option>
                  </select>
                </div>
              </div>

              {/* All day toggle */}
              <label className="flex items-center gap-3 cursor-pointer">
                <div className={`w-10 h-6 rounded-full transition-colors flex items-center ${formData.all_day ? 'bg-[#3d6b2a] justify-end' : 'bg-gray-200 justify-start'}`} onClick={() => set('all_day', !formData.all_day)}>
                  <div className="w-5 h-5 bg-white rounded-full shadow mx-0.5" />
                </div>
                <span className="text-sm font-medium text-gray-700">All day</span>
              </label>

              {/* Date/Time */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#9a9080] uppercase tracking-wider mb-1.5">Start Date</label>
                  <input type="date" value={formData.start_date} onChange={(e) => set('start_date', e.target.value)} className="w-full text-base px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[#3d6b2a]/30 focus:border-[#3d6b2a]" />
                </div>
                {!formData.all_day && (
                  <div>
                    <label className="block text-xs font-semibold text-[#9a9080] uppercase tracking-wider mb-1.5">Start Time</label>
                    <input type="time" value={formData.start_time} onChange={(e) => set('start_time', e.target.value)} className="w-full text-base px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[#3d6b2a]/30 focus:border-[#3d6b2a]" />
                  </div>
                )}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#9a9080] uppercase tracking-wider mb-1.5">End Date</label>
                  <input type="date" value={formData.end_date} onChange={(e) => set('end_date', e.target.value)} className="w-full text-base px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[#3d6b2a]/30 focus:border-[#3d6b2a]" />
                </div>
                {!formData.all_day && (
                  <div>
                    <label className="block text-xs font-semibold text-[#9a9080] uppercase tracking-wider mb-1.5">End Time</label>
                    <input type="time" value={formData.end_time} onChange={(e) => set('end_time', e.target.value)} className="w-full text-base px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[#3d6b2a]/30 focus:border-[#3d6b2a]" />
                  </div>
                )}
              </div>

              {/* Location + Assigned */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#9a9080] uppercase tracking-wider mb-1.5">Location</label>
                  <input type="text" value={formData.location} onChange={(e) => set('location', e.target.value)} placeholder="Where" className="w-full text-base px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[#3d6b2a]/30 focus:border-[#3d6b2a]" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#9a9080] uppercase tracking-wider mb-1.5">Assigned To</label>
                  <input type="text" value={formData.assigned_to_name} onChange={(e) => set('assigned_to_name', e.target.value)} placeholder="Team member" className="w-full text-base px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[#3d6b2a]/30 focus:border-[#3d6b2a]" />
                </div>
              </div>

              {/* Status */}
              <div>
                <label className="block text-xs font-semibold text-[#9a9080] uppercase tracking-wider mb-1.5">Status</label>
                <select value={formData.status} onChange={(e) => set('status', e.target.value)} className="w-full text-base px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[#3d6b2a]/30 focus:border-[#3d6b2a]">
                  <option value="scheduled">Scheduled</option>
                  <option value="in_progress">In Progress</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>

              {/* Color */}
              <div>
                <label className="block text-xs font-semibold text-[#9a9080] uppercase tracking-wider mb-1.5">Color</label>
                <div className="flex gap-2 flex-wrap">
                  {Object.values(SOURCE_CONFIG).map((cfg) => (
                    <button
                      key={cfg.color}
                      onClick={() => set('color', cfg.color)}
                      className={`w-8 h-8 rounded-full transition ${formData.color === cfg.color ? 'ring-2 ring-offset-2 ring-gray-400 scale-110' : 'hover:scale-105'}`}
                      style={{ backgroundColor: cfg.color }}
                      title={cfg.label}
                    />
                  ))}
                  <button
                    onClick={() => set('color', '#75F663')}
                    className={`w-8 h-8 rounded-full transition ${formData.color === '#75F663' ? 'ring-2 ring-offset-2 ring-gray-400 scale-110' : 'hover:scale-105'}`}
                    style={{ backgroundColor: '#75F663' }}
                    title="Mad Fresh Green"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-semibold text-[#9a9080] uppercase tracking-wider mb-1.5">Description</label>
                <textarea value={formData.description} onChange={(e) => set('description', e.target.value)} placeholder="Details..." rows={2} className="w-full text-base px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[#3d6b2a]/30 focus:border-[#3d6b2a] resize-none" />
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-semibold text-[#9a9080] uppercase tracking-wider mb-1.5">Notes</label>
                <textarea value={formData.notes} onChange={(e) => set('notes', e.target.value)} placeholder="Internal notes..." rows={2} className="w-full text-base px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[#3d6b2a]/30 focus:border-[#3d6b2a] resize-none" />
              </div>
            </div>

            {/* Modal footer */}
            <div className="flex items-center justify-between px-5 py-4 border-t border-gray-100 bg-gray-50 flex-shrink-0">
              <div>
                {editingEvent && (
                  <button
                    onClick={() => handleDelete(editingEvent.id)}
                    className="flex items-center gap-1.5 text-sm font-semibold text-red-500 hover:text-red-600 transition min-h-[44px]"
                  >
                    <Trash2 size={16} /> Delete
                  </button>
                )}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => { setShowModal(false); resetForm(); }}
                  className="px-4 py-2.5 text-sm font-semibold text-[#9a9080] hover:bg-gray-100 rounded-xl transition min-h-[44px]"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving || !formData.title.trim()}
                  className="px-5 py-2.5 text-sm font-bold bg-[#3d6b2a] hover:bg-[#2f5720] text-white rounded-xl transition disabled:opacity-50 flex items-center gap-2 min-h-[44px]"
                >
                  {saving && <Loader2 size={16} className="animate-spin" />}
                  {editingEvent ? 'Update' : 'Create'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
