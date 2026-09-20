export interface LoginDto {
    email: string;
    password: string;
}
export interface RegisterDto {
    email: string;
    password: string;
    displayName: string;
}
export interface AuthTokensDto {
    accessToken: string;
    refreshToken: string;
}
export interface AuthUserDto {
    id: string;
    email: string;
    displayName: string;
}
export interface AuthResponseDto {
    tokens: AuthTokensDto;
    user: AuthUserDto;
}
//# sourceMappingURL=auth.d.ts.map