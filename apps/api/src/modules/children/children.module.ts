import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { ChildrenController } from './children.controller';
import { ChildrenService } from './children.service';

@Module({
    imports: [PrismaModule],
    controllers: [ChildrenController],
    providers: [ChildrenService],
    exports: [ChildrenService],
})
export class ChildrenModule { }
