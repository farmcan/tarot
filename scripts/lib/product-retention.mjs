const DAY_MS = 24 * 60 * 60 * 1000;

function normalizeDate(value) {
  const match = String(value || '').match(/^\d{4}-\d{2}-\d{2}/);
  return match?.[0] || '';
}

function addUtcDays(date, days) {
  const timestamp = Date.parse(`${date}T00:00:00Z`);
  return new Date(timestamp + days * DAY_MS).toISOString().slice(0, 10);
}

function utcDayDistance(from, to) {
  return Math.floor((Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / DAY_MS);
}

export function calculateProductRetention(rows, asOfDate = new Date().toISOString().slice(0, 10)) {
  const activityByBrowser = new Map();

  for (const row of rows) {
    const anonymousBrowser = typeof row?.anonymous_browser === 'string' ? row.anonymous_browser : '';
    const activeDate = normalizeDate(row?.active_date);
    if (!anonymousBrowser || !activeDate) continue;
    const activity = activityByBrowser.get(anonymousBrowser) || new Set();
    activity.add(activeDate);
    activityByBrowser.set(anonymousBrowser, activity);
  }

  const firstSeenByBrowser = new Map();
  for (const [anonymousBrowser, activity] of activityByBrowser) {
    firstSeenByBrowser.set(anonymousBrowser, [...activity].sort()[0]);
  }

  const periods = [1, 7, 30].map((day) => {
    let eligible = 0;
    let retained = 0;
    for (const [anonymousBrowser, firstSeen] of firstSeenByBrowser) {
      if (utcDayDistance(firstSeen, asOfDate) < day) continue;
      eligible += 1;
      if (activityByBrowser.get(anonymousBrowser)?.has(addUtcDays(firstSeen, day))) retained += 1;
    }
    return {
      day,
      eligible,
      retained,
      rate: eligible > 0 ? retained / eligible : 0,
    };
  });

  const dates = rows.map((row) => normalizeDate(row?.active_date)).filter(Boolean).sort();
  return {
    anonymousBrowsers: activityByBrowser.size,
    observedFrom: dates[0] || null,
    observedThrough: dates.at(-1) || null,
    periods,
  };
}
