const CHANNEL_SOURCES = Object.freeze({
  douyin: 'social-douyin',
  bilibili: 'social-bilibili',
});

export const MARKETING_CAMPAIGNS = Object.freeze({
  'hot-ginger-v2': Object.freeze({
    id: 'hot-ginger-v2',
    channels: Object.freeze(['douyin', 'bilibili']),
    question: '生姜伪装成土豆接近我，到底图什么？',
    voiceMode: 'chaos',
  }),
  'hot-faucet-v1': Object.freeze({
    id: 'hot-faucet-v1',
    channels: Object.freeze(['douyin', 'bilibili']),
    question: '我洗澡是在调水温，还是在拆弹？',
    voiceMode: 'chaos',
  }),
  'product-tour-v1': Object.freeze({
    id: 'product-tour-v1',
    channels: Object.freeze(['douyin', 'bilibili']),
    question: '我今天最需要看见什么？',
    voiceMode: 'normal',
  }),
});

export function isMarketingCampaignPair(source, campaignId) {
  const entry = MARKETING_CAMPAIGNS[campaignId];
  if (!entry) return false;
  const channel = Object.entries(CHANNEL_SOURCES)
    .find(([, mappedSource]) => mappedSource === source)?.[0];
  return Boolean(channel && entry.channels.includes(channel));
}

export function getMarketingCampaignEntry(search = '') {
  try {
    const params = new URLSearchParams(search);
    const channel = params.get('mt_channel') || '';
    const campaignId = params.get('mt_campaign') || '';
    const source = CHANNEL_SOURCES[channel];
    const campaign = MARKETING_CAMPAIGNS[campaignId];
    if (!source || !campaign || !campaign.channels.includes(channel)) return null;
    return {
      channel,
      source,
      campaign: campaign.id,
      question: campaign.question,
      voiceMode: campaign.voiceMode,
    };
  } catch {
    return null;
  }
}
