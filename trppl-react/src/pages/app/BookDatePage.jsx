// src/pages/app/BookDatePage.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Spinner } from '../../components/ui/Spinner';
import { FormField, Input, Textarea } from '../../components/ui/FormField';
import { bookingsApi, matchesApi } from '../../lib/api';
import { useAuthStore } from '../../store/authStore';
import { DATE_TYPES } from '../../lib/constants';

export default function BookDatePage() {
  const navigate = useNavigate();
  const user     = useAuthStore(s => s.user);

  const [trppl,    setTrppl]    = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [saving,   setSaving]   = useState(false);
  const [error,    setError]    = useState('');
  const [success,  setSuccess]  = useState('');
  const [dateType, setDateType] = useState('');
  const [date,     setDate]     = useState('');
  const [time,     setTime]     = useState('');
  const [location, setLocation] = useState('');
  const [message,  setMessage]  = useState('');
  const [errors,   setErrors]   = useState({});

  useEffect(() => { loadTrppl(); }, []);

  async function loadTrppl() {
    try {
      const { data } = await matchesApi.getTrppls();
      const win = (data.trppls || []).find(t => t.winner_id === user?.id && t.status === 'completed');
      setTrppl(win || null);
    } catch {
      setTrppl(null);
    } finally {
      setLoading(false);
    }
  }

  async function submit() {
    const errs = {};
    if (!dateType)   errs.dateType = 'Please select a date type.';
    if (!date)       errs.date     = 'Please pick a date.';
    if (!time)       errs.time     = 'Please pick a time.';
    if (date && time && new Date(date + 'T' + time) < new Date()) errs.date = 'Date must be in the future.';
    setErrors(errs);
    if (Object.keys(errs).length) return;

    setSaving(true); setError('');
    try {
      await bookingsApi.create({
        trpplId:      trppl?.id,
        dateType, proposedDate: date, proposedTime: time,
        location:  location || undefined,
        message:   message  || undefined,
      });
      setSuccess(`🎉 Date request sent to ${trppl?.prize_name || 'your match'}!`);
      setTimeout(() => navigate('/'), 2500);
    } catch (err) {
      setError(err.message);
      setSaving(false);
    }
  }

  // Tomorrow's date as minimum
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDate = tomorrow.toISOString().split('T')[0];

  if (loading) return (
    <div className="phone bg-white dark:bg-neutral-900 flex items-center justify-center">
      <Spinner dark size="lg" />
    </div>
  );

  return (
    <div className="phone bg-neutral-50 dark:bg-neutral-900">
      <div className="bg-[#1a1a2e] px-4 py-3 flex items-center justify-between">
        <button onClick={() => history.back()} className="text-white flex items-center gap-1.5 text-sm">
          <i className="ti ti-arrow-left" /> Back
        </button>
        <div className="text-violet-400 text-xs font-semibold tracking-widest">BOOK A DATE</div>
      </div>

      <div className="overflow-y-auto pb-10 px-4 pt-4">
        {!trppl ? (
          <div className="text-center py-12">
            <div className="text-5xl mb-4">🎮</div>
            <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-2">No active Trppl win</h2>
            <p className="text-sm text-neutral-500 mb-6">Win a game first, then come back here to book your date.</p>
            <button className="btn-primary" onClick={() => navigate('/')}>Go to Trppl →</button>
          </div>
        ) : (
          <>
            {/* Winner banner */}
            <div className="rounded-xl p-5 mb-5 text-center text-white" style={{ background: 'linear-gradient(135deg,#7c3aed,#ec4899)' }}>
              <div className="text-4xl mb-2">🏆</div>
              <h2 className="text-xl font-bold mb-1">You won the Trppl!</h2>
              <p className="text-sm text-white/80 mb-2">Book a date with {trppl.prize_name || 'your match'}</p>
              {trppl.booking_deadline && (
                <div className="inline-flex items-center gap-1.5 bg-white/20 rounded-full px-3 py-1 text-xs font-medium">
                  <i className="ti ti-clock" />
                  {Math.ceil((new Date(trppl.booking_deadline) - new Date()) / (1000*60*60*24))} days left to book
                </div>
              )}
            </div>

            {error   && <div className="alert-error mb-4">{error}</div>}
            {success && <div className="alert-success mb-4">{success}</div>}

            {/* Date type */}
            <p className="text-sm font-semibold text-neutral-700 dark:text-neutral-200 mb-2">Type of date</p>
            <div className="grid grid-cols-3 gap-2.5 mb-1">
              {DATE_TYPES.map(dt => (
                <button key={dt.value} onClick={() => { setDateType(dt.value); setErrors(e=>({...e,dateType:''})); }}
                  className={`aspect-square rounded-xl border-2 flex flex-col items-center justify-center gap-1.5 transition active:scale-95
                    ${dateType === dt.value ? 'border-violet-500 bg-violet-50 dark:bg-violet-900/30' : 'border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800'}`}>
                  <span className="text-2xl">{dt.emoji}</span>
                  <span className={`text-xs font-semibold ${dateType === dt.value ? 'text-violet-700 dark:text-violet-300' : 'text-neutral-600 dark:text-neutral-300'}`}>{dt.label}</span>
                </button>
              ))}
            </div>
            {errors.dateType && <p className="text-xs text-red-500 mb-3">{errors.dateType}</p>}

            <div className="mt-4">
              <FormField label="Date" error={errors.date} icon="ti-calendar">
                <Input icon type="date" min={minDate} value={date} onChange={e=>{setDate(e.target.value);setErrors(er=>({...er,date:''}));}} />
              </FormField>
              <FormField label="Time" error={errors.time} icon="ti-clock">
                <Input icon type="time" value={time} onChange={e=>{setTime(e.target.value);setErrors(er=>({...er,time:''}));}} />
              </FormField>
              <FormField label="Location" icon="ti-map-pin">
                <Input icon type="text" placeholder="e.g. Central Park, Zoom call…" value={location} onChange={e=>setLocation(e.target.value)} />
              </FormField>
              <FormField label="Personal message" icon="ti-message">
                <Textarea icon rows={3} placeholder="Add a personal note to your match…" value={message} onChange={e=>setMessage(e.target.value)}
                  className="pt-3.5" style={{ paddingLeft: '2.5rem' }} />
              </FormField>
            </div>

            <button className="btn-primary mt-2" onClick={submit} disabled={saving}>
              {saving ? <Spinner /> : <><i className="ti ti-heart" /> Send date request</>}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
