import {
  STORES,
  putToStore,
  getAllFromStore
} from './db';
import {
  getActiveThemeAndCategory,
  getLagosDateTime
} from './themeEngine';
import { selectPerfume } from './perfumeSelector';

export { getActiveThemeAndCategory };

/**
 * Selects the daily perfume based on active theme and category rotation.
 * @param {Date} [date] 
 * @returns {Promise<Object|null>}
 */
export async function selectDailyPerfume(date = new Date()) {
  const { activeCategory } = getActiveThemeAndCategory(date);
  return await selectPerfume(activeCategory);
}

/**
 * Builds rich, high-converting Nigerian luxury copywriting for main post.
 */
function buildMainPost({ perfume, theme, category, isGeneric, timeOfDay }) {
  if (isGeneric || !perfume) {
    const genericPosts = [
      `Your fragrance should always introduce you before you speak. ✨

In business, luxury, and social circles across Lagos and Abuja, scent is your invisible business card. True presence isn't about being the loudest in the room — it's about leaving an unforgettable impression long after you've exited.

3 Golden Rules of Fragrance Etiquette:
✔ Apply to warm pulse points (wrists, neck, behind ears).
✔ Layer perfume oils with unscented moisturizers for 24+ hour longevity.
✔ Never rub your wrists together — let the fragrance notes breathe naturally.

Discover the difference of 100% pure undiluted perfume oils.

Send us a WhatsApp message to explore our private curation.`,

      `The Ultimate Secret to 24-Hour Fragrance Projection. 💎

Ever wonder why standard alcohol perfumes fade by midday in the Nigerian heat? Alcohol evaporates rapidly under our climate, carrying the fragrance oils away with it.

Pure perfume oils absorb directly into your skin's natural lipid barrier. As your body temperature warms throughout the day, the oil continuously radiates a smooth, rich aura that turns heads from morning meetings to late evening dinners.

Smell expensive. Feel confident. Elevate your essence.

Send us a WhatsApp message to order your signature oil today.`,

      `What does success actually smell like? 🥂

It smells like quiet confidence. It smells like rare woods, warm amber, and fresh crisp citrus. It smells like entering the boardroom knowing your preparation and aura are flawless.

At SirviniStyles, we curate world-class fragrance oils inspired by the world's most prestigious perfume houses — designed specifically to endure through every hustle and celebration.

Upgrade your daily signature scent without compromise.

Send us a WhatsApp message to claim your bespoke collection.`
    ];
    return genericPosts[Math.floor(Math.random() * genericPosts.length)];
  }

  const name = perfume.perfume_name || perfume.name;
  const brand = perfume.brand || 'SirviniStyles';
  const profile = perfume.scent_profile || 'Fresh & Luxurious';
  const bestFor = perfume.best_for || 'Office, Dinners & VIP Events';
  const longevity = perfume.longevity || '24+ Hours';
  const gender = perfume.gender || 'Unisex';

  if (gender === 'Women') {
    return `Stepping out in pure elegance with '${name}' ${brand !== 'SirviniStyles' ? `by ${brand}` : ''}. ✨

Some fragrances announce your arrival, but this one paints an unforgettable picture of grace, allure, and quiet power. Imagine leaving a captivating trail that effortlessly commands respect without saying a single word.

Scent Profile: ${profile}

✔ 100% Undiluted Perfume Oil (${longevity} Longevity)
✔ Exceptional sillage designed for the Nigerian climate
✔ Radiates confidence and luxury at accessible prices

Perfect for:
• ${bestFor}
• Special dates & high-society events
• Making an indelible first impression

Luxury begins before you speak. Elevate your essence today.

Send us a WhatsApp message to place your order.`;
  }

  if (gender === 'Men') {
    return `Command the room with effortless authority: '${name}' ${brand !== 'SirviniStyles' ? `by ${brand}` : ''}. 👔✨

A signature scent isn't an accessory; it's your silent declaration of confidence as you navigate boardrooms, client pitches, and upscale evenings. Crafted for the man whose presence is felt before he speaks.

Scent Profile: ${profile}

✔ 100% Pure Perfume Oil — ${longevity} guaranteed endurance
✔ Strong masculine projection that beats the heat
✔ Formulated for maximum compliment factor

Perfect for:
• ${bestFor}
• Corporate power dressing & executive summits
• High-impact nightlife and celebrations

Walk into every room with confidence. 

Send us a WhatsApp message to secure your bottle today.`;
  }

  return `Unmatched prestige and magnetic allure: '${name}' ${brand !== 'SirviniStyles' ? `by ${brand}` : ''}. 💎

A breathtaking blend that transcends ordinary perfumery. Designed for those who value quiet luxury, rich sillage, and scents that linger in memory long after you've left the room.

Scent Profile: ${profile}

✔ 100% Pure Perfume Oil (${longevity} Longevity)
✔ Formulated with rare resins, precious woods & radiant notes
✔ High compliment factor and room-filling projection

Perfect for:
• ${bestFor}
• Everyday executive signature
• Owambes, weddings and prestigious dinners

Your fragrance should introduce you. Experience accessible luxury without compromise.

Send us a WhatsApp message to reserve yours now.`;
}

