import { ConfigService } from '../../common';
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

const config = new ConfigService();

export const CONSUMER_TOPICS = {
  notificationIncoming:
    config.get<string>('topics.consume.atn.notification-incoming') ?? 'notification.incoming',
  atnRegistrationResponse: config.get<string>('topics.consume.atn.new-registration-response'),
};

export const PRODUCER_TOPICS = {
  atnRegistrationRequest: config.get<string>('topics.produce.atn.new-registration-request'),
};
