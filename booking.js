/* ======================================================================
   BOOKING MANAGEMENT CONTROLLER
   Guards this page behind the demo login (see login.html's inline script),
   then handles
   booking CRUD, search/filter/sort, and the stats dashboard.
   Depends on js/reminders.js being loaded first (for the bell icon).
====================================================================== */

/* ── AUTH GUARD ── */
if (sessionStorage.getItem("wv_auth") !== "true") {
  window.location.href = "login.html";
}

function logout() {
  sessionStorage.removeItem("wv_auth");
  sessionStorage.removeItem("wv_user_email");
  window.location.href = "login.html";
}

/* ── STORAGE ── */
function loadBookings() {
  return JSON.parse(localStorage.getItem("bookings")) || [];
}
function saveBookings(list) {
  localStorage.setItem("bookings", JSON.stringify(list));
}

let bookings = loadBookings();
let editingBookingId = null;
let sortAscending = true;

/* ======================================================================
   ADD / EDIT FORM
====================================================================== */

function openAddBookingForm() {
  editingBookingId = null;
  document.getElementById("booking-form-title").textContent = "Add Booking";
  document.getElementById("bk-destination").value = "";
  document.getElementById("bk-travelerName").value = "";
  document.getElementById("bk-bookingDate").value = new Date().toISOString().split("T")[0];
  document.getElementById("bk-travelDate").value = "";
  document.getElementById("bk-travelers").value = 1;
  document.getElementById("bk-amount").value = 0;
  document.getElementById("bk-paymentStatus").value = "Unpaid";
  document.getElementById("bk-bookingStatus").value = "Pending";
  clearBookingFormErrors();
  document.getElementById("booking-form-card").classList.add("open");
}

function closeBookingForm() {
  document.getElementById("booking-form-card").classList.remove("open");
  editingBookingId = null;
}

function clearBookingFormErrors() {
  ["destination", "travelerName", "bookingDate", "travelDate", "travelers", "amount"].forEach(f => {
    document.getElementById("err-bk-" + f).textContent = "";
  });
}

function editBooking(id) {
  const b = bookings.find(x => x.id === id);
  if (!b) return;
  editingBookingId = id;
  document.getElementById("booking-form-title").textContent = "Edit Booking";
  document.getElementById("bk-destination").value = b.destination;
  document.getElementById("bk-travelerName").value = b.travelerName;
  document.getElementById("bk-bookingDate").value = b.bookingDate;
  document.getElementById("bk-travelDate").value = b.travelDate;
  document.getElementById("bk-travelers").value = b.travelers;
  document.getElementById("bk-amount").value = b.amount;
  document.getElementById("bk-paymentStatus").value = b.paymentStatus;
  document.getElementById("bk-bookingStatus").value = b.bookingStatus;
  clearBookingFormErrors();
  document.getElementById("booking-form-card").classList.add("open");
  document.getElementById("booking-form-card").scrollIntoView({ behavior: "smooth", block: "center" });
}

function saveBookingForm() {
  clearBookingFormErrors();

  const destination = document.getElementById("bk-destination").value.trim();
  const travelerName = document.getElementById("bk-travelerName").value.trim();
  const bookingDate = document.getElementById("bk-bookingDate").value;
  const travelDate = document.getElementById("bk-travelDate").value;
  const travelers = parseInt(document.getElementById("bk-travelers").value);
  const amount = parseFloat(document.getElementById("bk-amount").value);
  const paymentStatus = document.getElementById("bk-paymentStatus").value;
  const bookingStatus = document.getElementById("bk-bookingStatus").value;

  let valid = true;

  if (destination.length < 3) {
    document.getElementById("err-bk-destination").textContent = "Minimum 3 characters.";
    valid = false;
  }
  if (travelerName.length < 3) {
    document.getElementById("err-bk-travelerName").textContent = "Please enter the traveler's name.";
    valid = false;
  }
  if (!bookingDate) {
    document.getElementById("err-bk-bookingDate").textContent = "Required.";
    valid = false;
  }
 const booking = new Date(bookingDate);
const travel = new Date(travelDate);

if (!travelDate) {
    document.getElementById("err-bk-travelDate").textContent = "Travel date is required.";
    valid = false;
}
else if (travel < booking) {
    document.getElementById("err-bk-travelDate").textContent = "Travel date must be after booking date.";
    valid = false;
}
  if (!Number.isInteger(travelers) || travelers < 1) {
    document.getElementById("err-bk-travelers").textContent = "Must be a whole number greater than 0.";
    valid = false;
  }
  if (isNaN(amount) || amount <10) {
    document.getElementById("err-bk-amount").textContent = "Cannot be negative.";
    valid = false;
  }

  if (!valid) return;

  if (editingBookingId) {
    const b = bookings.find(x => x.id === editingBookingId);
    Object.assign(b, { destination, travelerName, bookingDate, travelDate, travelers, amount, paymentStatus, bookingStatus });
  } else {
    bookings.push({
      id: "BK" + Date.now().toString().slice(-8),
      destination, travelerName, bookingDate, travelDate, travelers, amount, paymentStatus, bookingStatus
    });
  }

  saveBookings(bookings);
  closeBookingForm();
  renderBookingsTable();
  renderStats();
}

