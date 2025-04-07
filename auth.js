// JWT Decode
function parseJwt(token) {
  try {
    return JSON.parse(atob(token.split('.')[1]));
  } catch (e) {
    console.error("Token parse error:", e);
    return null;
  }
}

function checkAuth() {
  const token = localStorage.getItem('jwt');
  if (!token) {
    window.location.href = 'login.html';
    return false;
  }
  return true;
}

function checkRole(allowedRoles) {
  const token = localStorage.getItem('jwt');
  if (!token) return false;

  try {
    const decoded = parseJwt(token);
    return allowedRoles.includes(decoded.role);
  } catch (e) {
    return false;
  }
}
// Handle Registration
document.getElementById('registerForm')?.addEventListener('submit', async (e) => {
  e.preventDefault();

  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value.trim();
  const role = document.getElementById('role').value;

  try {
    const res = await fetch('http://localhost:8080/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, role })
    });

    if (!res.ok) {
      const errMsg = await res.text();
      throw new Error(errMsg || "Registration failed");
    }

    alert("Registration successful! Redirecting to login...");
    window.location.href = 'login.html';
  } catch (err) {
    alert(`❌ ${err.message}`);
  }
});

// ⏩ Login Handler
document.getElementById('loginForm')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const btn = e.target.querySelector('button');
  const originalText = btn.innerHTML;
  btn.innerHTML = '<span class="spinner"></span> Logging in...';
  btn.disabled = true;

  try {
    const response = await fetch('http://localhost:8080/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: document.getElementById('email').value,
        password: document.getElementById('password').value
      })
    });

    if (!response.ok) throw new Error(await response.text());

    const token = await response.text();
    const decoded = parseJwt(token);

    if (!decoded?.role) throw new Error("Role missing in token");

    localStorage.setItem('jwt', token);
    localStorage.setItem('role', decoded.role);

    window.location.href = 'dashboard.html';  // ✅ Unified redirect
  } catch (error) {
    alert(error.message);
  } finally {
    btn.innerHTML = originalText;
    btn.disabled = false;
  }
});

// ✅ Protect Routes
function protectRoutes() {
  const protectedRoutes = {
    'dashboard.html': ['ATTENDEE', 'ORGANIZER']
  };

  const currentPath = window.location.pathname.split('/').pop();

  if (protectedRoutes[currentPath]) {
    if (!checkAuth() || !checkRole(protectedRoutes[currentPath])) {
      window.location.href = 'login.html';
    }
  }
}

document.addEventListener('DOMContentLoaded', protectRoutes);
