import { Box } from '@mui/material';
import * as HeroIcons from '@heroicons/react/24/outline';
import * as HeroIconsSolid from '@heroicons/react/24/solid';

/**
 * HeroIcon Component - Wrapper for Heroicons
 * Provides a consistent interface for using Heroicons throughout the app
 */
const HeroIcon = ({ 
  name, 
  size = 24, 
  color = 'currentColor',
  solid = false,
  sx = {},
  ...props 
}) => {
  // Handle size as object (responsive) or number
  const iconSize = typeof size === 'object' 
    ? { xs: size.xs || 24, sm: size.sm || size.xs || 24 }
    : size;
  
  // Icon name mapping - maps our custom names to Heroicons names
  const iconMap = {
    // Navigation
    'home': 'HomeIcon',
    'search': 'MagnifyingGlassIcon',
    'person': 'UserIcon',
    'shoppingCart': 'ShoppingCartIcon',
    'receipt': 'DocumentTextIcon',
    'orders': 'ClipboardDocumentListIcon',
    
    // Categories
    'phone': 'DevicePhoneMobileIcon',
    'phoneCall': 'PhoneIcon',
    'laptop': 'ComputerDesktopIcon',
    'tablet': 'DeviceTabletIcon',
    'headphones': 'HeadphonesIcon',
    'speaker': 'SpeakerWaveIcon',
    'watch': 'ClockIcon',
    'camera': 'CameraIcon',
    'shoppingBag': 'ShoppingBagIcon',
    'gaming': 'CommandLineIcon',
    
    // Actions
    'favorite': 'HeartIcon',
    'favoriteBorder': 'HeartIcon',
    'add': 'PlusCircleIcon',
    'remove': 'MinusCircleIcon',
    'delete': 'TrashIcon',
    'edit': 'PencilIcon',
    'save': 'ArrowDownTrayIcon',
    'close': 'XCircleIcon',
    'check': 'CheckCircleIcon',
    'arrowBack': 'ChevronLeftIcon',
    'arrowForward': 'ChevronRightIcon',
    'arrowRight': 'ArrowRightIcon',
    'arrowUp': 'ChevronUpIcon',
    'arrowDown': 'ChevronDownIcon',
    'more': 'EllipsisHorizontalIcon',
    'lock': 'LockClosedIcon',
    'eye': 'EyeIcon',
    'eyeSlash': 'EyeSlashIcon',
    
    // Status
    'star': 'StarIcon',
    'starBorder': 'StarIcon',
    'offer': 'TagIcon',
    'localOffer': 'TagIcon',
    'inventory': 'CubeIcon',
    'people': 'UserGroupIcon',
    'money': 'CurrencyDollarIcon',
    'trendingUp': 'ArrowTrendingUpIcon',
    'pending': 'ClockIcon',
    
    // Other
    'language': 'GlobeAltIcon',
    'location': 'MapPinIcon',
    'locationOn': 'MapPinIcon',
    'dashboard': 'Squares2X2Icon',
    'menu': 'Bars3Icon',
    'filter': 'FunnelIcon',
    'sort': 'ArrowsUpDownIcon',
    'shipping': 'TruckIcon',
    'return': 'ArrowPathIcon',
    'google': 'ArrowRightOnRectangleIcon',
    'logout': 'ArrowRightOnRectangleIcon',
    'email': 'EnvelopeIcon',
    'badge': 'IdentificationIcon',
    'error': 'ExclamationCircleIcon',
    'login': 'ArrowRightOnRectangleIcon',
    'signup': 'UserPlusIcon',
  };

  const iconName = iconMap[name] || name;
  const IconLibrary = solid ? HeroIconsSolid : HeroIcons;
  const Icon = IconLibrary[iconName];

  if (!Icon) {
    console.warn(`HeroIcon: Icon "${iconName}" not found. Using placeholder.`);
    return (
      <Box
        component="span"
        sx={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: iconSize,
          height: iconSize,
          borderRadius: '50%',
          bgcolor: color === 'currentColor' ? 'text.secondary' : color,
          opacity: 0.3,
          ...sx,
        }}
        {...props}
      />
    );
  }

  const sizeStyle = typeof iconSize === 'object' 
    ? { 
        fontSize: iconSize.xs,
        width: iconSize.xs,
        height: iconSize.xs,
        '@media (min-width: 600px)': {
          fontSize: iconSize.sm,
          width: iconSize.sm,
          height: iconSize.sm,
        }
      }
    : { 
        fontSize: iconSize,
        width: iconSize,
        height: iconSize,
      };

  return (
    <Box
      component="span"
      sx={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: color,
        pointerEvents: 'none', // Allow clicks to pass through to parent
        ...sizeStyle,
        ...sx,
      }}
      {...props}
    >
      <Icon style={{ width: '100%', height: '100%' }} />
    </Box>
  );
};

export default HeroIcon;
