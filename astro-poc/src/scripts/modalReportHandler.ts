/**
 * Modal Report Issue Handler
 * Populates hidden ReportIssueModal form fields with current crime data
 * and opens the report modal. Uses a getter function so it always reads
 * the latest crime data (even after in-place navigation).
 */

/** Initialize the Report Issue button handler */
export function initReportIssueHandler(getCrimeData: () => any): void {
  const modalReportIssueBtn = document.getElementById('modalReportIssueBtn');
  if (!modalReportIssueBtn) return;

  modalReportIssueBtn.addEventListener('click', () => {
    const crimeData = getCrimeData();
    if (!crimeData) {
      console.error('No crime data available');
      return;
    }

    // Update hidden form fields with current crime data
    const form = document.getElementById('modalreportIssueForm') as HTMLFormElement | null;
    if (!form) {
      console.error('Form not found: modalreportIssueForm');
      return;
    }

    try {
      // Update required hidden fields
      const slugInput = form.querySelector('input[name="crimeSlug"]') as HTMLInputElement | null;
      const headlineInput = form.querySelector('input[name="crimeHeadline"]') as HTMLInputElement | null;
      const dateInput = form.querySelector('input[name="crimeDate"]') as HTMLInputElement | null;
      const typeInput = form.querySelector('input[name="crimeType"]') as HTMLInputElement | null;
      const areaInput = form.querySelector('input[name="crimeArea"]') as HTMLInputElement | null;
      const regionInput = form.querySelector('input[name="crimeRegion"]') as HTMLInputElement | null;

      if (!slugInput || !headlineInput || !dateInput || !typeInput || !areaInput || !regionInput) {
        console.error('Required form fields not found', {
          slug: !!slugInput,
          headline: !!headlineInput,
          date: !!dateInput,
          type: !!typeInput,
          area: !!areaInput,
          region: !!regionInput
        });
        return;
      }

      slugInput.value = crimeData.slug || '';
      headlineInput.value = crimeData.headline || '';
      dateInput.value = crimeData.date || '';
      typeInput.value = crimeData.crimeType || '';
      areaInput.value = crimeData.area || '';
      regionInput.value = crimeData.region || '';

      // Update optional fields
      const streetInput = form.querySelector('input[name="crimeStreet"]') as HTMLInputElement | null;
      if (streetInput) streetInput.value = crimeData.street || '';

      const summaryInput = form.querySelector('input[name="crimeSummary"]') as HTMLInputElement | null;
      if (summaryInput) summaryInput.value = crimeData.summary || '';

      const sourceInput = form.querySelector('input[name="crimeSource"]') as HTMLInputElement | null;
      if (sourceInput) sourceInput.value = crimeData.source || '';

      const urlInput = form.querySelector('input[name="crimeUrl"]') as HTMLInputElement | null;
      if (urlInput) urlInput.value = crimeData.url || '';

      // Update preview text in the modal
      const previewHeadline = form.querySelector('.text-sm.font-semibold.text-slate-700');
      if (previewHeadline) previewHeadline.textContent = crimeData.headline || '';

      const previewMeta = form.querySelector('.text-xs.text-slate-500.mt-1');
      if (previewMeta) previewMeta.textContent = `${crimeData.date || ''} • ${crimeData.area || ''}`;
    } catch (error) {
      console.error('Error populating form fields:', error);
      return;
    }

    // Directly open the ReportIssueModal
    const reportIssueModal = document.getElementById('modalreportIssueModal');
    const reportIssueContent = document.getElementById('modalreportIssueContent');

    if (reportIssueModal && reportIssueContent) {
      reportIssueModal.classList.remove('invisible', 'opacity-0');
      reportIssueModal.classList.add('visible', 'opacity-100');
      setTimeout(() => {
        reportIssueContent.classList.remove('opacity-0', 'scale-95');
        reportIssueContent.classList.add('opacity-100', 'scale-100');
      }, 50);

      // Trigger Turnstile rendering
      window.dispatchEvent(new CustomEvent('openReportIssueModal', { detail: { idPrefix: 'modal' } }));
    }
  });
}