/**
 * Builds the 4 WhatsApp Status sequence updates.
 */
function buildWhatsAppSequence({ perfume, isGeneric, theme }) {
  const name = perfume ? (perfume.perfume_name || perfume.name) : 'SirviniStyles Luxury Oil';

  if (isGeneric || !perfume) {
    return [
      {
        time: 'Morning (8-9 AM)',
        content: `Good morning VIPs! ☀️ Start your day with intention and confidence. Your fragrance sets the tone for everything you achieve today. #SirviniStyles #DailyMotivation`,
        image_suggestion: 'Sleek morning flat lay with luxury watch, leather journal, and golden perfume dropper bottle catching sun rays.'
      },
      {
        time: 'Midday (12-2 PM)',
        content: `Midday hustle test! 💼 When the weather heats up, our pure perfume oils only get richer and more captivating. Still smelling 10/10. #PerfumeOilDifference #Endurance`,
        image_suggestion: 'Macro close-up of amber perfume oil gleaming inside crystal flacon on executive desk.'
      },
      {
        time: 'Evening (5-7 PM)',
        content: `Dispatches are moving nationwide! 📦 Thank you for trusting SirviniStyles. Fresh luxury bottles en route to Lagos, Abuja, PH, and Ibadan. #NationwideDelivery`,
        image_suggestion: 'Branded black luxury velvet pouches packed securely in dispatch boxes with express delivery labels.'
      },
      {
        time: 'Night (8-10 PM)',
        content: `Wind down or step out? Whatever your evening holds, make sure your aura is unforgettable. Restock your signature scent via WhatsApp. 🌙✨ #EveningLuxury`,
        image_suggestion: 'Atmospheric evening view of city lights through upscale penthouse glass with perfume bottle in foreground.'
      }
    ];
  }

  return [
    {
      time: 'Morning (8-9 AM)',
      content: `Good morning! ☀️ Starting the day with pure confidence: '${name}'. A few drops on your pulse points and you're ready to conquer every meeting. #SirviniStyles #ScentOfTheDay`,
      image_suggestion: `Aesthetic morning flat lay featuring '${name}' bottle beside coffee and tailored outfit.`
    },
    {
      time: 'Midday (12-2 PM)',
      content: `Midday check-in! 💧 The heat is on, but '${name}' is still radiating strong. That's the power of 100% undiluted perfume oil — no fading, just pure luxury. #24HourLongevity`,
      image_suggestion: `Close-up shot of perfume oil applied on wrist with glistening luxury sheen.`
    },
    {
      time: 'Evening (5-7 PM)',
      content: `Transitioning from work hustle to evening vibes with '${name}'. Orders are packing and going out for delivery tomorrow morning! Reserve yours now. 🚚✨ #OrderDispatches`,
      image_suggestion: `Dispatched order box showing '${name}' in signature velvet pouch with luxury ribbon.`
    },
    {
      time: 'Night (8-10 PM)',
      content: `Limited stock alert on '${name}'! 🔥 If you love compliment-heavy fragrances that last through the night, send a WhatsApp message before tonight's batch sells out. 🌙 #LimitedStock`,
      image_suggestion: `Moody, elegant evening shot of '${name}' illuminated by soft candlelight.`
    }
  ];
}

/**
 * Builds 15-30s Reel script if required.
 */
function buildReelScript({ perfume, dayOfWeek, theme, isGeneric }) {
  const name = perfume ? (perfume.perfume_name || perfume.name) : 'SirviniStyles Collection';
  const brand = perfume ? (perfume.brand || 'SirviniStyles') : 'SirviniStyles';

  return `TITLE: Unforgettable Luxury — ${name}

[0-2s] OPENING HOOK:
- Visual: Macro close-up of crystal oil dropper releasing a single golden drop onto a wrist in slow motion.
- Text Overlay: "Stop wearing scents that fade in 2 hours."
- Voiceover: "Ready to smell like pure luxury all day?"

[3-8s] SHOT LIST & DEMO:
- Visual: Smooth 360-degree rotation of ${name} on polished black marble with golden ambient backlighting.
- Text Overlay: "${name} by ${brand} | 100% Perfume Oil"
- Voiceover: "This isn't regular alcohol spray. This is 100% pure concentrated perfume oil."

[9-15s] THE EXPERIENCE & NOTES:
- Visual: Fast cuts: Executive stepping out of luxury car, walking into boardroom, receiving compliments.
- Text Overlay: "24+ Hours Longevity • Beast-Mode Sillage"
- Voiceover: "Built for the Nigerian heat. It stays on your skin and clothes for 24+ hours."

[16-22s] SOCIAL PROOF & STATUS:
- Visual: Luxury customer unpacking branded SirviniStyles velvet box with certificate card.
- Text Overlay: "Accessible Luxury • Nationwide Delivery"
- Voiceover: "Turn heads wherever you step without breaking the bank."

[23-30s] ENDING CTA:
- Visual: Hero bottle shot with SirviniStyles logo and WhatsApp prompt icon.
- Text Overlay: "Send us a WhatsApp message to order | Link in Bio"
- Voiceover: "Send us a WhatsApp message now. Delivery nationwide."
- Music Vibe: Smooth Afro-fusion luxury lounge beat.`;
}

