// The Header and Footer Imports
import { readerHeader } from "./header.js";
import { readerFooter } from "./footer.js";

// Initialize UI elements across all pages
document.addEventListener("DOMContentLoaded", () => {
    try {
        readerHeader();
        readerFooter();
        console.log("TaleTrove global scripts initialized.");
    } catch (err) {
        console.error("Header/Footer failed to load:", err);
    }

    // --- Improved Install Card Logic ---
    const installCard = document.getElementById("installCard");
    
    if (installCard) {
        const ua = navigator.userAgent;
        
        // 1. Check if the device is Android
        const isAndroid = /Android/i.test(ua);
        
        // 2. Check if the user is inside a WebView (the App)
        // Most Android WebViews include "; wv" or "Version/X.X" with "Chrome"
        const isWebView = /wv|Version\/[.0-9]+/i.test(ua) && /Chrome/i.test(ua);

        // Logic: Hide the card if NOT Android OR if it IS the App (WebView)
        if (!isAndroid || isWebView) {
            installCard.style.display = "none";
        }
    }
});

