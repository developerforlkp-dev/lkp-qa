import React from "react";
import ReactDOM from "react-dom";
import App from "./App";

// ✅ Global error handler to prevent unhandled promise rejections from showing alerts
// This MUST be set up before React renders to catch early errors
if (typeof window !== 'undefined') {
  // Set up error handler immediately
  const handleUnhandledRejection = (event) => {
    // CRITICAL: Always prevent the default browser alert
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();
    
    // Log the error instead of showing alert
    const error = event.reason;
    
    // Check if error is already marked as handled
    if (error?.isHandled) {
      return; // Already handled, don't log again    
    }
    
    // Handle different error types
    if (error?.response) {
      // Axios error
      const status = error.response.status;
      const message = error.response.data?.message || error.message || 'Request failed';
      
      // Only log, don't show alert
      if (status === 400) {
        console.warn(`⚠️ Unhandled 400 Error: ${message}`, {
          url: error.config?.url,
          status: status,
          data: error.response.data
        });
      } else {
        console.error(`❌ Unhandled API Error ${status}: ${message}`, error);
      }
    } else if (error?.message) {
      // Error with message - check for 400 status code in message
      const errorMessage = String(error.message);
      if (errorMessage.includes('400') || errorMessage.includes('Request failed with status code 400')) {
        console.warn('⚠️ Unhandled 400 Error:', errorMessage);
      } else {
        console.error('❌ Unhandled Promise Rejection:', errorMessage, error);
      }
    } else {
      // Other error
      console.error('❌ Unhandled Promise Rejection:', error);
    }
  };
  
  // Register handler with highest priority
  window.addEventListener('unhandledrejection', handleUnhandledRejection, true);
  
  // Also register in capture phase for maximum coverage
  window.addEventListener('unhandledrejection', handleUnhandledRejection, { capture: true, passive: false });
}

ReactDOM.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
  document.getElementById("root")
);
