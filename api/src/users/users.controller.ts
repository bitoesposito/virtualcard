import { Controller, Get, UseGuards, Post, Body, HttpStatus, HttpCode, Param, NotFoundException, BadRequestException, Delete, Request, Put } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from './users.entity';
import { UserEmailDto, EditUserDto } from './dto/users.dto';
import { ApiResponseDto } from '../common/dto/api-response.dto';

@Controller('users')
export class UsersController {

    constructor(
        private readonly usersService: UsersService
    ) {}

    @Post('create')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.admin)
    @HttpCode(HttpStatus.CREATED)
    async createUser(@Body() createUserDto: UserEmailDto) {
        const user = await this.usersService.createUser(createUserDto);
        return ApiResponseDto.success(user, 'If the email address is registered, you will receive a password reset link');
    }

    @Get('list')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.admin)
    @HttpCode(HttpStatus.OK)
    async listUsers() {
        const users = await this.usersService.findAll();
        const formattedUsers = users.map(user => ({
            uuid: user.uuid,
            email: user.email,
            role: user.role,
            name: user.name,
            surname: user.surname,
            areaCode: user.area_code,
            phone: user.phone,
            website: user.website,
            isWhatsappEnabled: user.is_whatsapp_enabled,
            isWebsiteEnabled: user.is_website_enabled,
            isVcardEnabled: user.is_vcard_enabled,
            slug: user.slug,
            createdAt: user.created_at
        }));
        return ApiResponseDto.success(formattedUsers, 'Users list retrieved successfully');
    }

    @Get(':slug')
    @HttpCode(HttpStatus.OK)
    async getUserBySlug(@Param('slug') slug: string) {
        // Validate slug format
        if (!slug || typeof slug !== 'string') {
            throw new BadRequestException('Invalid slug format');
        }

        // Trim and validate slug content
        const trimmedSlug = slug.trim();
        if (trimmedSlug === '' || trimmedSlug.toLowerCase() === 'null' || trimmedSlug.toLowerCase() === 'undefined') {
            throw new BadRequestException('Invalid slug value');
        }

        const user = await this.usersService.findBySlug(trimmedSlug);
        if (!user) {
            throw new NotFoundException(`User with slug "${trimmedSlug}" not found`);
        }

        const formattedUser = {
            uuid: user.uuid,
            name: user.name,
            surname: user.surname,
            areaCode: user.area_code,
            phone: user.phone,
            email: user.email,
            website: user.website,
            isWhatsappEnabled: user.is_whatsapp_enabled,
            isWebsiteEnabled: user.is_website_enabled,
            isVcardEnabled: user.is_vcard_enabled,
            slug: user.slug,
            createdAt: user.created_at
        };
        return ApiResponseDto.success(formattedUser, 'User profile retrieved successfully');
    }

    @Get('by-id/:uuid')
    @HttpCode(HttpStatus.OK)
    async getUserById(@Param('uuid') uuid: string) {
        // Validate UUID format
        if (!uuid || typeof uuid !== 'string') {
            throw new BadRequestException('Invalid UUID format');
        }

        // Validate UUID pattern
        const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
        if (!uuidPattern.test(uuid)) {
            throw new BadRequestException('Invalid UUID format');
        }

        const user = await this.usersService.findByUuid(uuid);
        if (!user) {
            throw new NotFoundException(`User with UUID "${uuid}" not found`);
        }

        const formattedUser = {
            uuid: user.uuid,
            name: user.name,
            surname: user.surname,
            areaCode: user.area_code,
            phone: user.phone,
            email: user.email,
            website: user.website,
            isWhatsappEnabled: user.is_whatsapp_enabled,
            isWebsiteEnabled: user.is_website_enabled,
            isVcardEnabled: user.is_vcard_enabled,
            slug: user.slug,
            createdAt: user.created_at
        };
        return ApiResponseDto.success(formattedUser, 'User profile retrieved successfully');
    }

    @Delete('delete')
    @UseGuards(JwtAuthGuard)
    @HttpCode(HttpStatus.OK)
    async deleteUser(@Body() deleteUserDto: UserEmailDto, @Request() req) {
        await this.usersService.deleteUser(deleteUserDto.email, req.user);
        return ApiResponseDto.success(null, 'User account deleted successfully');
    }

    @Put('edit')
    @UseGuards(JwtAuthGuard)
    @HttpCode(HttpStatus.OK)
    async editUser(@Body() editUserDto: EditUserDto, @Request() req) {
        const updatedUser = await this.usersService.editUser(req.user.email, editUserDto, req.user);
        const formattedUser = {
            uuid: updatedUser.uuid,
            name: updatedUser.name,
            surname: updatedUser.surname,
            areaCode: updatedUser.area_code,
            phone: updatedUser.phone,
            website: updatedUser.website,
            isWhatsappEnabled: updatedUser.is_whatsapp_enabled,
            isWebsiteEnabled: updatedUser.is_website_enabled,
            isVcardEnabled: updatedUser.is_vcard_enabled,
            slug: updatedUser.slug,
            createdAt: updatedUser.created_at
        };
        return ApiResponseDto.success(formattedUser, 'User profile updated successfully');
    }
}
