

/* ── DATA ── */
const destinations = [
  {
    name: "Bali, Indonesia", country: "Indonesia", category: "Beaches",
    rating: "4.9 ★", price: "$1,200", desc: "A tropical paradise with lush rice terraces, vibrant temples, and pristine beaches.",
    img: "./images/t1.jpg",
    time: "Apr – Oct", weather: "27°C Sunny",
    attractions: ["Uluwatu Temple","Tegallalang Rice Terrace","Seminyak Beach","Mount Batur"],
    tips: "Book accommodation in advance during peak season. Carry an umbrella during shoulder season. Respect local customs at temples.",
    gallery: [
    "./images/bali1.jpg",  "./images/bali2.jpg",  "./images/bali3.jpg"
    ]
  },
  {
    name: "Swiss Alps", country: "Switzerland", category: "Mountains",
    rating: "4.8 ★", price: "$2,800", desc: "Breathtaking alpine scenery, charming ski resorts, and world-class hiking trails.",
    img: "./images/swiss1.jpg",
    time: "Dec – Mar", weather: "−5°C Snow",
    attractions: ["Matterhorn","Jungfraujoch","Lake Geneva","Grindelwald"],
    tips: "Book ski passes early. Layer up for temperature changes. Try fondue in a local chalet.",
    gallery: [
     "./images/swiss1.jpg",
     "./images/swiss2.jpg"
     ,"./images/swiss3.jpg"
    ]
  },
  {
    name: "Machu Picchu", country: "Peru", category: "Historical",
    rating: "4.9 ★", price: "$1,600", desc: "An ancient Incan citadel set high in the Andes Mountains — a wonder of the world.",
    img: "./images/t2.jpg",
    time: "May – Sep", weather: "18°C Mild",
    attractions: ["Sun Gate","Inca Trail","Huayna Picchu","Sacred Valley"],
    tips: "Acclimatize in Cusco for 2 days. Buy entry tickets months in advance. Start hikes early to avoid crowds.",
    gallery: [
      "./images/t2.jpg",
      "./images/t3.jpg",
      "./images/t4.jpg"
    ]
  },
  {
    name: "Serengeti Safari", country: "Tanzania", category: "Wildlife",
    rating: "5.0 ★", price: "$3,500", desc: "Witness the Great Migration — millions of wildebeest crossing the sweeping golden plains.",
    img: "./images/safari1.jpg",
    time: "Jun – Sep", weather: "25°C Dry",
    attractions: ["Great Migration","Ngorongoro Crater","Lake Manyara","Balloon Safari"],
    tips: "Choose a reputable safari operator. Pack neutral colours. Bring binoculars and a good camera with zoom.",
    gallery: [
    "./images/safari1.jpg","./images/safari2.jpg","./images/safari3.jpg",
    ]
  },
  {
    name: "Queenstown", country: "New Zealand", category: "Adventure",
    rating: "4.8 ★", price: "$2,200", desc: "The adventure capital of the world — bungee jumping, skydiving, and stunning fjords.",
    img: "./images/queens1.jpg",
    time: "Dec – Feb", weather: "22°C Clear",
    attractions: ["Bungee Jump AJ Hackett","Milford Sound","Gondola Ride","Jet Boating"],
    tips: "Book adventure activities in advance. The Milford Sound day trip is a must. Rent a car to explore Otago.",
    gallery: [
     "./images/queens1.jpg","./images/queens2.jpg","./images/queens3.jpg",
    ]
  },
  {
    name: "Maldives", country: "Maldives", category: "Beaches",
    rating: "4.9 ★", price: "$4,000", desc: "Overwater bungalows, crystal-clear lagoons, and some of the world's best snorkelling.",
    img:"./images/maldive1.jpg",
    time: "Nov – Apr", weather: "30°C Sunny",
    attractions: ["Overwater Villas","Baa Atoll Biosphere","Whale Shark Snorkel","Local Island Hop"],
    tips: "Travel during dry season for calm seas. Pack reef-safe sunscreen. Negotiate seaplane transfers in advance.",
    gallery: [
      "./images/maldive1.jpg","./images/maldive2.jpg","./images/maldive3.jpg",
    ]
  }
];

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
        <img src="${d.img}" alt="${d.name}" loading="lazy"/>
        <div class="card-category">${d.category}</div>
      </div>
      <div class="card-body">
        <h3>${d.name}</h3>
        <div class="card-country">📍 ${d.country}</div>
        <div class="card-meta">
          <span class="rating">${d.rating}</span>
          <span class="price">${d.price}</span>
        </div>
        <div class="card-desc">${d.desc}</div>
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
    const matchQ = !q || d.name.toLowerCase().includes(q) || d.country.toLowerCase().includes(q) || d.category.toLowerCase().includes(q) || d.desc.toLowerCase().includes(q);
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
  document.getElementById("m-img").src    = d.img;
  document.getElementById("m-img").alt    = d.name;
  document.getElementById("m-name").textContent  = d.name;
  document.getElementById("m-loc").textContent   = "📍 " + d.country + " · " + d.category;
  document.getElementById("m-price").textContent  = d.price;
  document.getElementById("m-time").textContent   = d.time;
  document.getElementById("m-weather").textContent= d.weather;
  document.getElementById("m-rating").textContent = d.rating;
  document.getElementById("m-desc").textContent   = d.desc;
  document.getElementById("m-tips").textContent   = d.tips;
  document.getElementById("m-attr").innerHTML     = d.attractions.map(a => `<span class="att-tag">${a}</span>`).join("");
  document.getElementById("m-gallery").innerHTML  = d.gallery.map(g => `<img src="${g}" alt=""/>`).join("");
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

/* ── INIT ── */
renderCards(destinations);
