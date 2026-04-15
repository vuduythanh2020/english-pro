import {
    Controller,
    Get,
    Delete,
    Param,
    HttpCode,
    HttpStatus,
    UseGuards,
    Res,
} from '@nestjs/common';
import type { Response } from 'express';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { RequestUser } from '../../common/types/jwt-payload.type';
import { AuthGuard } from '../../common/guards/auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { UserService } from './user.service';
import { ChildDataResponseDto } from './dto/child-data.dto';

/**
 * UserController — Story 2.7: Privacy Policy, Data Management & Account Deletion.
 *
 * All endpoints are parent-only (require PARENT role).
 * Ownership verification is performed at service layer.
 */
@ApiTags('users')
@UseGuards(AuthGuard, RolesGuard)
@Controller('api/v1/users')
export class UserController {
    constructor(private readonly userService: UserService) { }

    /**
     * GET /api/v1/users/children/:childId/data
     * Retrieve all stored data for a child profile.
     *
     * AC2: Xem Dữ Liệu Trẻ — returns profile, learning progress,
     * pronunciation scores, badges. No voice data (FR24).
     */
    @Get('children/:childId/data')
    @Roles('PARENT')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Get all stored data for a child profile' })
    @ApiParam({ name: 'childId', description: 'Child profile UUID', type: String })
    @ApiResponse({ status: 200, description: 'Child data retrieved', type: ChildDataResponseDto })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    @ApiResponse({ status: 403, description: 'Forbidden — not a parent or wrong role' })
    @ApiResponse({ status: 404, description: 'Child not found or not owned by parent' })
    async getChildData(
        @Param('childId') childId: string,
        @CurrentUser() user: RequestUser,
    ): Promise<ChildDataResponseDto> {
        const parentId = user.userId ?? user.sub;
        return this.userService.getChildData(parentId, childId);
    }

    /**
     * GET /api/v1/users/children/:childId/export
     * Export all child data as a downloadable JSON file.
     *
     * AC3: Export Dữ Liệu (JSON) — same data as /data endpoint but
     * served as an attachment for the system share sheet.
     *
     * File name format: english_pro_data_{childName}_{date}.json
     */
    @Get('children/:childId/export')
    @Roles('PARENT')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Export all child data as a downloadable JSON file' })
    @ApiParam({ name: 'childId', description: 'Child profile UUID', type: String })
    @ApiResponse({ status: 200, description: 'JSON file attachment returned' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    @ApiResponse({ status: 403, description: 'Forbidden — not a parent or wrong role' })
    @ApiResponse({ status: 404, description: 'Child not found or not owned by parent' })
    async exportChildData(
        @Param('childId') childId: string,
        @CurrentUser() user: RequestUser,
        @Res() res: Response,
    ): Promise<void> {
        const parentId = user.userId ?? user.sub;
        const data = await this.userService.getChildData(parentId, childId);

        // Build filename: english_pro_data_{childName}_{date}.json
        // F09 fix: sanitize to ASCII-safe characters (replace non-ASCII with '_')
        // to avoid broken Content-Disposition headers for Vietnamese names (e.g. "Bé Minh")
        const childNameRaw = data.profile.name.replace(/\s+/g, '_');
        const childName = childNameRaw.replace(/[^\w.-]/g, '_');
        const date = new Date().toISOString().split('T')[0];
        const filename = `english_pro_data_${childName}_${date}.json`;

        // F03 fix: use res.json(data) directly (not { data }) because @Res() bypasses
        // ResponseWrapperInterceptor. The raw DTO is the correct payload for file download.
        // Flutter's exportChildData reads raw bytes (responseType: bytes), not the interceptor wrapper.
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.setHeader('Content-Type', 'application/json');
        res.json(data);
    }

    /**
     * DELETE /api/v1/users/children/:childId
     * Permanently delete a child account and all associated data.
     *
     * AC4: Xóa Tài Khoản Con — hard delete with cascade.
     * Parent receives a confirmation email (logged for now).
     */
    @Delete('children/:childId')
    @Roles('PARENT')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Permanently delete a child account and all associated data' })
    @ApiParam({ name: 'childId', description: 'Child profile UUID', type: String })
    @ApiResponse({ status: 200, description: 'Child account deleted successfully' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    @ApiResponse({ status: 403, description: 'Forbidden — not a parent or wrong role' })
    @ApiResponse({ status: 404, description: 'Child not found or not owned by parent' })
    async deleteChildAccount(
        @Param('childId') childId: string,
        @CurrentUser() user: RequestUser,
    ): Promise<{ message: string }> {
        const parentId = user.userId ?? user.sub;
        await this.userService.deleteChildAccount(parentId, childId);
        return { message: 'Child account deleted successfully' };
    }
}
