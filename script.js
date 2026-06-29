

/* ── DATA ── */
let destinations = [];

fetch("destinations.json")
  .then(response => response.json())
  .then(data => {
    destinations = data;
    renderCards(destinations);
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
  grid.innerHTML = list.map((d, i) => `
    <div class="dest-card" onclick="openModal(${destinations.indexOf(d)})">
      <div class="card-img-wrap">
        <img src="${d.image}" alt="${d.destinationName}" loading="lazy"/>
        <div class="card-category">${d.category}</div>
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
  `).join("");
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
  document.getElementById("modal").classList.add("open");
  document.body.style.overflow = "hidden";
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

