import config from '../config.js';
import Chart from 'chart.js/auto';

export class Dashboard {
  constructor() {
    this.container = document.getElementById('dashboard-section');
    this.charts = {
      pageViews: null,
      dailyViews: null,
      browsers: null
    };
    this.render();
  }

  async render() {
    const token = localStorage.getItem('token');
    if (!token) {
      this.container.classList.add('hidden');
      return;
    }

    try {
      const response = await fetch(`${config.API_URL}/analytics/dashboard`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();

      this.container.classList.remove('hidden');
      this.container.innerHTML = `
        <div class="space-y-6">
          ${data.websites.map(website => `
            <div class="bg-white rounded-lg shadow-sm p-6">
              <h2 class="text-2xl font-bold text-gray-900 mb-6">${website.domain}</h2>
              
              <!-- Summary Cards -->
              <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <div class="bg-blue-50 p-6 rounded-lg border border-blue-100">
                  <h3 class="text-sm font-medium text-blue-600 mb-1">Total Page Views</h3>
                  <p class="text-2xl font-bold text-blue-900">${website.totalPageViews}</p>
                </div>
                <div class="bg-green-50 p-6 rounded-lg border border-green-100">
                  <h3 class="text-sm font-medium text-green-600 mb-1">Unique Visitors</h3>
                  <p class="text-2xl font-bold text-green-900">${website.uniqueVisitors}</p>
                </div>
                <div class="bg-purple-50 p-6 rounded-lg border border-purple-100">
                  <h3 class="text-sm font-medium text-purple-600 mb-1">Active Pages</h3>
                  <p class="text-2xl font-bold text-purple-900">${website.popularPages.length}</p>
                </div>
              </div>

              <!-- Charts -->
              <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div class="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                  <h3 class="text-lg font-medium text-gray-900 mb-4">Page Views Over Time</h3>
                  <div class="chart-container" style="min-height: ${website.pageViews.length ? '300px' : '100px'}">
                    <canvas id="pageViewsChart-${website.id}"></canvas>
                  </div>
                </div>
                <div class="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                  <h3 class="text-lg font-medium text-gray-900 mb-4">Daily Views</h3>
                  <div class="chart-container" style="min-height: ${website.pageViews.length ? '300px' : '100px'}">
                    <canvas id="dailyViewsChart-${website.id}"></canvas>
                  </div>
                </div>
                <div class="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                  <h3 class="text-lg font-medium text-gray-900 mb-4">Browser Distribution</h3>
                  <div class="chart-container" style="min-height: ${website.pageViews.length ? '300px' : '100px'}">
                    <canvas id="browsersChart-${website.id}"></canvas>
                  </div>
                </div>
                <div class="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                  <h3 class="text-lg font-medium text-gray-900 mb-4">Popular Pages</h3>
                  <div class="space-y-2">
                    ${website.popularPages.map(page => `
                      <div class="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                        <span class="text-sm font-medium text-gray-600">${page.path}</span>
                        <span class="text-sm font-medium text-gray-900">${page.count} views</span>
                      </div>
                    `).join('')}
                  </div>
                </div>
              </div>

              <!-- Recent Activity -->
              <div class="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <h3 class="text-lg font-medium text-gray-900 mb-4">Recent Activity</h3>
                <div class="space-y-2">
                  ${website.recentPageViews.map(pageView => `
                    <div class="flex items-center justify-between py-3 border-b border-gray-200 last:border-0">
                      <div>
                        <p class="text-sm font-medium text-gray-900">${pageView.path}</p>
                        <div class="flex items-center gap-2 mt-1">
                          <p class="text-xs text-gray-500">${new Date(pageView.createdAt).toLocaleString()}</p>
                          <span class="text-xs px-2 py-1 bg-blue-50 text-blue-600 rounded-full">
                            ${this.getBrowserFromUA(pageView.userAgent)}
                          </span>
                        </div>
                      </div>
                      <span class="text-xs text-gray-500">${pageView.referrer || 'Direct'}</span>
                    </div>
                  `).join('')}
                </div>
              </div>
            </div>
          `).join('')}
        </div>
      `;

      // Initialize charts for each website
      data.websites.forEach(website => {
        this.initializeCharts(website);
      });

    } catch (error) {
      console.error('Error loading dashboard:', error);
      this.container.innerHTML = `
        <div class="bg-red-50 border border-red-200 rounded-lg p-4">
          <p class="text-red-800">Failed to load dashboard data. Please try again later.</p>
        </div>
      `;
    }
  }

  initializeCharts(website) {
    // Page Views Chart
    const pageViewsCtx = document.getElementById(`pageViewsChart-${website.id}`);
    if (pageViewsCtx) {
      // Set a default height for empty charts
      if (!website.pageViews.length) {
        pageViewsCtx.style.height = '100px'; // Smaller height when empty
      }

      this.charts.pageViews = new Chart(pageViewsCtx, {
        type: 'line',
        data: {
          labels: website.pageViews.map(pv => new Date(pv.createdAt).toLocaleDateString()),
          datasets: [{
            label: 'Page Views',
            data: website.pageViews.map(pv => 1),
            borderColor: 'rgb(59, 130, 246)',
            tension: 0.1
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            y: {
              beginAtZero: true
            }
          },
          plugins: {
            title: {
              display: website.pageViews.length === 0,
              text: 'No data available',
              padding: 20
            }
          }
        }
      });
    }

    // Daily Views Chart
    const dailyViewsCtx = document.getElementById(`dailyViewsChart-${website.id}`);
    if (dailyViewsCtx) {
      // Set a default height for empty charts
      if (!website.pageViews.length) {
        dailyViewsCtx.style.height = '100px';
      }

      const dailyData = this.aggregateDailyViews(website.pageViews);
      this.charts.dailyViews = new Chart(dailyViewsCtx, {
        type: 'bar',
        data: {
          labels: Object.keys(dailyData),
          datasets: [{
            label: 'Daily Views',
            data: Object.values(dailyData),
            backgroundColor: 'rgb(34, 197, 94)'
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            y: {
              beginAtZero: true
            }
          },
          plugins: {
            title: {
              display: website.pageViews.length === 0,
              text: 'No data available',
              padding: 20
            }
          }
        }
      });
    }

    // Browsers Chart
    const browsersCtx = document.getElementById(`browsersChart-${website.id}`);
    if (browsersCtx) {
      // Set a default height for empty charts
      if (!website.pageViews.length) {
        browsersCtx.style.height = '100px';
      }

      const browserData = this.aggregateBrowserData(website.pageViews);
      this.charts.browsers = new Chart(browsersCtx, {
        type: 'doughnut',
        data: {
          labels: Object.keys(browserData),
          datasets: [{
            data: Object.values(browserData),
            backgroundColor: [
              'rgb(59, 130, 246)',
              'rgb(34, 197, 94)',
              'rgb(168, 85, 247)',
              'rgb(249, 115, 22)'
            ]
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            title: {
              display: website.pageViews.length === 0,
              text: 'No data available',
              padding: 20
            }
          }
        }
      });
    }
  }

  aggregateDailyViews(pageViews) {
    return pageViews.reduce((acc, pv) => {
      const date = new Date(pv.createdAt).toLocaleDateString();
      acc[date] = (acc[date] || 0) + 1;
      return acc;
    }, {});
  }

  aggregateBrowserData(pageViews) {
    return pageViews.reduce((acc, pv) => {
      const browser = this.getBrowserFromUA(pv.userAgent);
      acc[browser] = (acc[browser] || 0) + 1;
      return acc;
    }, {});
  }

  getBrowserFromUA(userAgent) {
    if (userAgent.includes('Chrome')) return 'Chrome';
    if (userAgent.includes('Firefox')) return 'Firefox';
    if (userAgent.includes('Safari')) return 'Safari';
    if (userAgent.includes('Edge')) return 'Edge';
    return 'Other';
  }
}