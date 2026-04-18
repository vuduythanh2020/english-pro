import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { QUEUE_NAMES, DEFAULT_JOB_OPTIONS } from '../config/queue.constants.js';
import { ProvidersModule } from '../providers/providers.module.js';
import { SttProcessor } from './stt.processor.js';
import { LlmProcessor } from './llm.processor.js';
import { TtsProcessor } from './tts.processor.js';
import { PronunciationProcessor } from './pronunciation.processor.js';

@Module({
    imports: [
        ProvidersModule,
        BullModule.registerQueue(
            { name: QUEUE_NAMES.STT, defaultJobOptions: DEFAULT_JOB_OPTIONS },
            { name: QUEUE_NAMES.LLM, defaultJobOptions: DEFAULT_JOB_OPTIONS },
            { name: QUEUE_NAMES.TTS, defaultJobOptions: DEFAULT_JOB_OPTIONS },
            { name: QUEUE_NAMES.PRONUNCIATION, defaultJobOptions: DEFAULT_JOB_OPTIONS },
        ),
    ],
    providers: [SttProcessor, LlmProcessor, TtsProcessor, PronunciationProcessor],
    exports: [BullModule],
})
export class ProcessorsModule { }
