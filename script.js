/* ── DATA ── */
let destinations = [];
let currentModalIndex = null;

fetch("destinations.json")
  .then(response => response.json())
  .then(data => {
    destinations = data;
    renderCards(destinations);
    populateReviewDestinations();
  })
  .catch(error => console.log(error));

let activeFilter = "";

/* ── RENDER CARDS ── */
function renderCards(list) {
  const grid = document.getElementById("card-grid");
  if (!list.length) {
    grid.innerHTML = '<p style="color:var(--mid);grid-column:1/-1;text-align:center;padding:2rem;">No destinations found. Try a different search.</p>';
    return;
  }
  grid.innerHTML = list.map((d) => {
    const idx = destinations.indexOf(d);
    const saved = isWishlisted(d.destinationName);
    return `
    <div class="dest-card" onclick="openModal(${idx})">
      <div class="card-img-wrap">
        <img src="${d.image}" alt="${d.destinationName}" loading="lazy"/>
        <div class="card-category">${d.category}</div>
        <button class="wishlist-btn ${saved ? "active" : ""}"
          title="${saved ? "Remove from wishlist" : "Add to wishlist"}"
          onclick="event.stopPropagation(); toggleWishlist(${idx})">${saved ? "❤️" : "🤍"}</button>
      </div>
      <div class="card-body">
        <h3>${d.destinationName}</h3>
        <div class="card-country">📍 ${d.country}</div>
        <div class="card-meta">
          <span class="rating">${d.rating}</span>
          <span class="price">${d.price}</span>
        </div>
        <div class="card-desc">${d.description}</div>
        <span class="card-btn">View Details →</span>
      </div>
    </div>
  `;
  }).join("");
}

/* ── FILTER ── */
function filterCards() {
  const q = document.getElementById("search-input").value.toLowerCase();
  const cat = document.getElementById("cat-filter").value;
  const filtered = destinations.filter(d => {
    const matchQ = !q || d.destinationName.toLowerCase().includes(q) || d.country.toLowerCase().includes(q) || d.category.toLowerCase().includes(q) || d.description.toLowerCase().includes(q);
    const matchCat = !activeFilter && !cat ? true : (activeFilter ? d.category === activeFilter : d.category === cat);
    return matchQ && matchCat;
  });
  renderCards(filtered);
}

function setFilter(btn, val) {
  document.querySelectorAll(".filter-btn").forEach(b => b.classList.remove("active"));
  btn.classList.add("active");
  activeFilter = val;
  document.getElementById("cat-filter").value = "";
  filterCards();
}

/* ── MODAL ── */
function openModal(i) {
  const d = destinations[i];
  currentModalIndex = i;
  document.getElementById("m-img").src    = d.image;
  document.getElementById("m-img").alt    = d.destinationName;
  document.getElementById("m-name").textContent  = d.destinationName;
  document.getElementById("m-loc").textContent   = "📍 " + d.country + " · " + d.category;
  document.getElementById("m-price").textContent  = d.travelCost;
  document.getElementById("m-time").textContent   = d.bestTimeToVisit;
  document.getElementById("m-weather").textContent= d.weather;
  document.getElementById("m-rating").textContent = d.rating;
  document.getElementById("m-desc").textContent   = d.fullDescription;
  document.getElementById("m-tips").textContent   = d.travelTips;
  document.getElementById("m-attr").innerHTML     = d.attractions.map(a => `<span class="att-tag">${a}</span>`).join("");
  document.getElementById("m-weatherInfo").textContent = d.weatherInformation;
  document.getElementById("m-gallery").innerHTML  = d.imageGallery.map(g => `<img src="${g}" alt=""/>`).join("");
  document.getElementById("m-map").src = d.locationMap;

  updateModalWishBtn();

  document.getElementById("wishBtn").onclick = function () {
    toggleWishlist(i);
    updateModalWishBtn();
  };

  const reviewBtn = document.querySelector(".review-btn");
  if (reviewBtn) {
    reviewBtn.onclick = function () {
      closeModal();
      goToReviewForm(d.destinationName);
    };
  }

  document.getElementById("modal").classList.add("open");
  document.body.style.overflow = "hidden";
}

function updateModalWishBtn() {
  const d = destinations[currentModalIndex];
  const btn = document.getElementById("wishBtn");
  if (!d || !btn) return;
  const saved = isWishlisted(d.destinationName);
  btn.classList.toggle("active", saved);
  btn.textContent = saved ? "✅ In Wishlist" : "❤️ Add to Wishlist";
}

