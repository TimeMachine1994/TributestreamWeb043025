/**
 * Package options for the calculator page
 */
export const packages = [
  {
    id: 'package-a',
    name: 'Package A Option',
    description: 'Basic livestream package with essential features',
    basePrice: 299,
    features: [
      'Up to 1 hour of livestreaming',
      'Basic video quality',
      'Single location',
      'Email support'
    ]
  },
  {
    id: 'package-b',
    name: 'Package B Option',
    description: 'Standard livestream package with enhanced features',
    basePrice: 499,
    features: [
      'Up to 2 hours of livestreaming',
      'HD video quality',
      'Up to 2 locations',
      'Phone and email support',
      'Recording available for 30 days'
    ]
  },
  {
    id: 'package-c',
    name: 'Package C Option',
    description: 'Premium livestream package with all features',
    basePrice: 799,
    features: [
      'Up to 3 hours of livestreaming',
      '4K video quality',
      'Up to 3 locations',
      'Priority support',
      'Recording available for 90 days',
      'Professional editing services'
    ]
  }
];

/**
 * Calculate additional costs based on options
 */
export const additionalCosts = {
  extraHour: 99,
  extraLocation: 149
};