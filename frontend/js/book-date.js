// frontend/js/book-date.js
if (!Auth.requireAuth()) { /* redirects */ }

var activeTrppl  = null;
var selectedType = null;

function authHeader() {
  var t = Auth.getToken();
  return t ? { Authorization: 'Bearer ' + t, 'Content-Type': 'application/json' } : {};
}

// ── Load active trppl win ──────────────────────────────────────────────────────
async function loadTrppl() {
  try {
    var res  = await fetch('/api/matches/trppl', { headers: authHeader() });
    var data = await res.json();
    var user = Auth.getUser();

    // Find trppl where current user is the winner
    var win = (data.trppls || []).find(function(t) {
      return t.winner_id === user.id && t.status === 'completed';
    });

    document.getElementById('loadingState').style.display = 'none';

    if (!win) {
      document.getElementById('noTrppl').style.display = 'block';
      return;
    }

    activeTrppl = win;
    document.getElementById('bookingForm').style.display = 'block';
    document.getElementById('winnerSubtitle').textContent =
      'Book a date with ' + (win.prize_name || 'your match');

    // Show deadline
    if (win.booking_deadline) {
      var deadline = new Date(win.booking_deadline);
      var now      = new Date();
      var diffDays = Math.ceil((deadline - now) / (1000 * 60 * 60 * 24));
      document.getElementById('deadlineText').textContent =
        diffDays > 0 ? diffDays + ' day' + (diffDays !== 1 ? 's' : '') + ' left to book' : 'Deadline passed';
    }

    // Set minimum date to tomorrow
    var tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    document.getElementById('proposedDate').min = tomorrow.toISOString().split('T')[0];

  } catch (err) {
    document.getElementById('loadingState').style.display = 'none';
    document.getElementById('noTrppl').style.display = 'block';
    console.error('Could not load trppl:', err);
  }
}

// ── Date type selection ────────────────────────────────────────────────────────
document.querySelectorAll('.date-type-btn').forEach(function(btn) {
  btn.addEventListener('click', function() {
    document.querySelectorAll('.date-type-btn').forEach(function(b) { b.classList.remove('sel'); });
    btn.classList.add('sel');
    selectedType = btn.getAttribute('data-type');
    document.getElementById('err-dateType').textContent = '';
  });
});

// ── Submit booking ─────────────────────────────────────────────────────────────
async function submitBooking() {
  var date     = document.getElementById('proposedDate').value;
  var time     = document.getElementById('proposedTime').value;
  var location = document.getElementById('location').value.trim();
  var message  = document.getElementById('message').value.trim();

  // Validate
  var ok = true;
  if (!selectedType) {
    document.getElementById('err-dateType').textContent = 'Please select a date type.';
    ok = false;
  }
  if (!date) { document.getElementById('err-date').textContent = 'Please pick a date.'; ok = false; }
  if (!time) { document.getElementById('err-time').textContent = 'Please pick a time.'; ok = false; }
  if (!ok) return;

  setLoading(true);
  hideMessages();

  try {
    var res = await fetch('/api/bookings', {
      method:  'POST',
      headers: authHeader(),
      body:    JSON.stringify({
        trpplId:      activeTrppl.id,
        dateType:     selectedType,
        proposedDate: date,
        proposedTime: time,
        location:     location || undefined,
        message:      message  || undefined,
      }),
    });
    var data = await res.json();
    if (!res.ok) { showError(data.error || 'Something went wrong.'); setLoading(false); return; }
    showSuccess('🎉 Date request sent! ' + (activeTrppl.prize_name || 'Your match') + ' will be notified.');
    document.getElementById('submitBtn').disabled = true;
    setTimeout(function() { window.location.href = '/'; }, 2500);
  } catch (err) {
    showError('Failed to send booking. Please try again.');
    setLoading(false);
  }
}

function showError(msg)   { var e=document.getElementById('formError');   e.textContent=msg; e.hidden=false; document.getElementById('formSuccess').hidden=true; }
function showSuccess(msg) { var e=document.getElementById('formSuccess'); e.textContent=msg; e.hidden=false; document.getElementById('formError').hidden=true; }
function hideMessages()   { document.getElementById('formError').hidden=true; document.getElementById('formSuccess').hidden=true; }
function setLoading(on)   { document.getElementById('submitBtn').disabled=on; document.getElementById('submitLabel').hidden=on; document.getElementById('submitSpinner').hidden=!on; }

// ── Wire buttons ───────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', function() {
  document.getElementById('backBtn').addEventListener('click', function() { history.back(); });
  document.getElementById('submitBtn').addEventListener('click', submitBooking);
  loadTrppl();
});
