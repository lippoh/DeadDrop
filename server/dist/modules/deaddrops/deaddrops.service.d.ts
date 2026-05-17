export declare class DeadDropService {
    /**
     * Create a new dead drop
     */
    create(data: {
        ciphertext: string;
        iv: string;
        salt: string;
        hasPassword: boolean;
        password?: string;
        expiryHours: number;
    }): Promise<{
        token: string;
        expiresAt: string;
    }>;
    /**
     * Get dead drop metadata (no ciphertext)
     */
    getByToken(token: string): Promise<{
        hasPassword: boolean;
        isRead: boolean;
        createdAt: Date;
        expiresAt: Date;
    } | {
        error: string;
        status: number;
    }>;
    /**
     * Read and immediately destroy the dead drop
     */
    readAndDestroy(token: string, password?: string): Promise<{
        error: string;
        status: number;
        ciphertext?: undefined;
        iv?: undefined;
        salt?: undefined;
    } | {
        ciphertext: string;
        iv: string;
        salt: string;
        error?: undefined;
        status?: undefined;
    }>;
    /**
     * Cleanup expired dead drops (called by CRON job)
     */
    cleanupExpired(): Promise<{
        deleted: number;
    }>;
}
//# sourceMappingURL=deaddrops.service.d.ts.map