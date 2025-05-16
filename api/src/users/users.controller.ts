import { Controller, Get, UseGuards, Post, Body, HttpStatus, HttpCode, Param, NotFoundException, BadRequestException, Delete, Request, Put } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole, User } from './users.entity';
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
        return await this.usersService.createUser(createUserDto);
    }

    @Get('list')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.admin)
    @HttpCode(HttpStatus.OK)
    async listUsers() {
        const response = await this.usersService.findAll();
        if (!response.success || !response.data) {
            return response;
        }

        const formattedUsers = response.data.map(user => ({
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
        if (!slug || typeof slug !== 'string') {
            return ApiResponseDto.error('Invalid slug format', HttpStatus.BAD_REQUEST);
        }

        const trimmedSlug = slug.trim();
        if (trimmedSlug === '' || trimmedSlug.toLowerCase() === 'null' || trimmedSlug.toLowerCase() === 'undefined') {
            return ApiResponseDto.error('Invalid slug value', HttpStatus.BAD_REQUEST);
        }

        const response = await this.usersService.findBySlug(trimmedSlug);
        if (!response.success || !response.data) {
            return response;
        }

        const user = response.data;
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
        if (!uuid || typeof uuid !== 'string') {
            return ApiResponseDto.error('Invalid UUID format', HttpStatus.BAD_REQUEST);
        }

        const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
        if (!uuidPattern.test(uuid)) {
            return ApiResponseDto.error('Invalid UUID format', HttpStatus.BAD_REQUEST);
        }

        const user = await this.usersService.findByUuid(uuid);
        if (!user) {
            return ApiResponseDto.error('User not found', HttpStatus.NOT_FOUND);
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
        return await this.usersService.deleteUser(deleteUserDto.email, req.user);
    }

    @Put('edit')
    @UseGuards(JwtAuthGuard)
    @HttpCode(HttpStatus.OK)
    async editUser(@Body() editUserDto: EditUserDto, @Request() req) {
        const response = await this.usersService.editUser(req.user.email, editUserDto, req.user);
        if (!response.success || !response.data) {
            return response;
        }

        const user = response.data;
        const formattedUser = {
            uuid: user.uuid,
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
        };
        return ApiResponseDto.success(formattedUser, 'User profile updated successfully');
    }
}
