import React from 'react';

// Microsoft Fluent 3D Emojis (High-Definition Glossy 3D Emojis, style WhatsApp/Apple 3D)
const FLUENT_BASE = 'https://cdn.jsdelivr.net/gh/microsoft/fluentui-emoji@main/assets';

export const EMOJI_3D_MAP: Record<string, { path: string; fallback: string }> = {
  // Bebidas y licores
  whiskey: { path: 'Tumbler%20glass/3D/tumbler_glass_3d.png', fallback: '🥃' },
  beer: { path: 'Beer%20mug/3D/beer_mug_3d.png', fallback: '🍺' },
  wine: { path: 'Wine%20glass/3D/wine_glass_3d.png', fallback: '🍷' },
  champagne: { path: 'Bottle%20with%20popping%20cork/3D/bottle_with_popping_cork_3d.png', fallback: '🍾' },
  cocktail: { path: 'Cocktail%20glass/3D/cocktail_glass_3d.png', fallback: '🍸' },
  tropical: { path: 'Tropical%20drink/3D/tropical_drink_3d.png', fallback: '🍹' },
  soda: { path: 'Cup%20with%20straw/3D/cup_with_straw_3d.png', fallback: '🥤' },
  ice: { path: 'Ice/3D/ice_3d.png', fallback: '🧊' },
  fries: { path: 'French%20fries/3D/french_fries_3d.png', fallback: '🍟' },
  fire: { path: 'Fire/3D/fire_3d.png', fallback: '🔥' },
  bolt: { path: 'High%20voltage/3D/high_voltage_3d.png', fallback: '⚡' },

  // E-commerce & navegación
  cart: { path: 'Shopping%20cart/3D/shopping_cart_3d.png', fallback: '🛒' },
  search: { path: 'Magnifying%20glass%20tilted%20left/3D/magnifying_glass_tilted_left_3d.png', fallback: '🔍' },
  mailbox: { path: 'Open%20mailbox%20with%20raised%20flag/3D/open_mailbox_with_raised_flag_3d.png', fallback: '📬' },
  envelope: { path: 'Envelope/3D/envelope_3d.png', fallback: '✉️' },
  rocket: { path: 'Rocket/3D/rocket_3d.png', fallback: '🚀' },
  home: { path: 'House/3D/house_3d.png', fallback: '🏠' },
  package: { path: 'Package/3D/package_3d.png', fallback: '📦' },
  scooter: { path: 'Motor%20scooter/3D/motor_scooter_3d.png', fallback: '🛵' },
  sparkles: { path: 'Sparkles/3D/sparkles_3d.png', fallback: '✨' },
  trash: { path: 'Wastebasket/3D/wastebasket_3d.png', fallback: '🗑️' },
  cross: { path: 'Cross%20mark/3D/cross_mark_3d.png', fallback: '✖️' },
  check: { path: 'Check%20mark%20button/3D/check_mark_button_3d.png', fallback: '✅' },
  user: { path: 'Person/3D/person_3d.png', fallback: '👤' },
  shield: { path: 'Shield/3D/shield_3d.png', fallback: '🛡️' },
  lock: { path: 'Locked/3D/locked_3d.png', fallback: '🔒' },
  door: { path: 'Door/3D/door_3d.png', fallback: '🚪' },
  prohibited: { path: 'Prohibited/3D/prohibited_3d.png', fallback: '🚫' },
  up: { path: 'Up%20arrow/3D/up_arrow_3d.png', fallback: '⬆️' },
  right: { path: 'Right%20arrow/3D/right_arrow_3d.png', fallback: '👉' },
  pen: { path: 'Pen/3D/pen_3d.png', fallback: '✏️' },
  gear: { path: 'Gear/3D/gear_3d.png', fallback: '⚙️' },
  chart: { path: 'Bar%20chart/3D/bar_chart_3d.png', fallback: '📊' },
  phone: { path: 'Telephone%20receiver/3D/telephone_receiver_3d.png', fallback: '📞' },
  pin: { path: 'Round%20pushpin/3D/round_pushpin_3d.png', fallback: '📍' },
  clock: { path: 'Alarm%20clock/3D/alarm_clock_3d.png', fallback: '🕒' },
  image: { path: 'Framed%20picture/3D/framed_picture_3d.png', fallback: '🖼️' },
  money: { path: 'Money%20bag/3D/money_bag_3d.png', fallback: '💰' },
  star: { path: 'Star/3D/star_3d.png', fallback: '⭐' },
  truck: { path: 'Delivery%20truck/3D/delivery_truck_3d.png', fallback: '🚚' }
};

export function getCategoryEmoji3DKey(catIdOrIcon?: string, name?: string): string {
  const query = `${catIdOrIcon || ''} ${name || ''}`.toLowerCase();
  if (query.includes('destilad') || query.includes('pisco') || query.includes('whiskey') || query.includes('whisky') || query.includes('gin') || query.includes('vodka') || query.includes('ron')) return 'whiskey';
  if (query.includes('cerveza') || query.includes('beer') || query.includes('artesanal') || query.includes('ipa') || query.includes('lager')) return 'beer';
  if (query.includes('vino') || query.includes('wine') || query.includes('espumante') || query.includes('champagne') || query.includes('tinto') || query.includes('blanco')) return 'wine';
  if (query.includes('promo') || query.includes('mega') || query.includes('oferta') || query.includes('fire') || query.includes('bolt')) return 'fire';
  if (query.includes('bebida') || query.includes('jugo') || query.includes('energetica') || query.includes('cola')) return 'soda';
  if (query.includes('hielo') || query.includes('ice')) return 'ice';
  if (query.includes('snack') || query.includes('papa') || query.includes('picoteo')) return 'fries';
  if (query.includes('aperitivo') || query.includes('cocktail') || query.includes('trago')) return 'cocktail';
  return 'champagne';
}

interface Emoji3DProps {
  name: string;
  className?: string;
  alt?: string;
}

export const Emoji3D: React.FC<Emoji3DProps> = ({ name, className = 'w-5 h-5', alt = '' }) => {
  const [hasError, setHasError] = React.useState(false);
  const info = EMOJI_3D_MAP[name] || { path: '', fallback: '✨' };

  if (hasError || !info.path) {
    return <span className="inline-block select-none" role="img" aria-label={alt || name}>{info.fallback}</span>;
  }

  const url = `${FLUENT_BASE}/${info.path}`;

  return (
    <img
      src={url}
      alt={alt || name}
      className={`inline-block object-contain select-none shrink-0 drop-shadow-sm ${className}`}
      loading="lazy"
      onError={() => setHasError(true)}
      referrerPolicy="no-referrer"
    />
  );
};
