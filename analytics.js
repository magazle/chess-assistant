/**
 * Vercel Web Analytics initialization
 * This script injects the Vercel Analytics tracking code into the page.
 */

// Import the inject function from @vercel/analytics
import { inject } from 'https://cdn.jsdelivr.net/npm/@vercel/analytics@2/+esm';

// Initialize Vercel Web Analytics
inject();
