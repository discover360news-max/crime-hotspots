// src/js/components/RegionTray.js
// Unified mobile region selector tray component

/**
 * Region Tray Controller - manages mobile region selector slide-out tray
 */
export class RegionTray {
  /**
   * @param {Object} config - Configuration object
   * @param {string} config.trayId - ID of the tray container
   * @param {string} config.overlayId - ID of the backdrop overlay
   * @param {string} config.openButtonId - ID of button to open tray
   * @param {string} config.closeButtonId - ID of button to close tray
   * @param {string} config.resetButtonId - ID of reset filter button in tray
   * @param {string} config.mobileMapContainerId - ID of mobile map container
   * @param {Function} config.createMapFn - Function to create map instance (receives onClick callback)
   * @param {Function} config.onReset - Callback when reset button clicked
   */
  constructor(config) {
    this.config = config;

    // Get DOM elements
    this.elements = {
      tray: document.getElementById(config.trayId),
      overlay: document.getElementById(config.overlayId),
      openButton: document.getElementById(config.openButtonId),
      closeButton: document.getElementById(config.closeButtonId),
      resetButton: document.getElementById(config.resetButtonId),
      mobileMapContainer: document.getElementById(config.mobileMapContainerId)
    };

    this.mapInstance = null;
    this._initializeMap();
    this._initializeEventListeners();
  }

  /**
   * Initialize the mobile map
   * @private
   */
  _initializeMap() {
    const { mobileMapContainer } = this.elements;
    if (!mobileMapContainer || !this.config.createMapFn) return;

    try {
      // Create map with click handler that closes tray
      this.mapInstance = this.config.createMapFn((regionNumber, regionName) => {
        this.close();
      });

      mobileMapContainer.innerHTML = '';
      mobileMapContainer.appendChild(this.mapInstance.element);
    } catch (error) {
      console.error('Error creating mobile map:', error);
    }
  }

  /**
   * Initialize event listeners
   * @private
   */
  _initializeEventListeners() {
    const { openButton, closeButton, overlay, resetButton } = this.elements;

    // Open button
    if (openButton) {
      openButton.addEventListener('click', () => {
        this.open();
      });
    }

    // Close button
    if (closeButton) {
      closeButton.addEventListener('click', () => {
        this.close();
      });
    }

    // Overlay click
    if (overlay) {
      overlay.addEventListener('click', () => {
        this.close();
      });
    }

    // Reset button
    if (resetButton) {
      resetButton.addEventListener('click', async () => {
        try {
          if (this.config.onReset) {
            await this.config.onReset();
          }
          this.close();
        } catch (error) {
          console.error('Error resetting filters from tray:', error);
          // Still close tray even if reset fails
          this.close();
        }
      });
    }
  }

  /**
   * Open the tray
   */
  open() {
    const { tray, overlay } = this.elements;

    try {
      if (tray && overlay) {
        tray.classList.remove('translate-x-full');
        overlay.classList.remove('opacity-0', 'pointer-events-none');
        if (document.body) {
          document.body.style.overflow = 'hidden'; // Prevent scrolling
        }
      }
    } catch (error) {
      console.error('Error opening tray:', error);
    }
  }

  /**
   * Close the tray
   */
  close() {
    const { tray, overlay } = this.elements;

    try {
      if (tray && overlay) {
        tray.classList.add('translate-x-full');
        overlay.classList.add('opacity-0', 'pointer-events-none');
        if (document.body) {
          document.body.style.overflow = ''; // Re-enable scrolling
        }
      }
    } catch (error) {
      console.error('Error closing tray:', error);
    }
  }

  /**
   * Get the mobile map instance
   * @returns {Object|null} Map instance or null
   */
  getMapInstance() {
    return this.mapInstance;
  }
}
