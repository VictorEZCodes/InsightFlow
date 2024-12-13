import config from '../config.js';
import { Toast } from './Toast.js';

export class WebsiteManager {
  constructor() {
    this.container = document.getElementById('website-section');
    this.render();
  }

  async deleteWebsite(websiteId) {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${config.API_URL}/analytics/websites/${websiteId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to delete website');
      }

      // Dispatch event to refresh dashboard
      window.dispatchEvent(new Event('website-deleted'));
      // Re-render the website list
      this.render();
    } catch (error) {
      console.error('Error deleting website:', error);
      alert('Failed to delete website');
    }
  }

  async render() {
    const token = localStorage.getItem('token');
    if (!token) {
      this.container.classList.add('hidden');
      return;
    }

    this.container.classList.remove('hidden');
    this.container.innerHTML = `
      <div class="bg-white rounded-lg shadow-sm p-6 mt-6">
        <div class="flex justify-between items-center mb-6">
          <h2 class="text-xl font-bold text-gray-900">Your Websites</h2>
          <button id="add-website-btn" class="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">
            Add Website
          </button>
        </div>

        <div id="add-website-form" class="hidden mb-6">
          <form class="flex gap-4">
            <input 
              type="text" 
              id="domain-input"
              placeholder="Enter website domain (e.g., example.com)" 
              class="flex-1 rounded-md border-gray-300"
              required
            >
            <button type="submit" class="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700">
              Save
            </button>
          </form>
        </div>

        <div id="websites-list" class="space-y-4">
          <!-- Websites will be listed here -->
        </div>
      </div>
    `;

    this.attachListeners();
    this.loadWebsites();
  }

  async loadWebsites() {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${config.API_URL}/analytics/dashboard`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();

      const websitesList = document.getElementById('websites-list');
      if (!data.websites || data.websites.length === 0) {
        websitesList.innerHTML = `
          <p class="text-gray-500 text-center">No websites added yet</p>
        `;
        return;
      }

      websitesList.innerHTML = data.websites.map(website => `
        <div class="flex items-center justify-between p-4 bg-white rounded-lg border border-gray-200">
          <div>
            <h3 class="font-medium text-gray-900">${website.domain}</h3>
            <p class="text-sm text-gray-500">ID: ${website.id}</p>
          </div>
          <div class="flex items-center gap-4">
            <button 
              onclick="copyTrackingCode('${website.id}')"
              class="text-blue-600 hover:text-blue-700 text-sm font-medium"
            >
              Get Tracking Code
            </button>
            <button 
              onclick="window.websiteManager.deleteWebsite('${website.id}')"
              class="text-red-600 hover:text-red-700 text-sm font-medium"
            >
              Delete
            </button>
          </div>
        </div>
      `).join('');

    } catch (error) {
      console.error('Error loading websites:', error);
      const websitesList = document.getElementById('websites-list');
      websitesList.innerHTML = `
        <div class="bg-red-50 text-red-600 p-4 rounded-lg">
          Error loading websites
        </div>
      `;
    }
  }

  attachListeners() {
    const addWebsiteBtn = document.getElementById('add-website-btn');
    const addWebsiteForm = document.getElementById('add-website-form');
    const form = addWebsiteForm.querySelector('form');

    addWebsiteBtn.addEventListener('click', () => {
      addWebsiteForm.classList.toggle('hidden');
    });

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const domain = document.getElementById('domain-input').value;

      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${config.API_URL}/analytics/websites`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ domain })
        });

        if (!response.ok) {
          throw new Error('Failed to add website');
        }

        // Reset form
        form.reset();
        addWebsiteForm.classList.add('hidden');

        // Refresh the websites list
        window.dispatchEvent(new Event('website-added'));
        this.loadWebsites();
      } catch (error) {
        console.error('Error adding website:', error);
        alert('Failed to add website');
      }
    });
  }
}

// Make deleteWebsite accessible from onclick
window.websiteManager = new WebsiteManager();

// Add copyTrackingCode function
window.copyTrackingCode = async (websiteId) => {
  const code = `<!-- InsightFlow Analytics -->
<script>
  const script = document.createElement('script');
  script.src = '${config.API_URL}/tracking.js';
  script.onload = function() {
    InsightFlow.init("${websiteId}");
  };
  document.body.appendChild(script);
</script>`;

  try {
    await navigator.clipboard.writeText(code);
    Toast.show('Tracking code copied to clipboard!', 'success');
  } catch (err) {
    console.error('Failed to copy code:', err);
    Toast.show('Failed to copy tracking code', 'error');
  }
};