function closeModal(e) {
  if (!e || e.target === document.getElementById("modal") || e.currentTarget.classList.contains("modal-close")) {
    document.getElementById("modal").classList.remove("open");
    document.body.style.overflow = "";
  }
}

/* ── CONTACT FORM ── */
function submitForm() {
  let ok = true;
  const fields = [
    { id: "f-name",    err: "err-name",    check: v => v.trim().length > 1 },
    { id: "f-email",   err: "err-email",   check: v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) },
    { id: "f-subject", err: "err-subject", check: v => v !== "" },
    { id: "f-msg",     err: "err-msg",     check: v => v.trim().length > 5 }
  ];
  fields.forEach(f => {
    const el = document.getElementById(f.id);
    const errEl = document.getElementById(f.err);
    if (!f.check(el.value)) {
      errEl.style.display = "block";
      el.style.borderColor = "#e0423c";
      ok = false;
    } else {
      errEl.style.display = "none";
      el.style.borderColor = "#dde3e8";
    }
  });
  if (ok) {
    document.getElementById("form-success").style.display = "block";
    ["f-name","f-email","f-phone","f-subject","f-msg"].forEach(id => document.getElementById(id).value = "");
    setTimeout(() => document.getElementById("form-success").style.display = "none", 4000);
  }
}

/* ── NAV TOGGLE ── */
function toggleMenu() {
  document.getElementById("nav-links").classList.toggle("open");
}

/* ===========================
   TOAST NOTIFICATIONS
=========================== */
function showToast(message, tone = "lagoon") {
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
  }, 2600);
}

/* ===========================
   WISHLIST MODULE
=========================== */

let wishlist = JSON.parse(localStorage.getItem("wishlist")) || [];

function isWishlisted(destinationName) {
  return wishlist.some(item => item.destinationName === destinationName);
}

function updateWishlistBadge() {
  const badge = document.getElementById("wishlist-count");
  if (!badge) return;
  badge.textContent = wishlist.length;
  badge.dataset.count = wishlist.length;
}

// Toggle add/remove from a destination card or modal
function toggleWishlist(index) {
  const destination = destinations[index];
  if (!destination) return;

  const existingIndex = wishlist.findIndex(item => item.destinationName === destination.destinationName);

  if (existingIndex > -1) {
    wishlist.splice(existingIndex, 1);
    showToast(destination.destinationName + " removed from wishlist", "coral");
  } else {
    wishlist.push(destination);
    showToast(destination.destinationName + " added to wishlist ❤️", "lagoon");
  }

  localStorage.setItem("wishlist", JSON.stringify(wishlist));

  displayWishlist();
  updateWishlistBadge();

  // Refresh heart icons on the currently rendered destination cards
  if (destinations.length) renderCards(currentFilteredList());
}

// Display Wishlist
function displayWishlist(){

    const container = document.getElementById("wishlist-container");

    if(!container) return;

    if(wishlist.length === 0){

        container.innerHTML = `
        <div class="empty-message">
            No destinations added to your wishlist yet. Tap the 🤍 on any destination to save it here.
        </div>`;

        return;
    }

    container.innerHTML = wishlist.map((d,index)=>`

    <div class="wish-card">

        <img src="${d.image}" alt="${d.destinationName}">

        <div class="wish-content">

            <h3>${d.destinationName}</h3>

            <p>📍 ${d.country}</p>

            <p>💰 ${d.price}</p>

            <p>⭐ ${d.rating}</p>

            <p>🗓 ${d.bestTimeToVisit}</p>

            <button class="remove-btn"
            onclick="removeWishlist(${index})">
                Remove
            </button>

        </div>

    </div>

    `).join("");

}

// Remove Destination
function removeWishlist(index){

    const removed = wishlist[index];
    wishlist.splice(index,1);

    localStorage.setItem(
        "wishlist",
        JSON.stringify(wishlist)
    );

    displayWishlist();
    updateWishlistBadge();

    if (removed) showToast(removed.destinationName + " removed from wishlist", "coral");

    // keep destination card hearts in sync if visible
    if (destinations.length) renderCards(currentFilteredList());
}

function currentFilteredList() {
  const q = document.getElementById("search-input") ? document.getElementById("search-input").value.toLowerCase() : "";
  const cat = document.getElementById("cat-filter") ? document.getElementById("cat-filter").value : "";
  return destinations.filter(d => {
    const matchQ = !q || d.destinationName.toLowerCase().includes(q) || d.country.toLowerCase().includes(q) || d.category.toLowerCase().includes(q) || d.description.toLowerCase().includes(q);
    const matchCat = !activeFilter && !cat ? true : (activeFilter ? d.category === activeFilter : d.category === cat);
    return matchQ && matchCat;
  });
}

