import {
    CanActivate,
    ExecutionContext,
    Injectable,
    UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';

@Injectable()
export class SupabaseAuthGuard implements CanActivate {
    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest<Request>();
        const token = this.extractTokenFromHeader(request);

        if (!token) {
            throw new UnauthorizedException('Missing authorization token');
        }

        try {
            const payload = await this.validateToken(token);
            (request as any).user = payload;
            return true;
        } catch (error) {
            if (error instanceof UnauthorizedException) {
                throw error;
            }
            throw new UnauthorizedException('Invalid or expired token');
        }
    }

    extractUserFromToken(token: string): Record<string, any> {
        const parts = token.split('.');
        if (parts.length !== 3) {
            throw new UnauthorizedException('Malformed JWT');
        }

        return JSON.parse(
            Buffer.from(parts[1], 'base64url').toString('utf8'),
        );
    }

    private extractTokenFromHeader(request: Request): string | undefined {
        const [type, token] = request.headers.authorization?.split(' ') ?? [];
        return type === 'Bearer' ? token : undefined;
    }

    async validateToken(token: string): Promise<Record<string, any>> {
        const supabaseJwtSecret = process.env.SUPABASE_JWT_SECRET;

        if (!supabaseJwtSecret) {
            throw new Error('SUPABASE_JWT_SECRET not configured');
        }

        const payload = this.extractUserFromToken(token);

        // Validate expiration
        const now = Math.floor(Date.now() / 1000);
        if (payload.exp && payload.exp < now) {
            throw new UnauthorizedException('Token expired');
        }

        // Validate issuer matches Supabase URL
        const supabaseUrl = process.env.SUPABASE_URL;
        if (supabaseUrl && payload.iss !== `${supabaseUrl}/auth/v1`) {
            throw new UnauthorizedException('Invalid token issuer');
        }

        return payload;
    }
}
