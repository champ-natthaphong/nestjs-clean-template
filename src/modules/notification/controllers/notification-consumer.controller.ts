import { Controller, UseInterceptors, UsePipes } from '@nestjs/common';
import { NotificationManager } from '../managers/notification.manager';
import { NotificationMessageDto } from '../dto/notification.dto';
import { AppInterceptor, EntryPoint, ToObjectDecorator, RemoveAtSymbolPipe } from '../../../common';
import { CONSUMER_TOPICS } from '../../../shared/constants/topics';

@Controller()
@UseInterceptors(AppInterceptor)
export class NotificationConsumerController {
  constructor(private readonly manager: NotificationManager) {}

  @EntryPoint(CONSUMER_TOPICS.notificationIncoming)
  @UsePipes(new RemoveAtSymbolPipe())
  async handleIncomingNotification(@ToObjectDecorator() data: NotificationMessageDto) {
    await this.manager.handleIncomingNotification(data);
  }

  @EntryPoint('esb.atn.registration.response.v1')
  async handleRegistrationResponse(@ToObjectDecorator() data: any) {
    console.log('ได้รับ registration response:', data);
    // เดี๋ยวค่อยเรียก manager ต่อ
  }
}
