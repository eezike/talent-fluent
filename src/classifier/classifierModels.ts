export type ParsedEmail = {
  from: string;
  subject: string;
  bodyText: string;
};

export type Classification = {
  isCampaign: boolean;
  reason: string;
};
