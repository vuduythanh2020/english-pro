import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ConversationService } from './conversation.service';

const QUEUE_NAME_STT = 'ai-stt';

@Module({
    imports: [
        BullModule.registerQueue({ name: QUEUE_NAME_STT }),
    ],
    providers: [ConversationService],
    exports: [ConversationService],
})
export class ConversationModule { }
