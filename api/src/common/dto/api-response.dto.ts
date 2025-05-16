export interface ApiResponse<T> {
    http_status_code: number;
    success: boolean;
    message: string;
    data: T;
}

export class ApiResponseDto<T> implements ApiResponse<T> {
    http_status_code: number;
    success: boolean;
    message: string;
    data: T;

    constructor(http_status_code: number, success: boolean, message: string, data: T) {
        this.http_status_code = http_status_code;
        this.success = success;
        this.message = message;
        this.data = data;
    }

    static success<T>(data: T, message: string = 'Operation completed successfully'): ApiResponseDto<T> {
        return new ApiResponseDto(200, true, message, data);
    }

    static error<T>(message: string, http_status_code: number = 400): ApiResponseDto<T> {
        return new ApiResponseDto(http_status_code, false, message, null as T);
    }
} 