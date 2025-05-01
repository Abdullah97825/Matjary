"use client";

import { Branch, ContactDetail, BusinessHours, BranchSection, ContactType } from "@prisma/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MapPin, Clock, Phone, Mail, Facebook, Twitter, Instagram, Linkedin, Globe, MessageCircle } from "lucide-react";
import { MapPreview } from "@/components/forms/branch/MapPreview";

type SocialContactType = Extract<ContactType, 
  'WHATSAPP' | 'FACEBOOK' | 'INSTAGRAM' | 'TWITTER' | 'LINKEDIN' | 'OTHER'
>;

const contactTypes = [
  { value: ContactType.EMAIL, label: "Email" },
  { value: ContactType.PHONE, label: "Phone" },
  { value: ContactType.WHATSAPP, label: "WhatsApp" },
  { value: ContactType.FACEBOOK, label: "Facebook" },
  { value: ContactType.INSTAGRAM, label: "Instagram" },
  { value: ContactType.TWITTER, label: "Twitter" },
  { value: ContactType.LINKEDIN, label: "LinkedIn" },
  { value: ContactType.OTHER, label: "Other" },
] as const;

type BranchWithRelations = Branch & {
  contacts: ContactDetail[];
  businessHours: BusinessHours[];
  sections: BranchSection[];
};

interface BranchCardProps {
  branch: BranchWithRelations;
}

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const getContactIcon = (type: ContactType) => {
  switch (type) {
    case 'EMAIL': return <Mail className="h-4 w-4 text-muted-foreground" />;
    case 'PHONE': return <Phone className="h-4 w-4 text-muted-foreground" />;
    case 'WHATSAPP': return <MessageCircle className="h-4 w-4 text-muted-foreground" />;
    case 'FACEBOOK': return <Facebook className="h-4 w-4 text-muted-foreground" />;
    case 'TWITTER': return <Twitter className="h-4 w-4 text-muted-foreground" />;
    case 'INSTAGRAM': return <Instagram className="h-4 w-4 text-muted-foreground" />;
    case 'LINKEDIN': return <Linkedin className="h-4 w-4 text-muted-foreground" />;
    default: return <Globe className="h-4 w-4 text-muted-foreground" />;
  }
};

const formatTime = (time: string | null) => {
  if (!time) return '';
  return new Date(`1970-01-01T${time}`).toLocaleTimeString([], { 
    hour: 'numeric', 
    minute: '2-digit' 
  });
};

export function BranchCard({ branch }: BranchCardProps) {
  const mainNonSocialContacts = branch.contacts.filter(c => 
    c.isMain && ['EMAIL', 'PHONE'].includes(c.type)
  );
  
  const otherNonSocialContacts = branch.contacts.filter(c => 
    !c.isMain && ['EMAIL', 'PHONE'].includes(c.type)
  );
  
  const socialContacts = branch.contacts.filter((c): c is ContactDetail & { type: SocialContactType } => 
    ['WHATSAPP', 'FACEBOOK', 'INSTAGRAM', 'TWITTER', 'LINKEDIN', 'OTHER'].includes(c.type)
  );

  const today = new Date().getDay();
  const currentDayHours = branch.businessHours.find(h => h.dayOfWeek === today);

  const getSocialLabel = (contact: ContactDetail) => {
    const platform = contactTypes.find(t => t.value === contact.type)?.label || contact.type;
    return contact.label ? `${platform} (${contact.label})` : platform;
  };

  const formatSocialUrl = (contact: ContactDetail) => {
    const url = contact.value.trim();
    return url.startsWith('http://') || url.startsWith('https://') ? url : `https://${url}`;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          {branch.name}
          {branch.isMain && (
            <span className="text-sm font-normal text-primary">Main Branch</span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {branch.mapEnabled && branch.latitude && branch.longitude && (
          <div className="h-[200px] rounded-md overflow-hidden">
            <MapPreview
              latitude={branch.latitude}
              longitude={branch.longitude}
              zoom={branch.mapZoomLevel}
              readOnly
            />
          </div>
        )}

        <div className="space-y-4">
          {/* Location and Main Non-Social Contacts */}
          <div className="space-y-2">
            {branch.address && (
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span>{branch.address}</span>
              </div>
            )}
            
            {mainNonSocialContacts.map(contact => (
              <div key={contact.id} className="flex items-center gap-2">
                {getContactIcon(contact.type)}
                <span>{contact.value}</span>
                {contact.label && (
                  <span className="text-sm text-muted-foreground">({contact.label})</span>
                )}
              </div>
            ))}
          </div>

          {/* Other non-social contacts */}
          {otherNonSocialContacts.length > 0 && (
            <div className="space-y-2">
              {otherNonSocialContacts.map(contact => (
                <div key={contact.id} className="flex items-center gap-2">
                  {getContactIcon(contact.type)}
                  <span>{contact.value}</span>
                  {contact.label && (
                    <span className="text-sm text-muted-foreground">({contact.label})</span>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Business Hours */}
          {currentDayHours && (
            <div className="rounded-lg border p-4">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">
                  {currentDayHours.isClosed ? 'Closed Today' : 
                    `Open Today: ${formatTime(currentDayHours.openTime)} - ${formatTime(currentDayHours.closeTime)}`}
                </span>
              </div>
              <div className="text-sm text-muted-foreground">
                {DAYS[today]}
              </div>
            </div>
          )}

          {/* Social Links */}
          {socialContacts.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {socialContacts.map(contact => (
                <a
                  key={contact.id}
                  href={formatSocialUrl(contact)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`inline-flex items-center gap-1 text-sm hover:text-foreground ${
                    contact.isMain ? 'text-foreground' : 'text-muted-foreground'
                  }`}
                >
                  {getContactIcon(contact.type)}
                  {getSocialLabel(contact)}
                </a>
              ))}
            </div>
          )}
        </div>

        {/* Additional Sections */}
        {branch.sections.map(section => (
          <div key={section.order} className="pt-4 border-t">
            <h3 className="font-medium mb-2">{section.title}</h3>
            <p className="text-muted-foreground">{section.content}</p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
} 