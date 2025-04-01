import type { Achievement, Statistic } from '@/types/achievment';
import type { Game } from '@/types/game';
import type { UserSettings } from '@/types/settings';
import type { UserSummary } from '@/types/user';

interface Processes {
    appid: number;
    name: string;
    pid: number;
}

export interface InvokeUsers {
    error?: string;
    users: UserSummary[];
}

export interface InvokeSettings {
    success: boolean;
    settings: UserSettings;
}

export interface InvokeIdle {
    error?: string;
    success: string;
}

export interface InvokeKillProcess {
    success: boolean;
    killed_count?: number;
}

export interface InvokeRunningProcess {
    processes: Processes[];
}

export interface InvokeUserSummary {
    response: {
        players: {
            steamid: string;
            personaname: string;
            avatar: string;
        }[]
    }
}

export interface InvokeValidateSession {
    user: string | null;
}

export interface InvokeValidateKey {
    error?: string;
    response?: {
        players?: unknown[];
    };
}

export interface InvokeFreeGames {
    games: Game[];
}

export interface InvokeCustomList {
    error?: string;
    list_data: Game[];
}

export interface InvokeGamesList {
    games_list: Game[];
    recent_games: Game[];
}

export interface InvokeAchievementData {
    achievement_data: {
        achievements: Achievement[];
        stats: Statistic[];
    };
}

export interface InvokeAchievementUnlock {
    success: string;
}

export interface InvokeStatUpdate {
    success: string;
}

export interface InvokeResetStats {
    success: string;
}

export interface InvokeDropsRemaining {
    error?: string;
    remaining: number;
}

export interface InvokeGamesWithDrops {
    error?: string;
    gamesWithDrops: Game[];
}