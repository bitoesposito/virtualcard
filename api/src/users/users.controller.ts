import { Controller, Get, UseGuards, Post, Body, HttpStatus, HttpCode, Param, NotFoundException, BadRequestException, Delete, Request, Put } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { UserRole } from './users.entity';
import { UserEmailDto, EditUserDto } from './dto/users.dto';

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
        return this.usersService.createUser(createUserDto);
    }

    @Get('list')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.admin)
    async listUsers() {
        const users = await this.usersService.findAll();
        return users.map(user => ({
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
        }));
    }

    @Get(':slug')
    async getUserBySlug(@Param('slug') slug: string) {
        if (!slug || slug.trim() === '' || slug.toLowerCase() === 'null') {
            throw new BadRequestException('Invalid slug provided');
        }

        const user = await this.usersService.findBySlug(slug);
        if (!user) {
            throw new NotFoundException(`User with slug ${slug} not found`);
        }

        return {
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
    }

    @Get('by-id/:uuid')
    async getUserById(@Param('uuid') uuid: string) {
        const user = await this.usersService.findByUuid(uuid);
        if (!user) {
            throw new NotFoundException(`User with UUID ${uuid} not found`);
        }

        return {
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
    }

    @Delete('delete')
    @UseGuards(JwtAuthGuard)
    @HttpCode(HttpStatus.OK)
    async deleteUser(@Body() deleteUserDto: UserEmailDto, @Request() req) {
        await this.usersService.deleteUser(deleteUserDto.email, req.user);
        return {
            message: 'User account deleted successfully'
        };
    }

    @Put('edit')
    @UseGuards(JwtAuthGuard)
    @HttpCode(HttpStatus.OK)
    async editUser(@Body() editUserDto: EditUserDto, @Request() req) {
        const updatedUser = await this.usersService.editUser(req.user.email, editUserDto, req.user);
        return {
            message: 'Profile updated successfully',
            user: {
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
            }
        };
    }
}
