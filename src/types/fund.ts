export type WalletProvider = "PAYBOX" | "BIT" | "OTHER";

export interface Fund {
  id: string;
  eventId: string;
  title: string;
  description?: string;
  suggestedAmounts: number[];
  targetAmount?: number;
  walletProvider: WalletProvider;
  walletLink: string;
  isVisible: boolean;
  position: number;
  clickCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface FundContribution {
  id: string;
  fundId: string;
  guestName?: string;
  guestEmail?: string;
  reportedAmount: number;
  createdAt: Date;
}
