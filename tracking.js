// Invisible visitor tracking
// This runs silently in the background when someone visits your site

(function() {
    'use strict';

    // Function to get visitor information
    async function trackVisitor() {
        try {
            // Get visitor's IP and location data from a free API
            const response = await fetch('https://ipapi.co/json/', {
                method: 'GET'
            });

            if (response.ok) {
                const data = await response.json();

                // Prepare visitor information
                const visitorInfo = {
                    ip: data.ip || 'Unknown',
                    city: data.city || 'Unknown',
                    region: data.region || 'Unknown',
                    country: data.country_name || 'Unknown',
                    country_code: data.country_code || 'Unknown',
                    postal: data.postal || 'Unknown',
                    latitude: data.latitude || 'Unknown',
                    longitude: data.longitude || 'Unknown',
                    timezone: data.timezone || 'Unknown',
                    org: data.org || 'Unknown',
                    timestamp: new Date().toISOString(),
                    userAgent: navigator.userAgent,
                    language: navigator.language,
                    screenResolution: `${screen.width}x${screen.height}`,
                    referrer: document.referrer || 'Direct'
                };

                // Send to your logging endpoint
                // OPTION 1: Use a free service like Formspree, Google Forms, or similar
                // OPTION 2: Use a serverless function (AWS Lambda, Cloudflare Workers, Vercel, etc.)
                // OPTION 3: Self-hosted simple logging endpoint

                await logVisitor(visitorInfo);
            }
        } catch (error) {
            // Silently fail - don't alert the visitor
            console.debug('Tracking initialization');
        }
    }

    // Function to send visitor data to your logging service
    async function logVisitor(data) {
        // OPTION 1: Formspree (Free tier available)
        // Sign up at formspree.io and get your endpoint
        // Replace YOUR_FORMSPREE_ID with your actual ID
        /*
        try {
            await fetch('https://formspree.io/f/YOUR_FORMSPREE_ID', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });
        } catch (e) {}
        */

        // OPTION 2: Google Apps Script Web App
        // Create a Google Sheet and use Apps Script to log visits
        // Replace YOUR_GOOGLE_SCRIPT_URL with your actual URL
        /*
        try {
            await fetch('YOUR_GOOGLE_SCRIPT_URL', {
                method: 'POST',
                mode: 'no-cors',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });
        } catch (e) {}
        */

        // OPTION 3: Store locally in browser and retrieve later
        // This stores visit data that you can view in browser console
        const visits = JSON.parse(localStorage.getItem('siteVisits') || '[]');
        visits.push(data);
        // Keep only last 100 visits
        if (visits.length > 100) {
            visits.shift();
        }
        localStorage.setItem('siteVisits', JSON.stringify(visits));

        // Log to console for testing (remove in production)
        console.log('Visitor tracked:', data);
    }

    // Run tracking when page loads
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', trackVisitor);
    } else {
        trackVisitor();
    }

})();

// Admin panel - Add ?admin=true to URL to view tracked visitors
// Example: http://yoursite.com?admin=true
if (window.location.search.includes('admin=true')) {
    const visits = JSON.parse(localStorage.getItem('siteVisits') || '[]');
    console.log('=== VISITOR LOG ===');
    console.table(visits);
    console.log('Total visits:', visits.length);

    // Create a simple admin panel
    const adminPanel = document.createElement('div');
    adminPanel.style.cssText = `
        position: fixed;
        top: 10px;
        right: 10px;
        background: white;
        border: 2px solid #667eea;
        border-radius: 10px;
        padding: 20px;
        max-width: 400px;
        max-height: 600px;
        overflow-y: auto;
        box-shadow: 0 4px 20px rgba(0,0,0,0.3);
        z-index: 10000;
        font-family: monospace;
        font-size: 12px;
    `;

    let html = `
        <h3 style="margin-top: 0; color: #667eea;">Visitor Log</h3>
        <button onclick="localStorage.removeItem('siteVisits'); location.reload();"
                style="padding: 5px 10px; background: #f44336; color: white; border: none; border-radius: 5px; cursor: pointer; margin-bottom: 10px;">
            Clear Log
        </button>
        <button onclick="this.parentElement.remove();"
                style="padding: 5px 10px; background: #666; color: white; border: none; border-radius: 5px; cursor: pointer; margin-bottom: 10px; margin-left: 5px;">
            Close
        </button>
        <p><strong>Total visits: ${visits.length}</strong></p>
    `;

    visits.reverse().forEach((visit, index) => {
        html += `
            <div style="border-top: 1px solid #ddd; padding: 10px 0; margin-top: 10px;">
                <strong>Visit #${visits.length - index}</strong><br>
                <strong>IP:</strong> ${visit.ip}<br>
                <strong>Location:</strong> ${visit.city}, ${visit.region}, ${visit.country}<br>
                <strong>ISP:</strong> ${visit.org}<br>
                <strong>Time:</strong> ${new Date(visit.timestamp).toLocaleString()}<br>
                <strong>Browser:</strong> ${visit.userAgent.substring(0, 50)}...<br>
                <strong>Screen:</strong> ${visit.screenResolution}<br>
                <strong>Referrer:</strong> ${visit.referrer}
            </div>
        `;
    });

    adminPanel.innerHTML = html;
    document.body.appendChild(adminPanel);
}
