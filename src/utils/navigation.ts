// A utility file to handle navigation in the application
// This avoids circular dependencies between the auth store and router components

// Keep track of the navigation function
let navigateFn: ((to: string) => void) | null = null;

// Set the navigate function (should be called in App.tsx)
export const setNavigate = (fn: (to: string) => void) => {
  navigateFn = fn;
};

// Use this function to navigate programmatically
export const navigate = (to: string) => {
  if (navigateFn) {
    navigateFn(to);
  } else {
    console.warn('Navigate function not set. Call setNavigate first.');
    // Fallback to window.location if navigate isn't set
    window.location.href = to;
  }
};