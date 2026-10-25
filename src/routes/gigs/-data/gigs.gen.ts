/* Generated from gigs.schema.json. Do not edit by hand. */

/**
 * Main/co-billed artists, excluding support acts.
 *
 * @minItems 1
 */
export type Artists = [NonBlankString, ...NonBlankString[]];
export type NonBlankString = string;
/**
 * Optional support acts. Omit when none are recorded.
 *
 * @minItems 1
 */
export type Artists1 = [NonBlankString, ...NonBlankString[]];

/**
 * Attended music events
 */
export interface GigHistory {
  /**
   * Location of the JSON Schema used to validate this file.
   */
  $schema?: string;
  events: GigEvent[];
}
export interface GigEvent {
  artists: Artists;
  /**
   * Standardised venue name, with city stored separately.
   */
  venue: string;
  /**
   * Event date in YYYY-MM-DD format.
   */
  date: string;
  city: NonBlankString;
  support?: Artists1;
}