/* ======================================================================
   VIEW / CANCEL / DELETE
====================================================================== */

function viewBooking(id) {
  const b = bookings.find(x => x.id === id);
  if (!b) return;
  document.getElementById("vm-destination").textContent = b.destination;
  document.getElementById("vm-id").textContent = b.id;
  document.getElementById("vm-travelerName").textContent = b.travelerName;
  document.getElementById("vm-bookingDate").textContent = b.bookingDate;
  document.getElementById("vm-travelDate").textContent = b.travelDate;
  document.getElementById("vm-travelers").textContent = b.travelers;
  document.getElementById("vm-amount").textContent = "$" + Number(b.amount).toLocaleString();
  document.getElementById("vm-paymentStatus").textContent = b.paymentStatus;
  document.getElementById("vm-bookingStatus").textContent = b.bookingStatus;
  document.getElementById("booking-modal").classList.add("open");
  document.body.style.overflow = "hidden";
}

function closeViewModal(e) {
  if (!e || e.target === document.getElementById("booking-modal") || (e.currentTarget && e.currentTarget.classList.contains("booking-modal-close"))) {
    document.getElementById("booking-modal").classList.remove("open");
    document.body.style.overflow = "";
  }
}

function cancelBooking(id) {
  const b = bookings.find(x => x.id === id);
  if (!b) return;
  if (b.bookingStatus === "Cancelled") return;
  const ok = confirm(`Cancel the booking for ${b.destination}?`);
  if (!ok) return;
  b.bookingStatus = "Cancelled";
  saveBookings(bookings);
  renderBookingsTable();
  renderStats();
}



/* ======================================================================
   SEARCH / FILTER / SORT
====================================================================== */

function toggleSortDirection() {
  sortAscending = !sortAscending;
  document.getElementById("bk-sort-btn").textContent = "Sort by Travel Date " + (sortAscending ? "↑" : "↓");
  renderBookingsTable();
}

function getFilteredSortedBookings() {
  const q = document.getElementById("bk-search").value.toLowerCase().trim();
  const statusFilter = document.getElementById("bk-filter-status").value;

  let list = bookings.filter(b => {
    const matchQ = !q || b.destination.toLowerCase().includes(q) || b.travelerName.toLowerCase().includes(q) || b.id.toLowerCase().includes(q);
    const matchStatus = !statusFilter || b.bookingStatus === statusFilter;
    return matchQ && matchStatus;
  });

  list.sort((a, b) => sortAscending
    ? a.travelDate.localeCompare(b.travelDate)
    : b.travelDate.localeCompare(a.travelDate));

  return list;
}

function statusBadgeClass(status) {
  return "badge-" + status.toLowerCase();
}

