/* ======================================================================
   TRIP PLANNER PAGE CONTROLLER
   Handles: destination pricing, trip CRUD, calendar export,
   upcoming trips widget, and the reminders management table.
   Depends on js/reminders.js being loaded first.
====================================================================== */

let destinations = [];
let selectedPrice = 0;

fetch("destinations.json")
  .then(res => res.json())
  .then(data => {
    destinations = data;
    const select = document.getElementById("destination");
    data.forEach(d => {
      let option = document.createElement("option");
      option.value = d.destinationName;
      option.textContent = d.destinationName;
      option.dataset.price = Number(d.price.replace(/[^0-9]/g, ""));
      select.appendChild(option);
    });
  });

document.getElementById("destination").addEventListener("change", function () {
  selectedPrice = parseInt(this.selectedOptions[0].dataset.price || 0);
});

function calculateCost() {
  const travelers = parseInt(document.getElementById("travelers").value) || 0;
  const total = selectedPrice * travelers;
  document.getElementById("totalCost").textContent = "$" + total;
}

/* ── TRIP STORAGE (migrates old entries that lack an id) ── */
let trips = JSON.parse(localStorage.getItem("trips")) || [];
let needsMigration = false;
trips.forEach(t => {
  if (!t.id) { t.id = "t" + Date.now() + Math.floor(Math.random() * 10000); needsMigration = true; }
  if (t.addedToCalendar === undefined) { t.addedToCalendar = false; needsMigration = true; }
});
if (needsMigration) localStorage.setItem("trips", JSON.stringify(trips));

displayTrips();
renderUpcomingTrips();

document.getElementById("tripForm").addEventListener("submit", function (e) {
  e.preventDefault();

  document.getElementById("destinationError").innerHTML = "";
  document.getElementById("startError").innerHTML = "";
  document.getElementById("endError").innerHTML = "";
  document.getElementById("travelerError").innerHTML = "";

  let destination = document.getElementById("destination").value;
  let start = document.getElementById("startDate").value;
  let end = document.getElementById("endDate").value;
  let travelers = parseInt(document.getElementById("travelers").value);

  let valid = true;
  const today = new Date().toISOString().split("T")[0];

  if (destination == "") {
    document.getElementById("destinationError").innerHTML = "Select destination";
    valid = false;
  }
  if (start < today) {
    document.getElementById("startError").innerHTML = "Past dates not allowed";
    valid = false;
  }
  if (end < start) {
    document.getElementById("endError").innerHTML = "End date must be after start date";
    valid = false;
  }
  if (travelers < 1 || travelers > 10) {
    document.getElementById("travelerError").innerHTML = "Travelers must be between 1 and 10";
    valid = false;
  }

  if (valid) {
    let trip = {
      id: "t" + Date.now() + Math.floor(Math.random() * 10000),
      destination,
      start,
      end,
      travelers,
      cost: selectedPrice * travelers,
      status: "Pending",
      addedToCalendar: false
    };

    trips.push(trip);
    localStorage.setItem("trips", JSON.stringify(trips));

    displayTrips();
    renderUpcomingTrips();
    populateReminderTripSelect();
    renderBell();

    this.reset();
    document.getElementById("totalCost").textContent = "$0";
  }
});

function displayTrips() {
  const table = document.getElementById("tripTable");
  table.innerHTML = "";

  if (!trips.length) {
    table.innerHTML = `<tr><td colspan="6" class="empty-row">No trips planned yet. Fill out the form to add one.</td></tr>`;
    return;
  }

  trips.forEach(trip => {
    table.innerHTML += `
      <tr>
        <td>${trip.destination}</td>
        <td>${trip.start}<br>${trip.end}</td>
        <td>${trip.travelers}</td>
        <td>$${trip.cost}</td>
        <td>${trip.status}</td>
        <td class="action-cell">
          <button class="cal-btn ${trip.addedToCalendar ? "added" : ""}" onclick="toggleCalendar('${trip.id}')">
            ${trip.addedToCalendar ? "✓ In Calendar" : "🗓️ Add to Calendar"}
          </button>
          <button class="del-btn" onclick="deleteTrip('${trip.id}')">Delete</button>
        </td>
      </tr>
    `;
  });
}

function deleteTrip(id) {
  trips = trips.filter(t => t.id !== id);
  localStorage.setItem("trips", JSON.stringify(trips));
  deleteRemindersForTrip(id); // cascade delete this trip's reminders
  displayTrips();
  renderUpcomingTrips();
  populateReminderTripSelect();
  renderRemindersTable();
  renderBell();
}

