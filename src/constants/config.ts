export const config = {
  clip: {
    minDuration: 1,
    maxDuration: 15,
    maxSizeMB: 50,
    maxCaptionLength: 200,
  },
  bestPlay: {
    maxCount: 3,
    maxDuration: 60,
    maxSizeMB: 100,
    maxTitleLength: 50,
  },
  clap: {
    maxCount: 10,
    debounceMs: 500,
  },
  profile: {
    maxUsernameLength: 15,
    minUsernameLength: 3,
    maxDisplayNameLength: 30,
    maxBioLength: 200,
    maxHometownLength: 30,
    maxAvatarSizeMB: 5,
    maxUsernameChanges: 1,
  },
  deletion: {
    freeWindowMinutes: 10,
    maxDailyDeletes: 3,
  },
  report: {
    autoHideThreshold: 3,
    maxDetailLength: 100,
  },
  feed: {
    pageSize: 10,
  },
} as const
