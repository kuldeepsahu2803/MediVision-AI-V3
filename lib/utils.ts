
/**
 * Formats a date string into "Month Day, Year" format.
 * Handles various input formats like YYYY-MM-DD, DD-MM-YYYY, or valid Date objects.
 * @param dateString The date string to format.
 * @returns The formatted date string or 'N/A' if invalid.
 */
export const formatDate = (dateString?: string): string => {
  if (!dateString) return 'N/A';
  
  let date: Date;

  // Handle DD-MM-YYYY format (e.g. from some OCR results)
  if (/^\d{2}-\d{2}-\d{4}$/.test(dateString)) {
      const parts = dateString.split('-');
      // new Date(year, monthIndex, day)
      date = new Date(Number(parts[2]), Number(parts[1]) - 1, Number(parts[0]));
  }
  // Handle exactly YYYY-MM-DD format (Date-only)
  // We use slashes to prevent JS from assuming UTC midnight and shifting the date
  else if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
    date = new Date(dateString.replace(/-/g, '/'));
  } 
  // Handle full ISO strings or other formats (preserve time info)
  else {
    date = new Date(dateString);
  }

  // Check if the created date is valid
  if (isNaN(date.getTime())) {
    return dateString; // Return original string if it's not a parsable date
  }

  // Use local timezone (remove timeZone: 'UTC') to ensure scan times reflect user's clock
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};


/**
 * Removes null characters and other non-printable control characters from a string.
 * This is crucial for preventing corruption in generated files like PDFs.
 * @param str The input value. It will be converted to a string.
 * @returns A sanitized string.
 */
export const sanitizeString = (str?: any): string => {
  if (str === null || typeof str === 'undefined') {
    return '';
  }
  // Coerce input to a string to prevent "str.replace is not a function" errors
  // if a non-string value (like a number for dosage) is passed from the AI.
  const stringValue = String(str);
  
  // Remove NUL character and other control characters, but keep whitespace like tabs and newlines.
  // eslint-disable-next-line no-control-regex
  return stringValue.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '').trim();
};
