/**
 * API Path Constants
 *
 * Maps backend service names to their YAML config paths.
 * Used by ConfigValidatorService to validate endpoints at startup.
 *
 * @example
 * export const API_PATHS = {
 *  payments: { get_invoice: 'external.payments.get-invoice' }
 * };
 */
export const API_PATHS: Record<string, Record<string, string>> = {
  // Define your external API config paths here
};
