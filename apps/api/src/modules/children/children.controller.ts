import {
    Controller,
    Post,
    Get,
    Body,
    HttpCode,
    HttpStatus,
    UsePipes,
    UseGuards,
    ValidationPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { RequestUser } from '../../common/types/jwt-payload.type';
import { AuthGuard } from '../../common/guards/auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { ChildrenService } from './children.service';
import { CreateChildDto } from './dto/create-child.dto';
import { ChildProfileDto } from './dto/child-profile.dto';

@ApiTags('children')
@UseGuards(AuthGuard, RolesGuard)
@Controller('api/v1/children')
export class ChildrenController {
    constructor(private readonly childrenService: ChildrenService) { }

    /**
     * Creates a new child profile for the authenticated parent.
     *
     * Enforces maximum of 3 profiles per parent (422 PROFILE_LIMIT_REACHED).
     */
    @Post()
    @Roles('PARENT')
    @HttpCode(HttpStatus.CREATED)
    @UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
    @ApiOperation({ summary: 'Create a new child profile' })
    @ApiResponse({ status: 201, description: 'Child profile created', type: ChildProfileDto })
    @ApiResponse({ status: 400, description: 'Validation failed' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    @ApiResponse({ status: 422, description: 'Profile limit reached (max 3)' })
    async createChildProfile(
        @Body() dto: CreateChildDto,
        @CurrentUser() user: RequestUser,
    ): Promise<ChildProfileDto> {
        const parentId = user.userId ?? user.sub;
        return this.childrenService.createChildProfile(parentId, dto);
    }

    /**
     * Returns all active child profiles for the authenticated parent.
     *
     * Used by Story 2.5 (Child Login screen) to display profile selector.
     */
    @Get()
    @Roles('PARENT')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Get all child profiles for the authenticated parent' })
    @ApiResponse({ status: 200, description: 'Child profiles retrieved', type: [ChildProfileDto] })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    async getChildProfiles(
        @CurrentUser() user: RequestUser,
    ): Promise<ChildProfileDto[]> {
        const parentId = user.userId ?? user.sub;
        return this.childrenService.getChildProfiles(parentId);
    }
}