/**
 * Generates the complete daily blueprint offline and persists it to IndexedDB.
 * @param {number|string} [perfumeId] 
 * @param {Date} [date] 
 * @returns {Promise<Object>} Complete GenerateResponse
 */
export async function generateDailyBlueprint(perfumeId = null, date = new Date()) {
  const themeConfig = getActiveThemeAndCategory(date);
  const { lagosDate, theme, weekOfMonth, activeCategory, isGeneric, requiresReel, timeOfDay } = themeConfig;

  // 1. Select or fetch perfume
  let perfume = null;
  if (!isGeneric || perfumeId !== null) {
    perfume = await selectPerfume(activeCategory, perfumeId);
  }

  // 2. Generate copy
  const mainPost = buildMainPost({
    perfume,
    theme,
    category: activeCategory,
    isGeneric,
    timeOfDay
  });

  const whatsappSeq = buildWhatsAppSequence({
    perfume,
    isGeneric,
    theme
  });

  const reelScript = requiresReel
    ? buildReelScript({ perfume, dayOfWeek: lagosDate.dayOfWeek, theme, isGeneric })
    : null;

  const perfumeName = perfume ? (perfume.perfume_name || perfume.name) : 'SirviniStyles Daily Blueprint';
  const brand = perfume ? (perfume.brand || 'SirviniStyles') : 'SirviniStyles';

  // 3. Resolve image URL
  let imageUrl = null;
  if (perfume) {
    if (perfume.image_url) {
      imageUrl = perfume.image_url;
    } else if (perfume.image_filename) {
      imageUrl = `/images/${perfume.image_filename}`;
    } else {
      imageUrl = '/images/default_perfume.jpg';
    }
  } else if (!isGeneric) {
    imageUrl = '/images/default_perfume.jpg';
  }

  const hashtags = [
    '#SirviniStyles',
    '#LuxuryPerfumeOil',
    '#NigerianLuxury',
    '#SmellExpensive',
    '#LagosStyle',
    '#PerfumeLoversNigeria',
    perfume ? `#${perfumeName.replace(/[^a-zA-Z0-9]/g, '')}` : '#DailyFragrance'
  ];

  const keywords = [
    'SirviniStyles',
    perfumeName,
    brand,
    activeCategory,
    'perfume oil Nigeria',
    'long lasting perfume Lagos',
    'luxury fragrance oils'
  ];

  const hook = perfume
    ? `Command every room you step into with '${perfumeName}'.`
    : 'Your fragrance should always introduce you before you speak.';

  const cta = 'Send us a WhatsApp message to place your order.';
  const imagePrompt = perfume?.image_generation_prompt || `Cinematic luxury perfume oil bottle on black marble with golden light reflections`;
  const engagementQuestion = perfume
    ? `When wearing '${perfumeName}', what impression do you want to leave on the people you meet? Tell us in the comments!`
    : 'What is your go-to fragrance note for closing big deals? Comment below!';

  // 4. Construct unique blueprint record
  const uniqueId = `${lagosDate.isoDate}-post-${Date.now()}`;
  const blueprint = {
    id: uniqueId,
    date: lagosDate.isoDate,
    created_at: new Date().toISOString(),
    perfume_id: perfume ? perfume.id : null,
    perfume_name: perfumeName,
    brand,
    theme,
    week_of_month: weekOfMonth,
    active_category: activeCategory,
    is_generic: isGeneric,
    main_post: mainPost,
    whatsapp_sequence: whatsappSeq,
    reel_script: reelScript,
    image_url: imageUrl,
    generated_image_file: perfume?.image_filename || null,
    hashtags,
    keywords,
    hook,
    cta,
    image_prompt: imagePrompt,
    engagement_question: engagementQuestion
  };

  // 5. Persist to IndexedDB 'posts' store
  await putToStore(STORES.POSTS, blueprint);

  return blueprint;
}

/**
 * Retrieves the latest generated blueprint for today's Lagos date.
 * @param {Date} [date] 
 * @returns {Promise<Object|null>}
 */
export async function getTodayBlueprint(date = new Date()) {
  const lagos = getLagosDateTime(date);
  const posts = await getAllFromStore(STORES.POSTS);

  if (!posts || posts.length === 0) {
    return null;
  }

  // Filter posts matching today's date
  const todayPosts = posts.filter((p) => {
    return p.date === lagos.isoDate || (typeof p.id === 'string' && (p.id.includes(lagos.isoDate) || p.id.includes(lagos.dateKey)));
  });

  if (todayPosts.length > 0) {
    // Return the latest post generated today
    return todayPosts[todayPosts.length - 1];
  }

  return null;
}
