export const ContactType = {
    EMAIL: 'EMAIL',
    PHONE: 'PHONE',
    WHATSAPP: 'WHATSAPP',
    FACEBOOK: 'FACEBOOK',
    INSTAGRAM: 'INSTAGRAM',
    TWITTER: 'TWITTER',
    LINKEDIN: 'LINKEDIN',
    OTHER: 'OTHER'
} as const;
  
export type ContactType = (typeof ContactType)[keyof typeof ContactType];