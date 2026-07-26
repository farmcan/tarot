export type MarketingChannel = 'douyin' | 'bilibili';
export type MarketingSource = 'social-douyin' | 'social-bilibili';
export type MarketingCampaignId =
  | 'hot-ginger-v2'
  | 'hot-faucet-v1'
  | 'product-tour-v1';

export interface MarketingCampaignDefinition {
  readonly id: MarketingCampaignId;
  readonly channels: readonly MarketingChannel[];
  readonly question: string;
  readonly voiceMode: 'normal' | 'chaos';
}

export interface MarketingCampaignEntry {
  channel: MarketingChannel;
  source: MarketingSource;
  campaign: MarketingCampaignId;
  question: string;
  voiceMode: 'normal' | 'chaos';
}

export const MARKETING_CAMPAIGNS: Readonly<Record<
  MarketingCampaignId,
  MarketingCampaignDefinition
>>;

export function isMarketingCampaignPair(
  source: string,
  campaignId: string,
): boolean;

export function getMarketingCampaignEntry(
  search?: string,
): MarketingCampaignEntry | null;
