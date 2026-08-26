/**
 * Test fixtures and mock data for Playwright E2E tests.
 */

export const VALID_BACKUP_PAYLOAD = {
  version: 1,
  app: 'sirvinistyles',
  exported_at: '2026-08-26T10:00:00.000Z',
  data: {
    perfumes: [
      {
        id: 1,
        name: 'Baccarat Rouge 540',
        brand: 'Maison Francis Kurkdjian',
        category: 'Woody Amber',
        gender: 'Unisex',
        notes: 'Amberwood, Saffron, Jasmine, Cedar',
        image_url: '/images/baccarat_rouge.jpg'
      },
      {
        id: 2,
        name: 'Aventus',
        brand: 'Creed',
        category: 'Fruity Chypre',
        gender: 'Men',
        notes: 'Pineapple, Birch, Musk, Bergamot',
        image_url: '/images/aventus.jpg'
      }
    ],
    posts: [
      {
        id: '2026-08-26-post-1',
        date: '2026-08-26',
        perfume_id: 1,
        perfume_name: 'Baccarat Rouge 540',
        brand: 'Maison Francis Kurkdjian',
        theme: 'Luxury Seduction',
        week_of_month: 4,
        active_category: 'Woody Amber',
        is_generic: false,
        main_post: 'Unleash unparalleled confidence with Baccarat Rouge 540. Top notes of radiant saffron and jasmine.',
        image_url: '/images/baccarat_rouge.jpg',
        whatsapp_sequence: [
          { time: '08:00 AM', content: 'Good morning VIPs! Starting the day with pure luxury: Baccarat Rouge 540.' },
          { time: '02:00 PM', content: 'Notice how this scent turns heads everywhere you step.' }
        ],
        reel_script: 'Hook: Stop wearing ordinary scents. Step into luxury with Baccarat Rouge 540.'
      }
    ],
    selection_history: [
      {
        id: 1,
        perfume_id: 1,
        selected_at: '2026-08-26T08:00:00.000Z',
        date: '2026-08-26'
      }
    ],
    app_settings: [
      { key: 'theme_mode', value: 'dark' },
      { key: 'last_active_tab', value: 'main' }
    ]
  }
};

export const CORRUPT_SCHEMA_PAYLOADS = {
  missingVersion: {
    app: 'sirvinistyles',
    data: { perfumes: [], posts: [], selection_history: [] }
  },
  invalidApp: {
    version: 1,
    app: 'unknown_app',
    data: { perfumes: [], posts: [] }
  },
  corruptDataStructure: {
    version: 1,
    app: 'sirvinistyles',
    data: 'invalid_string_instead_of_object'
  },
  missingStores: {
    version: 1,
    app: 'sirvinistyles',
    data: {
      perfumes: 'not_an_array'
    }
  }
};
