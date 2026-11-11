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
});
