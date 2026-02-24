/**
 * Modal Lifecycle
 * Handles CrimeDetailModal open/close animations, browser history management,
 * and keyboard/backdrop close behaviors.
 */

import { buildRoute } from '../config/routes';

interface ModalElements {
  backdrop: HTMLElement;
  modal: HTMLElement;
  content: HTMLElement;
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
export function createModalLifecycle(elements: ModalElements): ModalLifecycle {
  const { backdrop, modal, content } = elements;
  let originalUrl = '';

  function isOpen(): boolean {
    return !backdrop.classList.contains('hidden');
  }

  function open(): void {
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
    // Restore original URL (skip if triggered by back button — browser already handled it)
    if (!skipHistory && originalUrl) {
      history.back();
    }
    originalUrl = '';

    backdrop.classList.remove('opacity-100');
    backdrop.classList.add('opacity-0');
    content.classList.remove('scale-100', 'opacity-100');
    content.classList.add('scale-95', 'opacity-0');

    setTimeout(() => {
      backdrop.classList.add('hidden', 'pointer-events-none');
      modal.classList.add('hidden');
      document.body.style.overflow = '';
      document.body.style.paddingRight = '';
    }, 300);
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
    if (isOpen()) {
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
