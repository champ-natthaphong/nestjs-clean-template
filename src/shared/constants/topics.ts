import { ConfigService } from '../../common';
/**
 * Kafka Topic Constants
 *
 * Define producer and consumer topic names here.
 * Values come from YAML config via ConfigService.
 *
 * @example
 * import { ConfigService } from '@common-lib';
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
    config.get<string>('topics.consume.notification.incoming') ?? 'notification.incoming',
  notificationCreated: config.get<string>('topics.consume.notification.created'),
};

export const PRODUCER_TOPICS = {
  notificationRequested: config.get<string>('topics.produce.notification.requested'),
};