/* ======================================================================
   UPCOMING TRIPS WIDGET
====================================================================== */
function renderUpcomingTrips() {
  const container = document.getElementById("upcoming-trips");
  if (!container) return;

  const today = new Date().toISOString().split("T")[0];
  const upcoming = trips
    .filter(t => t.start >= today)
    .sort((a, b) => a.start.localeCompare(b.start));

  if (!upcoming.length) {
    container.innerHTML = `<div class="empty-row">No upcoming trips. Plan one above!</div>`;
    return;
  }

  container.innerHTML = upcoming.map(t => {
    const daysLeft = Math.ceil((new Date(t.start) - new Date(today)) / 86400000);
    return `
      <div class="upcoming-card">
        <div class="upcoming-dest">${t.destination}</div>
        <div class="upcoming-dates">${t.start} → ${t.end}</div>
        <div class="upcoming-days">${daysLeft === 0 ? "Starts today!" : daysLeft + " day" + (daysLeft === 1 ? "" : "s") + " to go"}</div>
      </div>
    `;
  }).join("");
}

/* ======================================================================
   CALENDAR EXPORT (.ics)
====================================================================== */
function toDateStamp(d) {
  return d.replace(/-/g, "");
}

function generateICS(trip) {
  const endExclusive = new Date(trip.end);
  endExclusive.setDate(endExclusive.getDate() + 1); // ICS DTEND is exclusive for all-day events
  const endStr = endExclusive.toISOString().split("T")[0];

  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//WanderVista//Trip Planner//EN",
    "BEGIN:VEVENT",
    "UID:" + trip.id + "@wandervista.com",
    "DTSTAMP:" + toDateStamp(new Date().toISOString().split("T")[0]) + "T000000Z",
    "DTSTART;VALUE=DATE:" + toDateStamp(trip.start),
    "DTEND;VALUE=DATE:" + toDateStamp(endStr),
    "SUMMARY:Trip to " + trip.destination,
    "DESCRIPTION:Planned via WanderVista \\n" + trip.travelers + " traveler(s) \\, estimated cost $" + trip.cost,
    "BEGIN:VALARM",
    "TRIGGER:-P7D",
    "ACTION:DISPLAY",
    "DESCRIPTION:Trip to " + trip.destination + " starts in 7 days",
    "END:VALARM",
    "BEGIN:VALARM",
    "TRIGGER:-P1D",
    "ACTION:DISPLAY",
    "DESCRIPTION:Trip to " + trip.destination + " starts tomorrow",
    "END:VALARM",
    "END:VEVENT",
    "END:VCALENDAR"
  ].join("\r\n");
}

