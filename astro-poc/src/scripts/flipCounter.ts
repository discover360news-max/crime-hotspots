/**
 * Flip Counter Animation Logic
 * Animates split-flap style digits from 0 to target value
 */

interface FlipCounterOptions {
  duration?: number; // Total animation duration in ms
  staggerDelay?: number; // Delay between digit animations in ms
}

/**
 * Initialize and animate a flip counter
 * @param containerId - ID of the container element
 * @param targetValue - The final number to display
 * @param options - Animation configuration
 */
export function initFlipCounter(
  containerId: string,
  targetValue: number,
  options: FlipCounterOptions = {}
): void {
  const { duration = 2000, staggerDelay = 100 } = options;

  const container = document.getElementById(containerId);
  if (!container) {
    console.error(`Flip counter container not found: ${containerId}`);
    return;
  }

  const digits = container.querySelectorAll<HTMLElement>('.flip-digit');
  const targetString = targetValue.toString();
  const paddedTarget = targetString.padStart(digits.length, '0');

  // Calculate timing per digit
  const flipDuration = 300; // ms per flip
  const totalFlips = Math.max(...paddedTarget.split('').map(Number)) + 1;

  // Animate each digit
  digits.forEach((digit, index) => {
    const targetDigit = parseInt(paddedTarget[index], 10);
    const isLeadingZero = index < digits.length - targetString.length;

    // Start with digit hidden if it will be a leading zero
    if (isLeadingZero && targetDigit === 0) {
      digit.classList.add('hidden');
      return;
    }

    // Animate to target digit
    animateDigit(digit, targetDigit, {
      delay: index * staggerDelay,
      flipDuration,
      showWhenNonZero: isLeadingZero
    });
  });
}

interface AnimateDigitOptions {
  delay: number;
  flipDuration: number;
  showWhenNonZero: boolean;
}

/**
 * Animate a single digit from 0 to target
 */
function animateDigit(
  digit: HTMLElement,
  targetDigit: number,
  options: AnimateDigitOptions
): void {
  const { delay, flipDuration, showWhenNonZero } = options;

  const topHalf = digit.querySelector('.flip-digit-top') as HTMLElement;
  const bottomHalf = digit.querySelector('.flip-digit-bottom') as HTMLElement;

  if (!topHalf || !bottomHalf) return;

  let currentDigit = 0;

  // Hide leading zeros initially
  if (showWhenNonZero && targetDigit === 0) {
    digit.classList.add('hidden');
    return;
  }

  setTimeout(() => {
    const flipInterval = setInterval(() => {
      if (currentDigit >= targetDigit) {
        clearInterval(flipInterval);
        return;
      }

      // Increment digit
      currentDigit++;

      // Show digit if it was hidden and now non-zero
      if (showWhenNonZero && currentDigit > 0) {
        digit.classList.remove('hidden');
      }

      // Trigger flip animation
      flipToDigit(digit, topHalf, bottomHalf, currentDigit);
    }, flipDuration);
  }, delay);
}

/**
 * Perform the visual flip animation for a digit change
 */
function flipToDigit(
  digit: HTMLElement,
  topHalf: HTMLElement,
  bottomHalf: HTMLElement,
  newDigit: number
): void {
  // Add flipping class for shadow effect
  digit.classList.add('flipping');

  // Create flip cards for animation
  const oldTopCard = document.createElement('div');
  oldTopCard.className = 'flip-card flip-card-top flip-digit-top';
  oldTopCard.textContent = topHalf.textContent;

  const newBottomCard = document.createElement('div');
  newBottomCard.className = 'flip-card flip-card-bottom flip-digit-bottom';
  newBottomCard.textContent = newDigit.toString();
  newBottomCard.style.transform = 'rotateX(90deg)';

  // Add flip cards to digit
  digit.querySelector('.flip-digit-inner')?.appendChild(oldTopCard);
  digit.querySelector('.flip-digit-inner')?.appendChild(newBottomCard);

  // Update the static halves immediately (they're behind the flip cards)
  topHalf.textContent = newDigit.toString();

  // Trigger animations
  requestAnimationFrame(() => {
    oldTopCard.classList.add('flipping');
    newBottomCard.classList.add('flipping');
  });

  // Clean up after animation
  setTimeout(() => {
    bottomHalf.textContent = newDigit.toString();
    oldTopCard.remove();
    newBottomCard.remove();
    digit.classList.remove('flipping');
  }, 450); // Slightly longer than animation duration
}

/**
 * Get the number of digits needed to display a value (no leading zeros)
 */
export function getDigitCount(value: number): number {
  if (value === 0) return 1;
  return Math.floor(Math.log10(Math.abs(value))) + 1;
}

/**
 * Initialize counter on page load
 */
export function initOnLoad(containerId: string, targetValue: number): void {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      initFlipCounter(containerId, targetValue);
    });
  } else {
    // Small delay for smoother visual effect
    setTimeout(() => {
      initFlipCounter(containerId, targetValue);
    }, 300);
  }
}
