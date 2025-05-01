export declare enum UserRole {
    ADMIN = "admin",
    USER = "user"
}
export declare class User {
    id: string;
    email: string;
    password: string;
    role: UserRole;
    name: string;
    surname: string;
    areaCode: string;
    phone: string;
    website: string;
    isWhatsappEnabled: boolean;
    isWebsiteEnabled: boolean;
    isVcardEnabled: boolean;
    slug: string;
    createdAt: Date;
    updatedAt: Date;
    deletedAt: Date;
}
