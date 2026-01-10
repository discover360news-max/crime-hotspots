// src/js/components/FilterController.js
// Unified date range and region filtering logic for dashboards

/**
 * Filter Controller - manages date range and region filters with input synchronization
 */
export class FilterController {
  /**
   * @param {Object} config - Configuration object
   * @param {string} config.desktopStartInputId - Desktop start date input ID
   * @param {string} config.desktopEndInputId - Desktop end date input ID
   * @param {string} config.desktopApplyButtonId - Desktop apply button ID
   * @param {string} config.desktopClearButtonId - Desktop clear button ID
   * @param {string} config.mobileStartInputId - Mobile start date input ID
   * @param {string} config.mobileEndInputId - Mobile end date input ID
   * @param {string} config.mobileApplyButtonId - Mobile apply button ID
   * @param {string} config.mobileClearButtonId - Mobile clear button ID
   * @param {Function} config.onFilterChange - Callback when filters change (receives: regionFilter, dateRange)
   * @param {Function} config.onSubtitleUpdate - Callback to update subtitle display
   * @param {Function} config.onResetButtonUpdate - Callback to show/hide reset button
   */
  constructor(config) {
    this.config = config;
    this.currentRegion = null;
    this.currentDateRange = null;

    // Get DOM elements
    this.elements = {
      desktopStartInput: document.getElementById(config.desktopStartInputId),
      desktopEndInput: document.getElementById(config.desktopEndInputId),
      desktopApplyButton: document.getElementById(config.desktopApplyButtonId),
      desktopClearButton: document.getElementById(config.desktopClearButtonId),
      mobileStartInput: document.getElementById(config.mobileStartInputId),
      mobileEndInput: document.getElementById(config.mobileEndInputId),
      mobileApplyButton: document.getElementById(config.mobileApplyButtonId),
      mobileClearButton: document.getElementById(config.mobileClearButtonId)
    };

    this._initializeEventListeners();
  }

  /**
   * Initialize event listeners for all filter controls
   * @private
   */
  _initializeEventListeners() {
    const { elements } = this;

    // Desktop apply button
    if (elements.desktopApplyButton) {
      elements.desktopApplyButton.addEventListener('click', () => {
        this._applyDateFilter(elements.desktopStartInput, elements.desktopEndInput);
      });
    }

    // Desktop clear button
    if (elements.desktopClearButton) {
      elements.desktopClearButton.addEventListener('click', () => {
        this._clearDateFilter();
      });
    }

    // Mobile apply button
    if (elements.mobileApplyButton) {
      elements.mobileApplyButton.addEventListener('click', () => {
        this._applyDateFilter(elements.mobileStartInput, elements.mobileEndInput);
      });
    }

    // Mobile clear button
    if (elements.mobileClearButton) {
      elements.mobileClearButton.addEventListener('click', () => {
        this._clearDateFilter();
      });
    }
  }

  /**
   * Apply date filter from inputs
   * @private
   * @param {HTMLInputElement} startInput - Start date input element
   * @param {HTMLInputElement} endInput - End date input element
   */
  async _applyDateFilter(startInput, endInput) {
    const startDate = startInput.value;
    const endDate = endInput.value;

    if (!startDate || !endDate) {
      alert('Please select both start and end dates');
      return;
    }

    if (new Date(startDate) > new Date(endDate)) {
      alert('Start date must be before end date');
      return;
    }

    this.currentDateRange = { startDate, endDate };

    // Sync all inputs
    this._syncDateInputs(startDate, endDate);

    // Trigger filter change callback
    if (this.config.onFilterChange) {
      await this.config.onFilterChange(this.currentRegion?.name || null, this.currentDateRange);
    }

    // Update UI
    this._updateUI();
  }

  /**
   * Clear date filter
   * @private
   */
  async _clearDateFilter() {
    const { elements } = this;

    // Clear all inputs
    if (elements.desktopStartInput) elements.desktopStartInput.value = '';
    if (elements.desktopEndInput) elements.desktopEndInput.value = '';
    if (elements.mobileStartInput) elements.mobileStartInput.value = '';
    if (elements.mobileEndInput) elements.mobileEndInput.value = '';

    this.currentDateRange = null;

    // Trigger filter change callback
    if (this.config.onFilterChange) {
      await this.config.onFilterChange(this.currentRegion?.name || null, null);
    }

    // Update UI
    this._updateUI();
  }

  /**
   * Sync date inputs across desktop and mobile
   * @private
   * @param {string} startDate - Start date value
   * @param {string} endDate - End date value
   */
  _syncDateInputs(startDate, endDate) {
    const { elements } = this;
    if (elements.desktopStartInput) elements.desktopStartInput.value = startDate;
    if (elements.desktopEndInput) elements.desktopEndInput.value = endDate;
    if (elements.mobileStartInput) elements.mobileStartInput.value = startDate;
    if (elements.mobileEndInput) elements.mobileEndInput.value = endDate;
  }

  /**
   * Update subtitle and reset button visibility
   * @private
   */
  _updateUI() {
    if (this.config.onSubtitleUpdate) {
      this.config.onSubtitleUpdate(this.currentRegion, this.currentDateRange);
    }
    if (this.config.onResetButtonUpdate) {
      this.config.onResetButtonUpdate(this.currentRegion, this.currentDateRange);
    }
  }

  /**
   * Set region filter (called externally when region is clicked)
   * @param {Object|null} region - Region object {number, name} or null to clear
   */
  setRegion(region) {
    this.currentRegion = region;
    this._updateUI();
  }

  /**
   * Get current region filter
   * @returns {Object|null} Current region or null
   */
  getRegion() {
    return this.currentRegion;
  }

  /**
   * Get current date range filter
   * @returns {Object|null} Current date range or null
   */
  getDateRange() {
    return this.currentDateRange;
  }

  /**
   * Clear all filters
   */
  async clearAllFilters() {
    const { elements } = this;

    // Clear date inputs
    if (elements.desktopStartInput) elements.desktopStartInput.value = '';
    if (elements.desktopEndInput) elements.desktopEndInput.value = '';
    if (elements.mobileStartInput) elements.mobileStartInput.value = '';
    if (elements.mobileEndInput) elements.mobileEndInput.value = '';

    this.currentDateRange = null;
    this.currentRegion = null;

    // Trigger filter change callback
    if (this.config.onFilterChange) {
      await this.config.onFilterChange(null, null);
    }

    // Update UI
    this._updateUI();
  }
}
