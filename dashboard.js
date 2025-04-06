const API_BASE = 'http://localhost:8080/api/events'

function parseJwt(token) {
    try {
      return JSON.parse(atob(token.split('.')[1]));
    } catch (e) {
      console.error("Invalid token", e);
      return null;
    }
  }
  const getAuthHeader = () => {
    const jwttoken = localStorage.getItem("jwt");
    const token = JSON.parse(jwttoken);
    const token1 = token.token;
    return token1 ? { Authorization: `Bearer ${token1}` } : {};
  };
  function getCategoryEmoji(category) {
    const emojis = {
        CONFERENCE: "🎤",
        WORKSHOP: "🧠",
        SEMINAR: "🎙",
        CELEBRATION: "🎉"
    };
    return emojis[category.toUpperCase()] || "📅";
}
  
  function initDashboard() {
    const token = localStorage.getItem("jwt");
    if (!token) {
      window.location.href = "login.html";
      return;
    }
  
    const decoded = parseJwt(token);
    if (!decoded?.role) {
      window.location.href = "login.html";
      return;
    }
    
    const role = decoded.role.toLowerCase(); // 'organizer' or 'attendee'
    console.log(role);
    document.getElementById("user-role").textContent = decoded.role;
    document.getElementById(`${role}-section`).classList.remove("hidden");
  
    // Optional: apply theme
    document.body.classList.add(`${role}-theme`);
  
    // Load data specific to role
    if (role === "organizer") {
      loadOrganizerEvents();
    } else {
      loadAvailableEvents();
      loadBookingHistory();
    }
  }
  
  async function loadOrganizerEvents() {
    const eventsContainer = document.getElementById("organizer-events");
    eventsContainer.innerHTML = '<div class="loading">Loading your events...</div>';
  
    try {
      const response = await fetch(`${API_BASE}/my-events`, {
        headers: getAuthHeader()
      });
  
      if (!response.ok) throw new Error(await response.text());
  
      const events = await response.json();
      eventsContainer.innerHTML = events.map(event => `
        <div class="event-card" style="background-image: url('./assets/images/${event.category.toLowerCase()}.jpg')">
          <div class="overlay">
            <span class="event-label">${getCategoryEmoji(event.category)} ${event.category}</span>
            <h2>${event.title}</h2>
            <p>${event.description}</p>
             <p class="event-slots">
                <span class="icon">👥</span>
                ${event.availableSlots}/${event.maxSlots} slots available
                </p>
                <p class="event-datetime">
            <span class="icon">📅</span>
            ${new Date(event.dateTime).toLocaleString()}
          </p>
            <div class="button-group">
              <button onclick="editEvent('${event.id}')">Edit</button>
              <button onclick="deleteEvent('${event.id}')">Delete</button>
            </div>
          </div>
        </div>
      `).join('');
    } catch (error) {
      eventsContainer.innerHTML = `<div class="error">Failed to load your events</div>`;
      console.error("Organizer event load error:", error);
    }
  }
  
  
  async function loadAvailableEvents() {
    const eventsContainer = document.getElementById("available-events");
    eventsContainer.innerHTML = '<div class="loading">Loading available events...</div>';
  
    try {
      const response = await fetch(`${API_BASE}/available`);
      if (!response.ok) throw new Error(await response.text());
  
      const events = await response.json();
      renderEventCards(events);
    } catch (error) {
      eventsContainer.innerHTML = `<div class="error">Failed to load events</div>`;
      console.error("Attendee event load error:", error);
    }
  }
  
  async function searchEvents() {
    const eventsContainer = document.getElementById("available-events");
    const selectedCategory = document.getElementById("categoryFilter").value;
    eventsContainer.innerHTML = '<div class="loading">Loading events...</div>';
  
    try {
      let url = `${API_BASE}/search?`;
      if (selectedCategory) {
          url += `category=${selectedCategory}`;
      }
      const response = await fetch(url);
      if (!response.ok) throw new Error(await response.text());
  
      const events = await response.json();
      renderEventCards(events);
    } catch (error) {
      console.error("Error loading events:", error);
      eventsContainer.innerHTML = `
        <div class="error">
          <p>Failed to load events</p>
          <button onclick="location.reload()">Retry</button>
        </div>
      `;
    }
  }

  function renderEventCards(events) {
    const eventsContainer = document.getElementById("available-events");
    eventsContainer.innerHTML = "";
  
    if (events.length === 0) {
      eventsContainer.innerHTML = "<p>No events found for this category.</p>";
      return;
    }
  
    eventsContainer.innerHTML = events.map(event => `
        <div class="event-card" style="background-image: url('./assets/images/${event.category.toLowerCase()}.jpg')">
          <div class="overlay">
            <span class="event-label">${getCategoryEmoji(event.category)} ${event.category}</span>
            <h2>${event.title}</h2>
            <p>${event.description}</p>
             <p class="event-slots">
                <span class="icon">👥</span>
                ${event.availableSlots}/${event.maxSlots} slots available
                </p>
                <p class="event-datetime">
            <span class="icon">📅</span>
            ${new Date(event.dateTime).toLocaleString()}
          </p>
        <button id="book-btn-${event.id}" class="book-now-btn" onclick="bookEvent(${event.id})">Book Now</button>
          </div>
        </div>
      `).join('');
  }
  
