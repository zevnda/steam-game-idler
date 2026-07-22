//! Maps this app's i18next locale codes (`src/i18n/index.ts`) to the language-dictionary keys
//! Steam's achievement schema embeds per achievement (`display/name/english`,
//! `display/name/schinese`, ...) - see `SchemaWalker.ResolveLocalizedString` in
//! `libs/SteamUtility/Core/SchemaParsing/SchemaWalker.cs`. Only agent mode needs this: CLI mode
//! already gets live-localized text straight from the local Steam client
//! (`SteamworksLocalBackend`'s `GetAchievementDisplayAttribute` call), independent of this app's
//! own locale.
//!
//! Not every app locale maps onto a real Steam language - Steam has no Slovenian schema language,
//! for instance - and a locale can land in this app before its Steam equivalent is confirmed.
//! Both cases fall through to `"english"` here, matching `ResolveLocalizedString`'s own
//! english-then-first-available fallback for whichever achievements don't have the requested
//! language in their own schema entry.
//!
//! Covers all locales in `src/i18n/index.ts`'s `resources` map, not just the ones currently
//! selectable in `LanguageSwitch.tsx`'s `ENABLED_LANGUAGES` - so enabling a new locale there is
//! the only change needed to make agent-mode achievement text start following it; nothing here
//! needs to change in step.
pub fn steam_language_for_locale(locale: &str) -> &'static str {
    match locale {
        "en-US" => "english",
        "fr-FR" => "french",
        "it-IT" => "italian",
        "pt-BR" => "brazilian",
        "ru-RU" => "russian",
        "tr-TR" => "turkish",
        "zh-CN" => "schinese",
        _ => "english",
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn maps_known_locales() {
        assert_eq!(steam_language_for_locale("it-IT"), "italian");
        assert_eq!(steam_language_for_locale("zh-CN"), "schinese");
        assert_eq!(steam_language_for_locale("pt-BR"), "brazilian");
    }

    #[test]
    fn falls_back_to_english_for_unmapped_locales() {
        assert_eq!(steam_language_for_locale("sl-SI"), "english");
        assert_eq!(steam_language_for_locale("xx-XX"), "english");
    }
}
