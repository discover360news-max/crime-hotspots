/**
 * Report Form Validation
 * Comprehensive validation for anonymous crime reports
 */

import { COUNTRIES } from '../data/countries';

/**
 * Validate entire report form
 * @param formData - FormData object from form submission
 * @returns Array of error messages (empty if valid)
 */
export function validateForm(formData: FormData): string[] {
  const errors: string[] = [];

  // Date validation
  const dateErrors = validateDate(formData.get('reportDate') as string);
  errors.push(...dateErrors);

  // Headline validation
  const headlineErrors = validateHeadline(formData.get('reportHeadline') as string);
  errors.push(...headlineErrors);

  // Details validation
  const detailsErrors = validateDetails(formData.get('reportDetails') as string);
  errors.push(...detailsErrors);

  // Country validation
  const countryErrors = validateCountry(formData.get('reportCountry') as string);
  errors.push(...countryErrors);

  // Crime type validation
  const crimeTypeErrors = validateCrimeType(formData.get('reportCrimeType') as string);
  errors.push(...crimeTypeErrors);

  return errors;
}

/**
 * Validate date of incident
 * Rules:
 * - Must be valid date
 * - Cannot be in the future
 * - Cannot be more than 1 year ago
 */
export function validateDate(dateStr: string): string[] {
  const errors: string[] = [];

  const date = new Date(dateStr);
  const today = new Date();
  const oneYearAgo = new Date();
  oneYearAgo.setFullYear(today.getFullYear() - 1);

  if (isNaN(date.getTime())) {
    errors.push('Invalid date format');
  } else if (date > today) {
    errors.push('Date cannot be in the future');
  } else if (date < oneYearAgo) {
    errors.push('Please report incidents from the past year only');
  }

  return errors;
}

/**
 * Validate headline
 * Rules:
 * - Minimum 10 characters
 * - Maximum 120 characters
 * - No script tags or malicious content
 */
export function validateHeadline(headline: string): string[] {
  const errors: string[] = [];

  if (!headline || headline.trim().length < 10) {
    errors.push('Headline must be at least 10 characters');
  }

  if (headline && headline.length > 120) {
    errors.push('Headline must be under 120 characters');
  }

  if (headline && /<script|javascript:|data:|vbscript:/i.test(headline)) {
    errors.push('Headline contains invalid characters');
  }

  return errors;
}

/**
 * Validate details/description
 * Rules:
 * - Minimum 20 characters
 * - Maximum 5000 characters
 */
export function validateDetails(details: string): string[] {
  const errors: string[] = [];

  if (!details || details.trim().length < 20) {
    errors.push('Please provide at least 20 characters of details');
  }

  if (details && details.length > 5000) {
    errors.push('Details must be under 5000 characters');
  }

  return errors;
}

/**
 * Validate country selection
 * Rules:
 * - Must be selected
 * - Must exist in COUNTRIES list
 */
export function validateCountry(countryId: string): string[] {
  const errors: string[] = [];

  if (!countryId || !COUNTRIES.some(c => c.id === countryId)) {
    errors.push('Invalid country selection');
  }

  return errors;
}

/**
 * Validate crime type
 * Rules:
 * - Must be selected
 * - Must be in predefined list
 */
export function validateCrimeType(crimeType: string): string[] {
  const errors: string[] = [];

  const validCrimes = [
    'Assault',
    'Burglary',
    'Home Invasion',
    'Kidnapping',
    'Murder',
    'Robbery',
    'Shooting',
    'Seizures',
    'Theft',
    'Other'
  ];

  if (!crimeType || !validCrimes.includes(crimeType)) {
    errors.push('Invalid crime type');
  }

  return errors;
}
