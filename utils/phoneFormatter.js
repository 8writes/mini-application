export const formatPhoneNumber = (value) => {
  // Remove all non-digit characters
  const digits = value.replace(/\D/g, "");

  // Apply formatting: 080 3570 6535 (3-4-4 pattern)
  let formatted = "";
  if (digits.length > 0) {
    formatted += digits.substring(0, 3);
  }
  if (digits.length > 3) {
    formatted += " - " + digits.substring(3, 7);
  }
  if (digits.length > 7) {
    formatted += " - " + digits.substring(7, 11);
  }
  return formatted;
};
