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

function matchingReadingSessions(rows, leftEventName, rightEventName, eligibleSessions) {
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
      || !eligibleSessions.has(row.session)
      || !leftReadingKeys.has(`${row.session}:${row.reading}`)
    ) {
      continue;
    }
    matchedSessions.add(row.session);
  }
  return matchedSessions.size;
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
    newReadingCompleted: matchingReadingSessions(
      externalHomeRows,
      'reading_started',
      'reading_completed',
      selectedByVariant['new-reading'],
    ),
    dailyReadingGenerated: intersectionSize(selectedByVariant['daily-reading'], dailyGenerated),
    dailyReadingCompleted: matchingReadingSessions(
      externalHomeRows,
      'daily_reading',
      'reading_completed',
      selectedByVariant['daily-reading'],
    ),
  };
}
