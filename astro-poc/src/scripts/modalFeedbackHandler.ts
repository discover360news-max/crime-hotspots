/**
 * Modal Feedback Handler
 * Initializes vote buttons and share buttons for dynamically-rendered
 * feedback HTML inside the CrimeDetailModal.
 */

/** Bind vote + share event listeners on a feedback toggle container */
export function initModalFeedbackToggle(container: HTMLElement | null): void {
  if (!container) return;

  const areaName = container.dataset.area || '';
  const pageUrl = container.dataset.url || window.location.href;
  const pageTitle = container.dataset.title || document.title;
  const key = `feedback_safety_${areaName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')}`;

  const voteEl = container.querySelector('.feedback-vote') as HTMLElement | null;
  const thanksEl = container.querySelector('.feedback-thanks') as HTMLElement | null;
  if (!voteEl || !thanksEl) return;

  // Already voted — state is handled by generateFeedbackToggleHTML
  if (localStorage.getItem(key) !== null) return;

  container.querySelectorAll('.feedback-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const vote = (btn as HTMLElement).dataset.vote || 'yes';
      localStorage.setItem(key, vote);

      voteEl.classList.add('hidden');
      thanksEl.classList.remove('hidden');

      const spark = thanksEl.querySelector('.feedback-spark');
      if (spark) {
        spark.classList.add('animate');
        setTimeout(() => spark.classList.remove('animate'), 700);
      }
    });
  });

  container.querySelector('.feedback-share-twitter')?.addEventListener('click', () => {
    const text = encodeURIComponent(pageTitle);
    const url = encodeURIComponent(pageUrl);
    window.open(`https://twitter.com/intent/tweet?text=${text}&url=${url}`, '_blank', 'width=550,height=420');
  });

  container.querySelector('.feedback-share-facebook')?.addEventListener('click', () => {
    const url = encodeURIComponent(pageUrl);
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}`, '_blank', 'width=550,height=420');
  });

  container.querySelector('.feedback-share-whatsapp')?.addEventListener('click', () => {
    const text = encodeURIComponent(`${pageTitle} - ${pageUrl}`);
    window.open(`https://wa.me/?text=${text}`, '_blank');
  });
}