function renderBookingsTable() {
  const body = document.getElementById("bookingTable");
  const list = getFilteredSortedBookings();

  if (!list.length) {
    body.innerHTML = `<tr><td colspan="10" class="empty-row">${bookings.length ? "No bookings match your search/filter." : "No bookings yet. Click \u201c+ Add Booking\u201d to create one."}</td></tr>`;
    return;
  }

  body.innerHTML = list.map(b => `
    <tr>
      <td>${b.id}</td>
      <td>${b.destination}</td>
      <td>${b.travelerName}</td>
      <td>${b.bookingDate}</td>
      <td>${b.travelDate}</td>
      <td>${b.travelers}</td>
      <td>$${Number(b.amount).toLocaleString()}</td>
      <td><span class="status-badge ${statusBadgeClass(b.paymentStatus)}">${b.paymentStatus}</span></td>
      <td><span class="status-badge ${statusBadgeClass(b.bookingStatus)}">${b.bookingStatus}</span></td>
      <td class="action-cell">
        <button class="view-btn" onclick="viewBooking('${b.id}')">View</button>
        <button class="edit-btn" onclick="editBooking('${b.id}')">Edit</button>
        <button class="cal-btn cancel-booking-btn" onclick="cancelBooking('${b.id}')" ${b.bookingStatus === "Cancelled" ? "disabled" : ""}>Cancel</button>
       
      </td>
    </tr>
  `).join("");
}

/* ======================================================================
   STATS + CHARTS
====================================================================== */

let statusChartInstance = null;
let revenueChartInstance = null;

function renderStats() {
  const total = bookings.length;
  const confirmed = bookings.filter(b => b.bookingStatus === "Confirmed").length;
  const pending = bookings.filter(b => b.bookingStatus === "Pending").length;
  const cancelled = bookings.filter(b => b.bookingStatus === "Cancelled").length;

  // Revenue = amount actually collected (Paid) on bookings that weren't cancelled
  const revenue = bookings
    .filter(b => b.paymentStatus === "Paid" && b.bookingStatus !== "Cancelled")
    .reduce((sum, b) => sum + Number(b.amount || 0), 0);

  document.getElementById("bk-total").textContent = total;
  document.getElementById("bk-confirmed").textContent = confirmed;
  document.getElementById("bk-pending").textContent = pending;
  document.getElementById("bk-cancelled").textContent = cancelled;
  document.getElementById("bk-revenue").textContent = "$" + revenue.toLocaleString();

  renderStatusChart(confirmed, pending, cancelled);
  renderRevenueChart();
}

function renderStatusChart(confirmed, pending, cancelled) {
  const canvas = document.getElementById("bookingStatusChart");
  const empty = document.getElementById("statusChartEmpty");

  if (statusChartInstance) { statusChartInstance.destroy(); statusChartInstance = null; }

  if (!bookings.length) {
    canvas.style.display = "none";
    empty.style.display = "block";
    return;
  }
  canvas.style.display = "block";
  empty.style.display = "none";

  statusChartInstance = new Chart(canvas, {
    type: "pie",
    data: {
      labels: ["Confirmed", "Pending", "Cancelled"],
      datasets: [{
        data: [confirmed, pending, cancelled],
        backgroundColor: ["#4CAF50", "#FFB703", "#F44336"]
      }]
    },
    options: { responsive: true }
  });
}

function renderRevenueChart() {
  const canvas = document.getElementById("paymentRevenueChart");
  const empty = document.getElementById("revenueChartEmpty");

  if (revenueChartInstance) { revenueChartInstance.destroy(); revenueChartInstance = null; }

  if (!bookings.length) {
    canvas.style.display = "none";
    empty.style.display = "block";
    return;
  }
  canvas.style.display = "block";
  empty.style.display = "none";

  const paid = bookings.filter(b => b.paymentStatus === "Paid").reduce((s, b) => s + Number(b.amount || 0), 0);
  const unpaid = bookings.filter(b => b.paymentStatus === "Unpaid").reduce((s, b) => s + Number(b.amount || 0), 0);
  const partial = bookings.filter(b => b.paymentStatus === "Partial").reduce((s, b) => s + Number(b.amount || 0), 0);

  revenueChartInstance = new Chart(canvas, {
    type: "bar",
    data: {
      labels: ["Paid", "Unpaid", "Partial"],
      datasets: [{
        label: "Amount ($)",
        data: [paid, unpaid, partial],
        backgroundColor: ["#4CAF50", "#F44336", "#FFB703"]
      }]
    },
    options: {
      responsive: true,
      scales: { y: { beginAtZero: true } }
    }
  });
}

/* ── Init ── */
if (sessionStorage.getItem("wv_auth") === "true") {
  renderBookingsTable();
  renderStats();
}