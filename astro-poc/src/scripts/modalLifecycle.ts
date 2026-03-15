/**
 * Modal Lifecycle
 * Handles CrimeDetailModal open/close animations, browser history management,
 * and keyboard/backdrop close behaviors.
 *
 * Uses element IDs rather than captured refs so every DOM access is always
 * fresh — critical for Astro View Transitions where the body is replaced on
 * each SPA navigation. Module scripts run once; if we captured refs at init
 * time they would point to detached (stale) elements after the first page swap.
 */

import { buildRoute } from '../config/routes';

interface ModalElementIds {
  backdropId: string;
  modalId: string;
  contentId: string;
}

export interface ModalLifecycle {
  open(): void;
  close(skipHistory?: boolean): void;
  isOpen(): boolean;
  pushUrl(crimeSlug: string): void;
  replaceUrl(crimeSlug: string): void;
  setOriginalUrl(url: string): void;
}

/** Create a modal lifecycle controller with animation + history management */
export function createModalLifecycle(ids: ModalElementIds): ModalLifecycle {
  const { backdropId, modalId, contentId } = ids;
  let originalUrl = '';
  let isClosing = false;

  function isOpen(): boolean {
    return !(document.getElementById(backdropId)?.classList.contains('hidden') ?? true);
  }

  function open(): void {
    const backdrop = document.getElementById(backdropId) as HTMLElement;
    const modal = document.getElementById(modalId) as HTMLElement;
    const content = document.getElementById(contentId) as HTMLElement;
    if (!backdrop || !modal || !content) return;

    isClosing = false;
    backdrop.classList.remove('hidden', 'pointer-events-none');
    modal.classList.remove('hidden');
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
    document.body.style.overflow = 'hidden';
    if (scrollbarWidth > 0) document.body.style.paddingRight = scrollbarWidth + 'px';

    requestAnimationFrame(() => {
      backdrop.classList.remove('opacity-0');
      backdrop.classList.add('opacity-100');
      content.classList.remove('scale-95', 'opacity-0');
      content.classList.add('scale-100', 'opacity-100');
    });
  }

  function close(skipHistory = false): void {
    if (isClosing) return;
    isClosing = true;

    // Restore original URL (skip if triggered by back button — browser already handled it)
    if (!skipHistory && originalUrl) {
      history.back();
    }
    originalUrl = '';

    const backdrop = document.getElementById(backdropId) as HTMLElement;
    const content = document.getElementById(contentId) as HTMLElement;
    backdrop?.classList.remove('opacity-100');
    backdrop?.classList.add('opacity-0');
    content?.classList.remove('scale-100', 'opacity-100');
    content?.classList.add('scale-95', 'opacity-0');

    setTimeout(() => {
      document.getElementById(backdropId)?.classList.add('hidden', 'pointer-events-none');
      document.getElementById(modalId)?.classList.add('hidden');
      document.body.style.overflow = '';
      document.body.style.paddingRight = '';
      isClosing = false;
    }, 300);
  }

  /** Clean up body state when a link navigation happens while the modal is open.
   *  The new page's modal elements will already be hidden by default; we just
   *  need to release the scroll lock on <body>. */
  function resetForNavigation(): void {
    originalUrl = '';
    isClosing = false;
    document.body.style.overflow = '';
    document.body.style.paddingRight = '';
  }

  function pushUrl(crimeSlug: string): void {
    history.pushState({ crimeModal: true }, '', buildRoute.crime(crimeSlug));
  }

  function replaceUrl(crimeSlug: string): void {
    history.replaceState({ crimeModal: true }, '', buildRoute.crime(crimeSlug));
  }

  function setOriginalUrl(url: string): void {
    originalUrl = url;
  }

  // Back button closes modal instead of navigating away
  window.addEventListener('popstate', () => {
    if (isOpen() && !isClosing) {
      close(true); // skipHistory — browser already went back
    }
  });

  // Escape key closes modal
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && isOpen()) {
      close();
    }
  });

  return { open, close, isOpen, pushUrl, replaceUrl, setOriginalUrl };
}
