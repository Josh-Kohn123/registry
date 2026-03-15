export interface BundleItem {
  id: string;
  bundleId: string;
  title: string;
  url: string;
  imageUrl?: string;
  estimatedPrice?: number;
  previousPrice?: number;
  lastPriceFetch?: Date;
  createdAt: Date;
  updatedAt: Date;
  description?: string;
}

export interface BundleContribution {
  guestName?: string;
  amount: number;
  message?: string;
  createdAt: Date;
}

export interface Bundle {
  id: string;
  eventId: string;
  title: string;
  description?: string;
  targetAmount: number;
  suggestedAmounts?: number[];
  currentAmount?: number;
  imageUrl?: string;
  storeDomain: string;
  items: BundleItem[];
  isVisible: boolean;
  position: number;
  clickCount: number;
  createdAt: Date;
  updatedAt: Date;
}
