/**
 * Modal Share Handlers
 * Wires up Twitter/X, Facebook, WhatsApp, and Copy Link share buttons
 * in the CrimeDetailModal. Uses getter functions so handlers always
 * read the current crime's URL/headline (even after in-place navigation).
 */

/** Initialize share button event listeners */
export function initShareHandlers(getUrl: () => string, getHeadline: () => string): void {
  const shareTwitterBtn = document.getElementById('shareTwitterBtn');
  const shareFacebookBtn = document.getElementById('shareFacebookBtn');
  const shareWhatsAppBtn = document.getElementById('shareWhatsAppBtn');
  const copyLinkBtn = document.getElementById('copyLinkBtn');
  const copyFeedback = document.getElementById('copyFeedback');

  shareTwitterBtn?.addEventListener('click', () => {
    const text = encodeURIComponent(getHeadline());
    const url = encodeURIComponent(getUrl());
    window.open(`https://twitter.com/intent/tweet?text=${text}&url=${url}`, '_blank', 'width=550,height=420');
  });

  shareFacebookBtn?.addEventListener('click', () => {
    const url = encodeURIComponent(getUrl());
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}`, '_blank', 'width=550,height=420');
  });

  shareWhatsAppBtn?.addEventListener('click', () => {
    const text = encodeURIComponent(`${getHeadline()} - ${getUrl()}`);
    window.open(`https://wa.me/?text=${text}`, '_blank');
  });

  if (copyLinkBtn && copyFeedback) {
    copyLinkBtn.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(getUrl());
        copyFeedback.classList.remove('opacity-0');
        copyFeedback.classList.add('opacity-100');
        setTimeout(() => {
          copyFeedback.classList.remove('opacity-100');
          copyFeedback.classList.add('opacity-0');
        }, 2000);
      } catch (err) {
        console.error('Failed to copy:', err);
      }
    });
  }
}
