document.addEventListener('DOMContentLoaded', () => {
  const badge = document.getElementById('auth-status-badge');
  const loggedInView = document.getElementById('logged-in-view');
  const loggedOutView = document.getElementById('logged-out-view');
  const userName = document.getElementById('user-name');
  const userEmail = document.getElementById('user-email');
  const logoutBtn = document.getElementById('logout-btn');
  const openAppBtn = document.getElementById('open-app-btn');
  const loginForm = document.getElementById('login-form') as HTMLFormElement | null;
  const loginError = document.getElementById('login-error');
  const loginBtn = document.getElementById('login-btn') as HTMLButtonElement | null;

  function updateUI(isAuthenticated: boolean, user: any = null) {
    if (isAuthenticated && user) {
      if (badge) {
        badge.innerText = 'Connected';
        badge.className = 'badge online';
      }
      if (userName) userName.innerText = user.displayName || 'Learner';
      if (userEmail) userEmail.innerText = user.email || '';
      loggedInView?.classList.remove('hidden');
      loggedOutView?.classList.add('hidden');
    } else {
      if (badge) {
        badge.innerText = 'Logged Out';
        badge.className = 'badge offline';
      }
      loggedInView?.classList.add('hidden');
      loggedOutView?.classList.remove('hidden');
    }
  }

  // Initial status check
  chrome.runtime.sendMessage({ action: 'GET_AUTH_STATUS' }, (res) => {
    updateUI(res?.isAuthenticated, res?.user);
  });

  // Login form submit
  loginForm?.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = (document.getElementById('email') as HTMLInputElement)?.value;
    const password = (document.getElementById('password') as HTMLInputElement)?.value;

    if (!email || !password) return;

    if (loginBtn) {
      loginBtn.disabled = true;
      loginBtn.innerText = 'Logging in...';
    }
    if (loginError) loginError.classList.add('hidden');

    chrome.runtime.sendMessage(
      {
        action: 'LOGIN',
        payload: { email, password },
      },
      (res) => {
        if (loginBtn) {
          loginBtn.disabled = false;
          loginBtn.innerText = 'Log In';
        }

        if (res && res.success) {
          updateUI(true, res.user);
        } else {
          if (loginError) {
            loginError.innerText = res?.error || 'Login failed';
            loginError.classList.remove('hidden');
          }
        }
      },
    );
  });

  // Logout button
  logoutBtn?.addEventListener('click', () => {
    chrome.runtime.sendMessage({ action: 'LOGOUT' }, () => {
      updateUI(false);
    });
  });

  // Open Web App
  openAppBtn?.addEventListener('click', () => {
    chrome.tabs.create({ url: 'http://localhost:5173/vocabulary' });
  });
});
