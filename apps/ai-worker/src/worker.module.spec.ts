import { Test, TestingModule } from '@nestjs/testing';
import { WorkerModule } from './worker.module';

describe('WorkerModule', () => {
    let module: TestingModule;

    beforeAll(async () => {
        module = await Test.createTestingModule({
            imports: [WorkerModule],
        }).compile();
    });

    it('should be defined', () => {
        expect(module).toBeDefined();
    });

    it('should compile without errors', () => {
        const app = module.createNestApplication();
        expect(app).toBeDefined();
    });
});
