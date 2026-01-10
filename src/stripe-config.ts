export interface StripeProduct {
  priceId: string;
  name: string;
  description: string;
  mode: 'payment' | 'subscription';
  price: number;
  currency: string;
  currencySymbol: string;
}

export const stripeProducts: StripeProduct[] = [
  {
    priceId: 'price_1SYHyxLeNv8S2YoZaGmgevE1',
    name: 'Nuuz + Premium',
    description: 'Unlock an ad-free, faster and more personalized news experience. Nuuz+ Premium removes all ads, gives priority loading, and unlocks exclusive features designed for a smoother reading experience.',
    mode: 'subscription',
    price: 3.99,
    currency: 'usd',
    currencySymbol: '$'
  }
];