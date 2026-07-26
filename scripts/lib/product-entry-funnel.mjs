import { isMarketingCampaignPair } from '../../shared/marketingCampaigns.js';

const HOME_ACTION_VARIANTS = [
  'new-reading',
  'daily-reading',
  'continue-result',
  'resume-reading',
];

function sessionSet(rows, eventName, variant) {
  return new Set(
    rows
      .filter((row) => (
        row.event_name === eventName
        && (!variant || row.variant === variant)
        && row.session
      ))
      .map((row) => row.session),
  );
}

function intersectionSize(left, right) {
  let count = 0;
  for (const value of left) {
    if (right.has(value)) count += 1;
  }
  return count;
}

function matchingReadingSessionSet(rows, leftEventName, rightEventName, eligibleSessions = null) {
  const leftReadingKeys = new Set(
    rows
      .filter((row) => row.event_name === leftEventName && row.session && row.reading)
      .map((row) => `${row.session}:${row.reading}`),
  );
  const matchedSessions = new Set();
  for (const row of rows) {
    if (
      row.event_name !== rightEventName
      || !row.session
      || !row.reading
      || (eligibleSessions && !eligibleSessions.has(row.session))
      || !leftReadingKeys.has(`${row.session}:${row.reading}`)
    ) {
      continue;
    }
    matchedSessions.add(row.session);
  }
  return matchedSessions;
}

export function calculateProductEntryFunnel(rows) {
  const externalHomeRows = rows.filter((row) => !row.share_token);
  const shownByVariant = Object.fromEntries(HOME_ACTION_VARIANTS.map((variant) => [
    variant,
    sessionSet(externalHomeRows, 'home_action_shown', variant),
  ]));
  const selectedByVariant = Object.fromEntries(HOME_ACTION_VARIANTS.map((variant) => [
    variant,
    sessionSet(externalHomeRows, 'home_action_selected', variant),
  ]));
  const readingStarted = sessionSet(externalHomeRows, 'reading_started');
  const dailyGenerated = sessionSet(externalHomeRows, 'daily_reading');

  return {
    shown: Object.fromEntries(HOME_ACTION_VARIANTS.map((variant) => [
      variant,
      shownByVariant[variant].size,
    ])),
    selected: Object.fromEntries(HOME_ACTION_VARIANTS.map((variant) => [
      variant,
      selectedByVariant[variant].size,
    ])),
    newReadingStarted: intersectionSize(selectedByVariant['new-reading'], readingStarted),
    newReadingCompleted: matchingReadingSessionSet(
      externalHomeRows,
      'reading_started',
      'reading_completed',
      selectedByVariant['new-reading'],
    ).size,
    dailyReadingGenerated: intersectionSize(selectedByVariant['daily-reading'], dailyGenerated),
    dailyReadingCompleted: matchingReadingSessionSet(
      externalHomeRows,
      'daily_reading',
      'reading_completed',
      selectedByVariant['daily-reading'],
    ).size,
  };
}

export function calculateCampaignEntryFunnel(rows) {
  const attributedSessions = new Map();
  for (const row of rows) {
    if (
      row.event_name !== 'session_started'
      || !row.session
      || !isMarketingCampaignPair(row.source, row.variant)
    ) {
      continue;
    }
    const key = `${row.source}/${row.variant}`;
    if (!attributedSessions.has(key)) {
      attributedSessions.set(key, {
        source: row.source,
        campaign: row.variant,
        sessions: new Set(),
      });
    }
    attributedSessions.get(key).sessions.add(row.session);
  }

  const startedSessions = sessionSet(rows, 'reading_started');
  const completedReadingSessions = matchingReadingSessionSet(
    rows,
    'reading_started',
    'reading_completed',
  );
  const shareSessions = sessionSet(rows, 'share_result');

  return [...attributedSessions.values()]
    .map(({ source, campaign, sessions }) => {
      const openedSessions = new Set(
        rows
          .filter((row) => (
            row.event_name === 'campaign_entry_opened'
            && row.source === source
            && row.variant === campaign
            && sessions.has(row.session)
          ))
          .map((row) => row.session),
      );
      return {
        source,
        campaign,
        sessions: sessions.size,
        entriesOpened: openedSessions.size,
        readingsStarted: intersectionSize(openedSessions, startedSessions),
        readingsCompleted: intersectionSize(openedSessions, completedReadingSessions),
        sessionsShared: intersectionSize(openedSessions, shareSessions),
      };
    })
    .sort((left, right) => (
      right.sessions - left.sessions
      || left.source.localeCompare(right.source)
      || left.campaign.localeCompare(right.campaign)
    ));
}
