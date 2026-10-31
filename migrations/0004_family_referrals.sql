-- Anonymous daily link events. Day is Asia/Shanghai; updated_at is UTC.
CREATE TABLE IF NOT EXISTS miao_family_referrals (
  event_day TEXT NOT NULL,
  source_project TEXT NOT NULL CHECK(source_project IN ('miaoti','miao-beat','miaotarot')),
  target_project TEXT NOT NULL CHECK(target_project IN ('miaoti','miao-beat','miaotarot')),
  placement TEXT NOT NULL CHECK(placement IN ('intro','result','family','unknown')),
  event_kind TEXT NOT NULL CHECK(event_kind IN ('click','arrival')),
  traffic_type TEXT NOT NULL CHECK(traffic_type IN ('internal','external')),
  count INTEGER NOT NULL DEFAULT 0 CHECK(count>=0),
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CHECK(source_project<>target_project),
  PRIMARY KEY(event_day,source_project,target_project,placement,event_kind,traffic_type)
);
