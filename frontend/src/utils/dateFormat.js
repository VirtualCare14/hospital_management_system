/**
 * Format a date string to a readable format like "16 June 2026" or "05 January 2027"
 * @param {string|Date} dateInput - The date string or Date object to format
 * @returns {string} Formatted date string (e.g., "16 June 2026")
 */
export const formatDate = (dateInput) => {
  if (!dateInput) return '-';
  
  const date = new Date(dateInput);
  if (isNaN(date.getTime())) return dateInput; // Return as-is if invalid
  
  const day = date.getDate().toString().padStart(2, '0');
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  const month = monthNames[date.getMonth()];
  const year = date.getFullYear();
  
  return `${day} ${month} ${year}`;
};

/**
 * Format a date string to a short readable format like "16 Jun 2026"
 * @param {string|Date} dateInput - The date string or Date object to format
 * @returns {string} Formatted date string (e.g., "16 Jun 2026")
 */
export const formatDateShort = (dateInput) => {
  if (!dateInput) return '-';
  
  const date = new Date(dateInput);
  if (isNaN(date.getTime())) return dateInput; // Return as-is if invalid
  
  const day = date.getDate().toString().padStart(2, '0');
  const monthNames = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
  ];
  const month = monthNames[date.getMonth()];
  const year = date.getFullYear();
  
  return `${day} ${month} ${year}`;
};