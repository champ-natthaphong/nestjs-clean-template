/**
 * API Path Constants
 *
 * Maps backend service names to their YAML config paths.
 * Used by ConfigValidatorService to validate endpoints at startup.
 *
 * @example
 * export const API_PATHS = {
 *   atn: {
 *     sub_profile: 'external.atn.sub-profile',
 *     package_detail: 'external.atn.package-detail',
 *   },
 * };
 */
export const API_PATHS: Record<string, Record<string, string>> = {
  // Define your external API config paths here
};
