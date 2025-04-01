export type SortStyleValue = 'a-z' | 'z-a' | 'playtime' | 'lastplayed' | 'achievement' | string;

export interface SortOption {
    key: string;
    label: string;
}