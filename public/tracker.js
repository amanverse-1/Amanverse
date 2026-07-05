// Portfolio Visitor Tracking Script
(function() {
  const BACKEND_URL = '/api'; // Relative path for Vercel
  let startTime = Date.now();

  // Track page visit
  function trackVisitor() {
    const data = {
      pageVisited: window.location.pathname,
      referrer: document.referrer,
      timeSpent: 0
    };

    fetch(`${BACKEND_URL}/track`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data)
    }).catch(err => console.error('Tracking error:', err));
  }

  // Update time spent when leaving page
  window.addEventListener('beforeunload', () => {
    const timeSpent = Math.floor((Date.now() - startTime) / 1000);
    const data = {
      pageVisited: window.location.pathname,
      timeSpent: timeSpent
    };
    
    // Using keepalive for beforeunload requests
    fetch(`${BACKEND_URL}/track`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
      keepalive: true
    }).catch(err => console.error('Tracking update error:', err));
  });

  // Intercept Contact Form Submission (if the form exists on the page)
  document.addEventListener('DOMContentLoaded', () => {
    trackVisitor();

    const contactForm = document.getElementById('contactForm');
    if (contactForm) {
      contactForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const formData = new FormData(contactForm);
        const submitBtn = contactForm.querySelector('button[type="submit"]');
        if(submitBtn) submitBtn.disabled = true;

        try {
          const res = await fetch(`${BACKEND_URL}/contact`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              name: document.getElementById('name') ? document.getElementById('name').value : '',
              email: document.getElementById('email') ? document.getElementById('email').value : '',
              message: document.getElementById('message') ? document.getElementById('message').value : ''
            })
          });

          const data = await res.json();
          if (data.success) {
            alert('Message sent successfully! Thanks for contacting.');
            contactForm.reset();
          } else {
            alert('Failed to send message. Please try again.');
          }
        } catch (error) {
          console.error('Contact form error:', error);
          alert('Network error. Failed to send message.');
        } finally {
          if(submitBtn) submitBtn.disabled = false;
        }
      });
    }
  });
})();
