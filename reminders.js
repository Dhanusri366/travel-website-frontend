/* ======================================================================
   REMINDERS ENGINE (shared)
   Handles reminder data, auto-generation from trips, and the bell icon
   widget. Included on both index.html and tripplanner.html.
====================================================================== */

const REMINDER_TYPES = {
  SEVEN_DAYS: "7days",
  ONE_DAY: "1day",
  TRIP_STARTED: "tripstarted"
};

const REMINDER_TYPE_LABELS = {
  [REMINDER_TYPES.SEVEN_DAYS]: "7 Days Before Trip",
  [REMINDER_TYPES.ONE_DAY]: "1 Day Before Trip",
  [REMINDER_TYPES.TRIP_STARTED]: "Trip Started"
};

/* ── STORAGE ── */
function loadReminders() {
  return JSON.parse(localStorage.getItem("reminders")) || [];
}

function saveReminders(list) {
  localStorage.setItem("reminders", JSON.stringify(list));
}

/* ── DATE HELPERS ── */
function computeReminderDateTime(startDateStr, type) {
  const start = new Date(startDateStr + "T09:00:00");
  const d = new Date(start);
  if (type === REMINDER_TYPES.SEVEN_DAYS) {
    d.setDate(d.getDate() - 7);
  } else if (type === REMINDER_TYPES.ONE_DAY) {
    d.setDate(d.getDate() - 1);
  } else if (type === REMINDER_TYPES.TRIP_STARTED) {
    d.setHours(0, 1, 0, 0);
  }
  return d.toISOString();
}

function formatDateTime(iso) {
  const d = new Date(iso);
  return d.toLocaleString(undefined, {
    year: "numeric", month: "short", day: "numeric",
    hour: "2-digit", minute: "2-digit"
  });
}

/* ── CRUD ── */
function addReminder(reminder) {
  const list = loadReminders();
  reminder.id = reminder.id || "r" + Date.now() + Math.floor(Math.random() * 1000);
  reminder.read = false;
  list.push(reminder);
  saveReminders(list);
  return reminder;
}

function updateReminder(id, patch) {
  const list = loadReminders();
  const idx = list.findIndex(r => r.id === id);
  if (idx === -1) return null;
  list[idx] = { ...list[idx], ...patch };
  saveReminders(list);
  return list[idx];
}

function deleteReminder(id) {
  const list = loadReminders().filter(r => r.id !== id);
  saveReminders(list);
}

function deleteRemindersForTrip(tripId) {
  const list = loadReminders().filter(r => r.tripId !== tripId);
  saveReminders(list);
}

function toggleReminderStatus(id) {
  const list = loadReminders();
  const r = list.find(x => x.id === id);
  if (!r) return;
  r.status = r.status === "enabled" ? "disabled" : "enabled";
  saveReminders(list);
}

function markReminderRead(id) {
  updateReminder(id, { read: true });
}

/* Auto-create the 3 standard reminders whenever a trip is saved */
function generateRemindersForTrip(trip) {
  const types = [REMINDER_TYPES.SEVEN_DAYS, REMINDER_TYPES.ONE_DAY, REMINDER_TYPES.TRIP_STARTED];
  const created = types.map(type => ({
    id: "r" + Date.now() + Math.floor(Math.random() * 1000) + type,
    tripId: trip.id,
    destinationName: trip.destination,
    travelStartDate: trip.start,
    reminderDateTime: computeReminderDateTime(trip.start, type),
    reminderType: type,
    status: "enabled",
    read: false
  }));
  const list = loadReminders();
  saveReminders(list.concat(created));
  return created;
}

/* ── STATUS HELPERS ── */
function isReminderDue(reminder) {
  return reminder.status === "enabled" && !reminder.read && new Date(reminder.reminderDateTime) <= new Date();
}

function getUnreadCount() {
  return loadReminders().filter(isReminderDue).length;
}

/* ======================================================================
   BELL ICON WIDGET
====================================================================== */

function renderBell() {
  const badge = document.getElementById("bell-badge");
  const dropdown = document.getElementById("bell-dropdown");
  if (!badge || !dropdown) return;

  const count = getUnreadCount();
  badge.textContent = count;
  badge.style.display = count > 0 ? "flex" : "none";

  const list = loadReminders()
    .filter(r => r.status === "enabled")
    .sort((a, b) => new Date(a.reminderDateTime) - new Date(b.reminderDateTime))
    .slice(0, 8);

  const onTripPlannerPage = !!document.getElementById("reminders-table-body");
  const viewAllHref = onTripPlannerPage ? "#reminders" : "tripplanner.html#reminders";

  if (!list.length) {
    dropdown.innerHTML = `
      <div class="bell-dropdown-header">Reminders</div>
      <div class="bell-empty">No reminders yet. Add one from the Trip Planner page!</div>
      <a class="bell-viewall" href="${viewAllHref}">Manage Reminders →</a>
    `;
    return;
  }

  dropdown.innerHTML = `
    <div class="bell-dropdown-header">Reminders</div>
    <div class="bell-list">
      ${list.map(r => `
        <div class="bell-item ${isReminderDue(r) ? "unread" : ""}" onclick="handleBellItemClick('${r.id}')">
          <div class="bell-item-dot"></div>
          <div class="bell-item-body">
            <strong>${r.destinationName}</strong>
            <span>${REMINDER_TYPE_LABELS[r.reminderType] || r.reminderType}</span>
            <span class="bell-item-time">${formatDateTime(r.reminderDateTime)}</span>
          </div>
        </div>
      `).join("")}
    </div>
    <a class="bell-viewall" href="${viewAllHref}">Manage Reminders →</a>
  `;
}

function handleBellItemClick(id) {
  markReminderRead(id);
  renderBell();
  if (typeof renderRemindersTable === "function") renderRemindersTable();
}

function toggleBellDropdown() {
  const dropdown = document.getElementById("bell-dropdown");
  if (!dropdown) return;
  dropdown.classList.toggle("open");
}

function closeBellDropdownOnOutsideClick(e) {
  const wrap = document.getElementById("bell-wrap");
  const dropdown = document.getElementById("bell-dropdown");
  if (!wrap || !dropdown) return;
  if (!wrap.contains(e.target)) dropdown.classList.remove("open");
}

document.addEventListener("click", closeBellDropdownOnOutsideClick);
document.addEventListener("DOMContentLoaded", () => {
  renderBell();
  setInterval(renderBell, 30000); // re-check every 30s for newly due reminders
});