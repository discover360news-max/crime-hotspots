/**
 * Stats Scroll Script
 * Enables mouse wheel horizontal scrolling for stats cards container
 * Reusable across any page with horizontally scrollable content
 */

/**
 * Initialize horizontal scroll behavior
 * @param wrapperSelector - CSS selector for the wrapper element
 * @param containerSelector - CSS selector for the scrollable container
 */
export function initializeStatsScroll(
  wrapperSelector: string = '.stats-wrapper',
  containerSelector: string = '.stats-scroll-container'
) {
  document.addEventListener('DOMContentLoaded', () => {
    const statsWrapper = document.querySelector(wrapperSelector);
    const statsContainer = document.querySelector(containerSelector);

    if (statsWrapper && statsContainer) {
      statsWrapper.addEventListener('wheel', (e) => {
        // Only apply horizontal scroll if user is scrolling vertically
        if ((e as WheelEvent).deltaY !== 0) {
          e.preventDefault();
          (statsContainer as HTMLElement).scrollLeft += (e as WheelEvent).deltaY;
        }
      }, { passive: false }); // passive: false allows preventDefault()

      console.log('✅ Stats horizontal scroll initialized');
    } else {
      console.warn('⚠️ Stats scroll elements not found');
    }
  });
}
