/**
 * Sanitize a string by removing path traversal characters.
 *
 * Strips: backslashes (\), dots (.), forward slashes (/), percent (%), asterisks (*)
 *
 * Used primarily to sanitize ZONE env variable before using it in file paths.
 */
export const removePathTraversalCharacters = (str: string | undefined): string => {
  if (!str) return '';
  return str.replace(/[\\./%*]+/g, '');
};