function openCreateEventForm() {
    const modal = document.createElement("div");
    modal.className = "modal-overlay";
    modal.innerHTML = `
      <div class="modal">
        <h2>Create New Event</h2>
        <form id="create-event-form">
          <input type="text" name="title" placeholder="Event Title" required />
          <textarea name="description" placeholder="Description" required></textarea>
          <select name="category" id="categoryFilter" required>
            <option value="">Select Category</option>
            <option value="CONFERENCE">Conference</option>
            <option value="WORKSHOP">Workshop</option>
            <option value="SEMINAR">Seminar</option>
            <option value="CELEBRATION">Celebration</option>
          </select>
          <input type="datetime-local" name="dateTime" required />
          <input type="number" name="maxSlots" placeholder="Max Slots" min="1" required />
          <button type="submit">Create</button>
          <button type="button" onclick="closeModal()">Cancel</button>
        </form>
      </div>
    `;
    document.body.appendChild(modal);
  
    document.getElementById("create-event-form").addEventListener("submit", async (e) => {
      e.preventDefault();
      const form = e.target;
      const eventData = {
        title: form.title.value,
        description: form.description.value,
        category: form.category.value,
        dateTime: form.dateTime.value,
        maxSlots: Number(form.maxSlots.value)
      };
  
      try {
        const response = await fetch(`${API_BASE}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...getAuthHeader()
          },
          body: JSON.stringify(eventData)
        });
  
        if (!response.ok) throw new Error(await response.text());
        closeModal();
        loadOrganizerEvents();
      } catch (err) {
        alert("Error creating event: " + err.message);
      }
    });
  }

  function editEvent(event) {
    const modal = document.createElement("div");
    modal.className = "modal-overlay";
    modal.innerHTML = `
      <div class="modal">
        <h2>Edit Event</h2>
        <form id="edit-event-form">
          <input type="text" name="title" value="${event.title}" required />
          <textarea name="description" required>${event.description}</textarea>
          <select name="category" id="categoryFilter" required>
            <option value="CONFERENCE" ${event.category === "CONFERENCE" ? "selected" : ""}>Conference</option>
            <option value="WORKSHOP" ${event.category === "WORKSHOP" ? "selected" : ""}>Workshop</option>
            <option value="SEMINAR" ${event.category === "SEMINAR" ? "selected" : ""}>Seminar</option>
            <option value="CELEBRATION" ${event.category === "CELEBRATION" ? "selected" : ""}>Celebration</option>
          </select>
          <input type="datetime-local" name="dateTime" value="${event.dateTime}" required />
          <input type="number" name="maxSlots" value="${event.maxSlots}" required />
          <button type="submit">Save</button>
          <button type="button" onclick="closeModal()">Cancel</button>
        </form>
      </div>
    `;
    document.body.appendChild(modal);
  
    document.getElementById("edit-event-form").addEventListener("submit", async (e) => {
      e.preventDefault();
      const form = e.target;
      const updatedData = {
        title: form.title.value,
        description: form.description.value,
        category: form.category.value,
        dateTime: form.dateTime.value,
        maxSlots: Number(form.maxSlots.value)
      };
  
      try {
        // console.log(event)
        const response = await fetch(`${API_BASE}/${event}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            ...getAuthHeader()
          },
          body: JSON.stringify(updatedData)
        });
  
        if (!response.ok) throw new Error(await response.text());
        closeModal();
        loadOrganizerEvents();
      } catch (err) {
        alert("Error editing event: " + err.message);
      }
    });
  }

  function deleteEvent(eventId) {
    const confirmDelete = confirm("Are you sure you want to cancel this event?");
    if (!confirmDelete) return;
  
    fetch(`${API_BASE}/${eventId}`, {
      method: "DELETE",
      headers: getAuthHeader()
    })
      .then((res) => {
        if (!res.ok) throw new Error("Delete failed");
        loadOrganizerEvents();
      })
      .catch((err) => alert("Error deleting event: " + err.message));
  }
  
  function closeModal() {
    const modal = document.querySelector(".modal-overlay");
    if (modal) modal.remove();
  }

  function logout() {
    localStorage.removeItem("jwt");
    window.location.href = "login.html";
  }  

  async function bookEvent(eventId) {  
    try {
        const response = await fetch(`http://localhost:8080/api/bookings/${eventId}`, {
            method: 'POST',
            headers: {
                "Content-Type": "application/json",
                ...getAuthHeader()
            }
          });
      if (!response.ok) throw new Error(await response.text());
      const resultText = await response.text();
  
      if (response.ok) {
        alert("✅ Booking Confirmed!");
        const btn = document.getElementById(`book-btn-${eventId}`);
        btn.innerText = "Booked";
        btn.disabled = true;
        btn.classList.add("booked"); // Optional for styling
      } else {
        // Show the backend's error message (like Already booked, No slots)
        alert("❌ Booking Failed: " + resultText);
        console.error("Booking error:", resultText);
      }
    } catch (error) {
      alert("❌ Something went wrong: " + error.message);
      console.error("Booking error:", error);
    }
  }
  
  async function loadBookingHistory() {
    try {
      const response = await fetch('http://localhost:8080/api/bookings/my-bookings', {
        method: 'GET',
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeader()
      }
      });
      
      if (!response.ok) throw new Error(await response.text());
      
      const bookings = await response.json();
      renderBookingHistory(bookings);
    } catch (error) {
      console.error("Failed to load bookings:", error);
    }
  }
  function renderBookingHistory(bookings) {
    const list = document.getElementById("booking-history");
    list.innerHTML = "";
  
    if (bookings.length === 0) {
      list.innerHTML = "<p>You have not made any bookings yet.</p>";
      return;
    }
  
    bookings.forEach(booking => {
      const bookingCard = document.createElement("div");
      bookingCard.className = "booking-card";
      console.log(booking.cancelled);
      const status = (booking.cancelled)?"CANCELLED":"CONFIRMED";
      bookingCard.innerHTML = `
        <h4>${booking.event.title}</h4>
        <p><strong>Date:</strong> ${new Date(booking.event.dateTime).toLocaleString()}</p>
        <p><strong>Status:</strong>${status}</p>
        ${
          status === "CONFIRMED"
            ? `<button class=cancel-booking-btn onclick="cancelBooking(${booking.id})">Cancel Booking</button>`
            : ""  
        }
      `;
  
      list.appendChild(bookingCard);
    });
  }
  async function cancelBooking(bookingId) {  
    try {
        const response = await fetch(`http://localhost:8080/api/bookings/${bookingId}`, {
          method: 'DELETE',
          headers: {
          "Content-Type": "application/json",
          ...getAuthHeader()
        }
        });
  
      if (!response.ok) throw new Error("Failed to cancel booking");
  
      alert("✅ Booking cancelled successfully!");
      loadBookingHistory();
    } catch (error) {
      console.error("❌ Cancel failed:", error);
      alert("Something went wrong while cancelling.");
    }
  }
  
  function showAvailableEvents() {
    document.getElementById("available-events").style.display = "block";
    document.getElementById("booking-history-section").classList.add("hidden");
  
    document.getElementById("view-events-btn").classList.add("active");
    document.getElementById("view-bookings-btn").classList.remove("active");
  }
  
  function showBookingHistory() {
    document.getElementById("available-events").style.display = "none";
    document.getElementById("booking-history-section").classList.remove("hidden");
  
    document.getElementById("view-bookings-btn").classList.add("active");
    document.getElementById("view-events-btn").classList.remove("active");
  
    loadBookingHistory();
  }
  
  document.addEventListener("DOMContentLoaded", initDashboard);
  