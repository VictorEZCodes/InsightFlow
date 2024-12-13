import './style.css';
import { Auth } from './components/Auth';
import { Dashboard } from './components/Dashboard';
import { WebsiteManager } from './components/WebsiteManager';
import { LandingPage } from './components/LandingPage';
import { LiveVisitors } from './components/LiveVisitors';

const auth = new Auth();
const dashboard = new Dashboard();
const websiteManager = new WebsiteManager();
const landingPage = new LandingPage();
const liveVisitors = new LiveVisitors();

// handle auth state changes
window.addEventListener('auth-changed', () => {
  const token = localStorage.getItem('token');
  const sections = {
    'landing-section': !token,
    'auth-section': !token,
    'website-section': token,
    'dashboard-section': token,
    'live-visitors': token
  };

  // show/hide sections based on auth state
  Object.entries(sections).forEach(([id, show]) => {
    document.getElementById(id).classList.toggle('hidden', !show);
  });

  // refresh data if authenticated
  if (token) {
    dashboard.render();
    websiteManager.render();
    liveVisitors.render();
  }
});

window.addEventListener('website-deleted', () => {
  dashboard.render();
});

window.addEventListener('website-added', () => {
  dashboard.render();
});

window.dispatchEvent(new Event('auth-changed'));