function downloadICS(trip) {
  const ics = generateICS(trip);
  const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = trip.destination.replace(/\s+/g, "-").toLowerCase() + "-trip.ics";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function toggleCalendar(id) {
  const trip = trips.find(t => t.id === id);
  if (!trip) return;

  if (!trip.addedToCalendar) {
    downloadICS(trip);
    trip.addedToCalendar = true;
    showPlannerToast(trip.destination + " added — open the downloaded file to save it to your calendar app 🗓️", "lagoon");
  } else {
    trip.addedToCalendar = false;
    showPlannerToast("Removed from WanderVista's calendar tracking. Delete the event in your calendar app too if you already imported it.", "coral");
  }

  localStorage.setItem("trips", JSON.stringify(trips));
  displayTrips();
}

/* ======================================================================
   REMINDERS MANAGEMENT TABLE
====================================================================== */
let editingReminderId = null;

function populateReminderTripSelect() {
  const select = document.getElementById("reminder-trip");
  if (!select) return;
  const currentVal = select.value;
  select.innerHTML = '<option value="">— Select a trip —</option>';
  trips.forEach(t => {
    const opt = document.createElement("option");
    opt.value = t.id;
    opt.textContent = `${t.destination} (${t.start})`;
    select.appendChild(opt);
  });
  select.value = currentVal;
}

function onReminderTripChange() {
  const select = document.getElementById("reminder-trip");
  const trip = trips.find(t => t.id === select.value);
  const preview = document.getElementById("reminder-preview");
  const typeSelect = document.getElementById("reminder-type");
  if (!trip) {
    preview.textContent = "";
    return;
  }
  preview.textContent = "Reminder will fire: " + formatDateTime(computeReminderDateTime(trip.start, typeSelect.value));
}

function onReminderTypeChange() {
  onReminderTripChange();
}

function openAddReminderForm() {
  editingReminderId = null;
  document.getElementById("reminder-form-title").textContent = "Add Reminder";
  document.getElementById("reminder-trip").value = "";
  document.getElementById("reminder-type").value = REMINDER_TYPES.SEVEN_DAYS;
  document.getElementById("reminder-status").checked = true;
  document.getElementById("reminder-preview").textContent = "";
  document.getElementById("reminder-form-card").classList.add("open");
}

function closeReminderForm() {
  document.getElementById("reminder-form-card").classList.remove("open");
  editingReminderId = null;
}

function editReminderRow(id) {
  const r = loadReminders().find(x => x.id === id);
  if (!r) return;
  editingReminderId = id;
  document.getElementById("reminder-form-title").textContent = "Edit Reminder";
  populateReminderTripSelect();
  document.getElementById("reminder-trip").value = r.tripId || "";
  document.getElementById("reminder-type").value = r.reminderType;
  document.getElementById("reminder-status").checked = r.status === "enabled";
  document.getElementById("reminder-preview").textContent = "Reminder fires: " + formatDateTime(r.reminderDateTime);
  document.getElementById("reminder-form-card").classList.add("open");
}

function saveReminderForm() {
  const select = document.getElementById("reminder-trip");
  const trip = trips.find(t => t.id === select.value);
  const errEl = document.getElementById("err-reminder-trip");
  const type = document.getElementById("reminder-type").value;
  const enabled = document.getElementById("reminder-status").checked;

  if (!trip) {
    errEl.style.display = "block";
    return;
  }
  errEl.style.display = "none";

  const reminderDateTime = computeReminderDateTime(trip.start, type);

  if (editingReminderId) {
    updateReminder(editingReminderId, {
      tripId: trip.id,
      destinationName: trip.destination,
      travelStartDate: trip.start,
      reminderType: type,
      reminderDateTime,
      status: enabled ? "enabled" : "disabled"
    });
  } else {
    addReminder({
      tripId: trip.id,
      destinationName: trip.destination,
      travelStartDate: trip.start,
      reminderType: type,
      reminderDateTime,
      status: enabled ? "enabled" : "disabled"
    });
  }

  closeReminderForm();
  renderRemindersTable();
  renderBell();
}

function deleteReminderRow(id) {
  deleteReminder(id);
  renderRemindersTable();
  renderBell();
}

function toggleReminderStatusRow(id) {
  toggleReminderStatus(id);
  renderRemindersTable();
  renderBell();
}

function renderRemindersTable() {
  const body = document.getElementById("reminders-table-body");
  if (!body) return;

  const list = loadReminders().sort((a, b) => new Date(a.reminderDateTime) - new Date(b.reminderDateTime));

  if (!list.length) {
    body.innerHTML = `<tr><td colspan="6" class="empty-row">No reminders yet. Click "+ Add Reminder" above to create one for a trip.</td></tr>`;
    return;
  }

  body.innerHTML = list.map(r => `
    <tr class="${isReminderDue(r) ? "due-row" : ""}">
      <td>${r.destinationName}</td>
      <td>${r.travelStartDate}</td>
      <td>${formatDateTime(r.reminderDateTime)}</td>
      <td>${REMINDER_TYPE_LABELS[r.reminderType] || r.reminderType}</td>
      <td>
        <label class="switch">
          <input type="checkbox" ${r.status === "enabled" ? "checked" : ""} onchange="toggleReminderStatusRow('${r.id}')">
          <span class="slider"></span>
        </label>
      </td>
      <td class="action-cell">
        <button class="edit-btn" onclick="editReminderRow('${r.id}')">Edit</button>
        <button class="del-btn" onclick="deleteReminderRow('${r.id}')">Delete</button>
      </td>
    </tr>
  `).join("");
}

/* ── Lightweight toast for this page (matches homepage pattern) ── */
function showPlannerToast(message, tone = "lagoon") {
  let stack = document.getElementById("toast-stack");
  if (!stack) {
    stack = document.createElement("div");
    stack.id = "toast-stack";
    stack.className = "toast-stack";
    document.body.appendChild(stack);
  }
  const toast = document.createElement("div");
  toast.className = `toast ${tone}`;
  toast.textContent = message;
  stack.appendChild(toast);
  requestAnimationFrame(() => toast.classList.add("show"));
  setTimeout(() => {
    toast.classList.remove("show");
    setTimeout(() => toast.remove(), 300);
  }, 3200);
}

/* ── Init ── */
populateReminderTripSelect();
renderRemindersTable();