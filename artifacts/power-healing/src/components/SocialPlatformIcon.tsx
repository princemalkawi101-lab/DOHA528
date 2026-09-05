import {
  FaFacebookF,
  FaInstagram,
  FaLinkedinIn,
  FaLink,
  FaSnapchatGhost,
  FaTelegramPlane,
  FaTiktok,
  FaWhatsapp,
  FaYoutube,
} from 'react-icons/fa';
import { FaXTwitter } from 'react-icons/fa6';
import { SocialPlatform } from '@/lib/socialLinks';

export function SocialPlatformIcon({
  platform,
  className = '',
}: {
  platform: SocialPlatform;
  className?: string;
}) {
  const props = { className, 'aria-hidden': true };

  switch (platform) {
    case 'instagram': return <FaInstagram {...props} />;
    case 'facebook': return <FaFacebookF {...props} />;
    case 'telegram': return <FaTelegramPlane {...props} />;
    case 'whatsapp': return <FaWhatsapp {...props} />;
    case 'youtube': return <FaYoutube {...props} />;
    case 'tiktok': return <FaTiktok {...props} />;
    case 'x': return <FaXTwitter {...props} />;
    case 'linkedin': return <FaLinkedinIn {...props} />;
    case 'snapchat': return <FaSnapchatGhost {...props} />;
    default: return <FaLink {...props} />;
  }
}
