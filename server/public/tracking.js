(function () {
  const ANALYTICS_URL = window.location.hostname === 'localhost'
    ? 'http://localhost:3000/api/analytics'
    : 'https://observant-respect-production.up.railway.app/api/analytics';

  // Get or create a persistent visitorId
  const getVisitorId = () => {
    let visitorId = localStorage.getItem('insightflow_visitor_id');
    if (!visitorId) {
      visitorId = Math.random().toString(36).substr(2, 9);
      localStorage.setItem('insightflow_visitor_id', visitorId);
    }
    return visitorId;
  };

  function trackPageView(websiteId) {
    const visitorId = getVisitorId();
    const data = {
      visitorId,
      websiteId,
      path: window.location.pathname,
      referrer: document.referrer,
      userAgent: navigator.userAgent
    };

    console.log('Tracking pageview:', { websiteId, data });

    fetch(`${ANALYTICS_URL}/${websiteId}/pageview`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })
      .then(response => response.json())
      .then(data => console.log('Tracking successful:', data))
      .catch(error => console.error('Tracking failed:', error));

    // Track when user leaves
    window.addEventListener('beforeunload', () => {
      navigator.sendBeacon(`${ANALYTICS_URL}/${websiteId}/leave`, JSON.stringify({
        visitorId,
        timestamp: new Date().toISOString()
      }));
    });
  }

  window.InsightFlow = {
    init: function (websiteId) {
      if (!websiteId) {
        console.error('Website ID is required');
        return;
      }
      console.log('Initializing tracking for website:', websiteId);
      trackPageView(websiteId);
    }
  };
})();