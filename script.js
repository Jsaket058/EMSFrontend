const eventContainer = document.getElementById('events-container');

const categoryImages = {
  CONFERENCE: "assets/images/conference.jpg",
  WORKSHOP: "assets/images/workshop.jpg",
  SEMINAR: "assets/images/seminar.jpg",
  CELEBRATION: "assets/images/celebration.jpg"
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


async function fetchEvents() {
  try {
    const response = await fetch('http://localhost:8080/api/events/available'); // Adjust URL
    const events = await response.json();

    events.forEach((event, index) => {
      const card = document.createElement('div');
      card.className = 'event-card';

      const imageURL = categoryImages[event.category.toUpperCase()]
        || "assets/images/default.jpg";


      card.innerHTML = `
              <div class="event-card-content">
                <span class="event-label">${getCategoryEmoji(event.category)} ${event.category}</span>
                <h3 class="event-title">${event.title}</h3>
                <p class="event-description">${event.description}</p>
                <p class="event-slots">
                <span class="icon">👥</span>
                ${event.availableSlots}/${event.maxSlots} slots available
                </p>
                <p class="event-datetime">
            <span class="icon">📅</span>
            ${new Date(event.dateTime).toLocaleString()}
          </p>
                <button onclick="handleEventClick()">View Details</button>
              </div>
            `;

      card.classList.add("event-card");
      card.style.backgroundImage = `url('${imageURL}')`;

      eventContainer.appendChild(card);
    });
  } catch (error) {
    console.error('Failed to fetch events:', error);
  }
}

function toggleMenu(menuIcon) {
  const navLinks = document.querySelector('.nav-links');
  menuIcon.classList.toggle('active');
  navLinks.classList.toggle('active');
}

const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('reveal');
      observer.unobserve(entry.target); // Only animate once
    }
  });
}, {
  threshold: 0.3,
});

document.querySelectorAll('.events-container').forEach(card => {
  observer.observe(card);
});

function handleEventClick() {
  const isLoggedIn = localStorage.getItem('token'); // We'll improve this later
  if (!isLoggedIn) {
    alert('Please log in to view event details.');
    window.location.href = 'login.html'; // We’ll build this page later
  }
}

fetchEvents();

