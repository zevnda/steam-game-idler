using System;

namespace SteamUtility.Core
{
    [Flags]
    public enum StatFlags
    {
        None = 0,
        IncrementOnly = 1 << 0,
        Protected = 1 << 1,
        UnknownPermission = 1 << 2,
    }

    public static class StatFlagHelper
    {
        public static StatFlags GetFlags(
            int permission,
            bool incrementOnly,
            bool isAchievement = false
        )
        {
            var flags = StatFlags.None;
            // Only set IncrementOnly for stats, never for achievements
            if (!isAchievement && incrementOnly)
            {
                flags |= StatFlags.IncrementOnly;
            }
            // PROTECTED: Achievements: (permission & 3) != 0, Stats: (permission & 2) != 0
            if (
                (isAchievement && (permission & 3) != 0)
                || (!isAchievement && (permission & 2) != 0)
            )
            {
                flags |= StatFlags.Protected;
            }
            // Optionally set UnknownPermission if high bits are set
            if ((permission & ~(isAchievement ? 3 : 2)) != 0)
            {
                flags |= StatFlags.UnknownPermission;
            }
            return flags;
        }
    }
}
