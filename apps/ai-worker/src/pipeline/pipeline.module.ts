import { Module } from '@nestjs/common';
import { ProcessorsModule } from '../processors/processors.module.js';
import { ConversationPipelineService } from './conversation-pipeline.service.js';

@Module({
    imports: [ProcessorsModule],
    providers: [ConversationPipelineService],
    exports: [ConversationPipelineService],
})
export class PipelineModule { }
