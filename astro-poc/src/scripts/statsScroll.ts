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
  // Called from astro:page-load in dashboard.astro — DOM is ready at this point
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

    // Hide scroll hint when scrolled to end
    const scrollHint = document.getElementById('statsScrollHint');
    if (scrollHint) {
      function checkStatsScroll() {
        const el = statsContainer as HTMLElement;
        // Don't show hint while shimmer is still visible (content opacity is 0)
        if (el.style.opacity === '0' || el.style.opacity === '') return;

        const isScrollable = el.scrollWidth > el.clientWidth;
        const isAtEnd = el.scrollLeft + el.clientWidth >= el.scrollWidth - 10;

        if (!isScrollable || isAtEnd) {
          scrollHint!.style.opacity = '0';
        } else {
          scrollHint!.style.opacity = '1';
        }
      }

      (statsContainer as HTMLElement).addEventListener('scroll', checkStatsScroll);
      window.addEventListener('resize', checkStatsScroll);
      setTimeout(checkStatsScroll, 100);
    }

    console.log('✅ Stats horizontal scroll initialized');
  }
}
