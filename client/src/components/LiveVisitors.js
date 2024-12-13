export class LiveVisitors {
  constructor() {
    this.container = document.getElementById('live-visitors');
    this.visitors = new Map();
    this.setupWebSocket();
    this.render();
  }

  setupWebSocket() {
    this.ws = new WebSocket('ws://localhost:3000');

    this.ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      this.handleWebSocketMessage(data);
    };

    this.ws.onclose = () => {
      // attempt to reconnect after 3 seconds
      setTimeout(() => this.setupWebSocket(), 3000);
    };
  }

  handleWebSocketMessage(data) {
    console.log('WebSocket message received:', data);
    switch (data.type) {
      case 'pageview':
        this.updateVisitor(data);
        break;
      case 'visitor_left':
        this.removeVisitor(data.visitorId);
        break;
    }
    this.updateUI();
  }

  updateVisitor(data) {
    this.visitors.set(data.visitorId, {
      ...data,
      lastSeen: new Date()
    });
  }

  removeVisitor(visitorId) {
    this.visitors.delete(visitorId);
  }

  updateUI() {
    const visitorCount = document.getElementById('visitor-count');
    const visitorList = document.getElementById('visitor-list');

    if (visitorCount) {
      visitorCount.textContent = this.visitors.size;
    }

    if (visitorList) {
      visitorList.innerHTML = Array.from(this.visitors.values())
        .sort((a, b) => new Date(b.lastSeen) - new Date(a.lastSeen))
        .map(visitor => `
          <div class="flex items-center justify-between p-4 bg-white rounded-lg border border-gray-200">
            <div class="flex items-center space-x-4">
              <div class="flex-shrink-0">
                <div class="h-3 w-3 rounded-full bg-green-400"></div>
              </div>
              <div>
                <p class="text-sm font-medium text-gray-900">${visitor.path}</p>
                <p class="text-xs text-gray-500">
                  ${visitor.referrer ? `from ${visitor.referrer}` : 'Direct visit'}
                </p>
              </div>
            </div>
            <div class="text-xs text-gray-500">
              ${this.getTimeAgo(new Date(visitor.lastSeen))}
            </div>
          </div>
        `)
        .join('');
    }
  }

  getTimeAgo(date) {
    const seconds = Math.floor((new Date() - date) / 1000);
    if (seconds < 60) return 'Just now';
    const minutes = Math.floor(seconds / 60);
    return `${minutes}m ago`;
  }

  render() {
    this.container.innerHTML = `
      <div class="bg-white rounded-lg shadow-sm p-6">
        <div class="flex items-center justify-between mb-6">
          <div>
            <h2 class="text-2xl font-bold text-gray-900">Live Visitors</h2>
            <p class="text-sm text-gray-500 mt-1">See who's on your website right now</p>
          </div>
          <div class="bg-blue-50 px-4 py-2 rounded-full">
            <div class="flex items-center space-x-2">
              <div class="flex items-center">
                <div class="h-2 w-2 rounded-full bg-blue-600 animate-pulse"></div>
              </div>
              <span class="text-2xl font-bold text-blue-600" id="visitor-count">0</span>
              <span class="text-sm text-blue-600">online</span>
            </div>
          </div>
        </div>

        <div class="space-y-3" id="visitor-list">
          <!-- Visitor items will be inserted here -->
        </div>
      </div>
    `;

    this.updateUI();
  }
}