// Simple snackbar utility for showing notifications
let snackbarQueue = [];

export const showSnackbar = (message, severity = 'info', duration = 3000) => {
  snackbarQueue.push({ message, severity, duration, id: Date.now() });
  
  // Trigger custom event to notify components
  window.dispatchEvent(new CustomEvent('showSnackbar', { 
    detail: { message, severity, duration, id: Date.now() } 
  }));
};

export const getNextSnackbar = () => {
  return snackbarQueue.shift();
};

export const clearSnackbarQueue = () => {
  snackbarQueue = [];
};
