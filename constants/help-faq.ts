export type FaqItem = {
  id: string;
  question: string;
  answer: string;
};

export const HELP_FAQ_ITEMS: FaqItem[] = [
  {
    id: 'what-is-localloop',
    question: 'What is LocalLoop?',
    answer:
      'LocalLoop is a local discovery app that helps you find independent businesses, follow neighborhood favorites, explore photo and video posts, and discover nearby promotions without national chains dominating the experience.',
  },
  {
    id: 'discover-nearby',
    question: 'How do I discover nearby businesses?',
    answer:
      'Use Home to browse curated categories, open the Map to explore businesses around your location, or switch Explore and Promotions to Nearby to see what is close to you within your selected search radius.',
  },
  {
    id: 'save-items',
    question: 'How do I save a business, post, or promotion?',
    answer:
      'Tap the bookmark or save icon on business cards, Explore posts, promotion cards, business profiles, or map previews. Saved items appear in the Saved tab under Businesses, Posts, and Promotions.',
  },
  {
    id: 'explore-feed',
    question: 'How does the Explore feed work?',
    answer:
      'Explore is a visual social feed where local businesses share photos and videos. Use Nearby to discover businesses around you, or Following to see posts from businesses you follow during your session.',
  },
  {
    id: 'promotions',
    question: 'How do promotions work?',
    answer:
      'Promotions highlight limited-time deals and offers from local businesses. Browse Following or Nearby promotions, save the ones you like, and tap View Business to learn more.',
  },
  {
    id: 'location',
    question: 'Why does LocalLoop use my location?',
    answer:
      'Location helps LocalLoop show nearby businesses on the map, estimate distances, and personalize Nearby feeds. You can manage location access and search radius in Account → Location.',
  },
  {
    id: 'business-accounts',
    question: 'How do business accounts work?',
    answer:
      'Business accounts are designed for independent owners who want to share posts, promotions, and profile content with nearby customers. Consumer and business account types are supported during onboarding.',
  },
  {
    id: 'claim-business',
    question: 'How do I claim or create a business profile?',
    answer:
      'Business profile claiming is coming soon. For now, you can recommend a local business through Account → Request a Business so our team can review it for LocalLoop.',
  },
  {
    id: 'notifications',
    question: 'How do I manage notifications?',
    answer:
      'Open Account → Notifications to review activity from businesses you follow. You can mark notifications as read individually or all at once.',
  },
  {
    id: 'contact-support',
    question: 'How do I contact support?',
    answer:
      'Use Contact Support at the bottom of this screen, or submit a detailed report through Account → Report a Problem.',
  },
];
