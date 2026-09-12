/**
 * Kafka Topic Constants
 *
 * Define producer and consumer topic names here.
 * Values come from YAML config via ConfigService.
 *
 * @example
 * import { ConfigService } from '@corp-ais/rat-common-lib';
 *
 * const config = new ConfigService();
 *
 * export const PRODUCER_TOPICS = {
 *   atnRegistrationRequest: config.get('kafka.topics.registration-request'),
 * };
 *
 * export const CONSUMER_TOPICS = {
 *   atnRegistrationResponse: config.get('kafka.topics.registration-response'),
 * };
 */

export const CONSUMER_TOPICS: Record<string, string> = {
  // Define consumer topics here
  notificationIncoming: process.env.TOPIC_NOTIFICATION_INCOMING ?? 'notification.incoming',
};

export const PRODUCER_TOPICS: Record<string, string> = {
  // Define producer topics here
  notificationIncoming: process.env.TOPIC_NOTIFICATION_INCOMING ?? 'notification.incoming',
};