// Render immediately on load so the wishlist persists across visits
displayWishlist();
updateWishlistBadge();


/* ===========================
   REVIEWS MODULE
=========================== */

let reviews = JSON.parse(localStorage.getItem("reviews")) || [];
let selectedRating = 0;

function populateReviewDestinations() {
  const select = document.getElementById("review-destination");
  if (!select || !destinations.length) return;
  destinations.forEach(d => {
    const opt = document.createElement("option");
    opt.value = d.destinationName;
    opt.textContent = d.destinationName;
    select.appendChild(opt);
  });
}

function goToReviewForm(destinationName) {
  const section = document.getElementById("reviews");
  if (!section) return;
  section.scrollIntoView({ behavior: "smooth" });
  const select = document.getElementById("review-destination");
  if (select && destinationName) select.value = destinationName;
  const textarea = document.getElementById("review-comment");
  if (textarea) setTimeout(() => textarea.focus(), 400);
}

function setStarRating(n) {
  selectedRating = n;
  document.querySelectorAll("#star-input span").forEach(s => {
    s.classList.toggle("filled", Number(s.dataset.val) <= n);
  });
}

function starsMarkup(rating) {
  let out = "";
  for (let i = 1; i <= 5; i++) out += i <= rating ? "★" : "☆";
  return out;
}

function initials(name) {
  return name.trim().split(/\s+/).map(p => p[0]).slice(0, 2).join("").toUpperCase();
}

function formatReviewDate(iso) {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

function submitReview() {
  const nameEl = document.getElementById("review-name");
  const destEl = document.getElementById("review-destination");
  const commentEl = document.getElementById("review-comment");
  const errName = document.getElementById("err-review-name");
  const errRating = document.getElementById("err-review-rating");
  const errComment = document.getElementById("err-review-comment");

  let ok = true;

  if (nameEl.value.trim().length < 2) {
    errName.style.display = "block";
    ok = false;
  } else {
    errName.style.display = "none";
  }

  if (selectedRating < 1) {
    errRating.style.display = "block";
    ok = false;
  } else {
    errRating.style.display = "none";
  }

  if (commentEl.value.trim().length < 5) {
    errComment.style.display = "block";
    ok = false;
  } else {
    errComment.style.display = "none";
  }

  if (!ok) return;

  const review = {
    id: Date.now(),
    name: nameEl.value.trim(),
    destination: destEl.value || "General Feedback",
    rating: selectedRating,
    comment: commentEl.value.trim(),
    date: new Date().toISOString()
  };

  reviews.unshift(review);
  localStorage.setItem("reviews", JSON.stringify(reviews));

  nameEl.value = "";
  commentEl.value = "";
  destEl.value = "";
  setStarRating(0);

  renderReviews();
  showToast("Thanks for your review! ⭐", "sun");
}

function deleteReview(id) {
  reviews = reviews.filter(r => r.id !== id);
  localStorage.setItem("reviews", JSON.stringify(reviews));
  renderReviews();
}

function renderReviews() {
  const list = document.getElementById("review-list");
  const totalEl = document.getElementById("review-total");
  const avgEl = document.getElementById("review-average");
  if (!list) return;

  if (totalEl) totalEl.textContent = reviews.length;
  if (avgEl) {
    const avg = reviews.length ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length) : 0;
    avgEl.textContent = reviews.length ? avg.toFixed(1) : "–";
  }

  if (!reviews.length) {
    list.innerHTML = `<div class="empty-message">No reviews yet. Be the first to share your trip story!</div>`;
    return;
  }

  list.innerHTML = reviews.map(r => `
    <div class="review-card">
      <div class="review-head">
        <div class="review-avatar">${initials(r.name)}</div>
        <div class="review-meta">
          <strong>${r.name}</strong>
          <span class="review-date">${formatReviewDate(r.date)}</span>
          <div class="review-dest-tag">${r.destination}</div>
        </div>
      </div>
      <div class="review-stars">${starsMarkup(r.rating)}</div>
      <p class="review-text">${r.comment}</p>
      <button class="review-delete" onclick="deleteReview(${r.id})">Remove</button>
    </div>
  `).join("");
}

renderReviews();
