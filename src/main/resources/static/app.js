const API_URL = '/api';

// Utilities
const el = id => document.getElementById(id);
const urlParams = new URLSearchParams(window.location.search);
const movieId = urlParams.get('id');

// State
let selectedShowtimeId = null;
let selectedSeats = new Set();
let seatPrice = 150;

function saveCity() {
    const city = el('city-select').value;
    localStorage.setItem('hmCity', city);
    const display = el('display-city');
    if (display) {
        // Capitalize first letter
        display.innerText = city.charAt(0).toUpperCase() + city.slice(1);
    }
}

function initCity() {
    const saved = localStorage.getItem('hmCity') || 'coimbatore';
    const select = el('city-select');
    if (select) {
        select.value = saved;
        saveCity(); // Update UI
    }
}

async function loadMovies() {
    try {
        const res = await fetch(`${API_URL}/movies`);
        const movies = await res.json();
        const grid = el('movies-grid');
        if (!grid) return;
        
        grid.innerHTML = movies.map(m => `
            <div class="movie-card" onclick="window.location.href='movie.html?id=${m.id}'">
                <img class="movie-img" src="${m.imageUrl}" alt="${m.title}">
                <div class="movie-info">
                    <div class="movie-title">${m.title}</div>
                    <div class="movie-meta">${m.genre} • ${m.duration} min</div>
                </div>
            </div>
        `).join('');
    } catch(e) { console.error("Error loading movies", e); }
}

async function loadMovieDetails() {
    if(!movieId) return;
    try {
        const res = await fetch(`${API_URL}/movies`);
        const movies = await res.json();
        const movie = movies.find(m => m.id == movieId);
        
        if (movie) {
            el('movie-title').innerText = movie.title;
            el('movie-meta').innerText = `${movie.genre} • ${movie.duration} min`;
            el('movie-poster').src = movie.imageUrl;
            
            // Load showtimes
            const showRes = await fetch(`${API_URL}/showtimes/${movieId}`);
            const showtimes = await showRes.json();
            
            el('time-badges').innerHTML = showtimes.map((s, idx) => `
                <div class="time-badge ${idx === 0 ? 'active' : ''}" data-id="${s.id}" onclick="selectShowtime(${s.id}, this)">
                    ${s.timeString}
                </div>
            `).join('');
            
            if(showtimes.length > 0) {
                selectShowtime(showtimes[0].id, el('time-badges').children[0]);
            }
        }
    } catch(e) { console.error(e); }
}

function selectShowtime(id, elNode) {
    document.querySelectorAll('.time-badge').forEach(b => b.classList.remove('active'));
    elNode.classList.add('active');
    selectedShowtimeId = id;
    selectedSeats.clear();
    updateBookingBar();
    loadSeats();
}

async function loadSeats() {
    if (!selectedShowtimeId) return;
    try {
        const res = await fetch(`${API_URL}/seats/${selectedShowtimeId}`);
        const seatsData = await res.json();
        
        // Group by row
        const rowMap = {};
        seatsData.forEach(s => {
            const row = s.seatNumber.charAt(0);
            if(!rowMap[row]) rowMap[row] = [];
            rowMap[row].push(s);
        });
        
        const container = el('seat-container');
        container.innerHTML = Object.keys(rowMap).sort().map(rowStr => {
            const seatsHtml = rowMap[rowStr].sort((a,b) => a.seatNumber.localeCompare(b.seatNumber)).map(s => `
                <div class="seat ${s.booked ? 'booked' : ''}" 
                     data-seat="${s.seatNumber}" 
                     onclick="toggleSeat(this, '${s.seatNumber}', ${s.booked})">
                    ${s.seatNumber}
                </div>
            `).join('');
            return `<div class="seat-row">${seatsHtml}</div>`;
        }).join('');
    } catch (e) { console.error(e); }
}

function toggleSeat(elNode, seatNumber, isBooked) {
    if (isBooked) return;
    
    if (selectedSeats.has(seatNumber)) {
        selectedSeats.delete(seatNumber);
        elNode.classList.remove('selected');
    } else {
        selectedSeats.add(seatNumber);
        elNode.classList.add('selected');
    }
    updateBookingBar();
}

function updateBookingBar() {
    const bar = el('booking-bar');
    if(!bar) return;
    
    if (selectedSeats.size > 0) {
        bar.classList.add('visible');
        const total = selectedSeats.size * seatPrice;
        el('seat-count').innerText = selectedSeats.size;
        el('total-price').innerText = `₹${total}`;
    } else {
        bar.classList.remove('visible');
    }
}

async function bookSeats() {
    if(selectedSeats.size === 0 || !selectedShowtimeId) return;
    
    const request = {
        showtimeId: selectedShowtimeId,
        seatNames: Array.from(selectedSeats)
    };
    
    try {
        const res = await fetch(`${API_URL}/bookings`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(request)
        });
        
        if (res.ok) {
            const booking = await res.json();
            sessionStorage.setItem('lastBooking', JSON.stringify(booking));
            window.location.href = 'ticket.html';
        } else {
            alert('Booking failed. Please try again.');
        }
    } catch (e) {
        alert('An error occurred.');
    }
}

function loadTicketDetails() {
    const bookingJson = sessionStorage.getItem('lastBooking');
    if (!bookingJson) {
        window.location.href = 'index.html';
        return;
    }
    
    const booking = JSON.parse(bookingJson);
    el('t-movie').innerText = booking.showtime.movie.title;
    el('t-date').innerText = "Today, " + booking.showtime.timeString;
    el('t-seats').innerText = booking.seatNames.join(', ');
    el('t-amount').innerText = `₹${booking.totalPrice}`;
    el('t-barcode').innerText = `*BKG${booking.id}TK*`;
}

// Initializer
document.addEventListener('DOMContentLoaded', () => {
    initCity();
    if(document.body.id === 'home-page') loadMovies();
    if(document.body.id === 'movie-page') loadMovieDetails();
    if(document.body.id === 'ticket-page') loadTicketDetails();
});
