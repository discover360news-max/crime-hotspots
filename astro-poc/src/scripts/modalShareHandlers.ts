/**
 * Modal Share Handlers
 * Wires up Twitter/X, Facebook, WhatsApp, and Copy Link share buttons
 * in the CrimeDetailModal.
 *
 * Uses event delegation on document (not direct element refs) so the handlers
 * survive Astro View Transitions body swaps without going stale.
 */

/** Initialize share button event listeners */
export function initShareHandlers(getUrl: () => string, getHeadline: () => string): void {
  document.addEventListener('click', (e) => {
    const target = e.target as HTMLElement;

    if (target.closest('#shareTwitterBtn')) {
      const text = encodeURIComponent(getHeadline());
      const url = encodeURIComponent(getUrl());
      window.open(`https://twitter.com/intent/tweet?text=${text}&url=${url}`, '_blank', 'width=550,height=420');

    } else if (target.closest('#shareFacebookBtn')) {
      const url = encodeURIComponent(getUrl());
      window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}`, '_blank', 'width=550,height=420');

    } else if (target.closest('#shareWhatsAppBtn')) {
      const text = encodeURIComponent(`${getHeadline()} - ${getUrl()}`);
      window.open(`https://wa.me/?text=${text}`, '_blank');

    } else if (target.closest('#copyLinkBtn')) {
      navigator.clipboard.writeText(getUrl()).then(() => {
        const copyFeedback = document.getElementById('copyFeedback');
        if (copyFeedback) {
          copyFeedback.classList.remove('opacity-0');
          copyFeedback.classList.add('opacity-100');
          setTimeout(() => {
            copyFeedback.classList.remove('opacity-100');
            copyFeedback.classList.add('opacity-0');
          }, 2000);
        }
      }).catch(err => console.error('Failed to copy:', err));
    }
  });
}
