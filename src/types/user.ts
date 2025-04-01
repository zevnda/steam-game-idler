export type UserSummary = {
    steamId: string;
    personaName: string;
    avatar: string;
    mostRecent?: number;
} | null;