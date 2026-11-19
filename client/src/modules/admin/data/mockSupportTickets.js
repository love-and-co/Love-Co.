export const INITIAL_SUPPORT_TICKETS = [
  {
    id: 'TKT-1042',
    customerName: 'Ananya Sharma',
    customerEmail: 'ananya.s@gmail.com',
    customerPhone: '+91 98765 43210',
    orderId: 'ORD-8821',
    category: 'Order & Delivery',
    priority: 'HIGH',
    status: 'OPEN',
    subject: 'When will my BLOOM Artisanal Soap order be shipped?',
    message: 'Hello Love & Co. team, I placed order ORD-8821 for the BLOOM Hibiscus & Shea Butter soap 2 days ago. I haven\'t received a tracking update yet and wanted to know when it will be dispatched from the atelier.',
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
    replies: []
  },
  {
    id: 'TKT-1041',
    customerName: 'Meera Iyer',
    customerEmail: 'meera.iyer@yahoo.com',
    customerPhone: '+91 97110 56789',
    orderId: 'ORD-9104',
    category: 'Order & Delivery',
    priority: 'HIGH',
    status: 'OPEN',
    subject: 'Address correction request before dispatch',
    message: 'Hi, I mistakenly entered the wrong pincode on order ORD-9104 (entered 560001 instead of 560034 in Koramangala). Could you please correct the address before courier handoff?',
    createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(), // 5 hours ago
    replies: []
  },
  {
    id: 'TKT-1038',
    customerName: 'Rohan Deshmukh',
    customerEmail: 'rohan.desh@outlook.com',
    customerPhone: '+91 98234 11223',
    orderId: 'ORD-7742',
    category: 'Product Formulation',
    priority: 'MEDIUM',
    status: 'IN_PROGRESS',
    subject: 'Storage tips for VELVET bar in high humidity',
    message: 'Hi! I received the VELVET Raw Honey & Cocoa Butter bar yesterday. Given the coastal humidity in Mumbai, what is the best way to store it so it maintains its firmness between uses?',
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
    replies: [
      {
        id: 'rep-1',
        sender: 'Admin Support',
        time: new Date(Date.now() - 20 * 60 * 60 * 1000).toISOString(),
        text: 'Hello Rohan! Because our artisan soaps contain 100% cold-pressed plant oils and zero synthetic hardening waxes, we recommend placing your VELVET bar on a slatted, well-draining wooden soap dish away from direct shower spray between uses.'
      }
    ]
  },
  {
    id: 'TKT-1029',
    customerName: 'Kavita Nair',
    customerEmail: 'kavita.nair@gmail.com',
    customerPhone: '+91 99887 66554',
    orderId: '',
    category: 'Product Formulation',
    priority: 'LOW',
    status: 'RESOLVED',
    subject: 'Allergen inquiry: Does BLUSH Rose Clay contain essential oils?',
    message: 'Hello! My skin is prone to contact dermatitis from synthetic fragrances. Does the BLUSH soap contain artificial aromachemicals or pure botanicals?',
    createdAt: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(), // 2 days ago
    replies: [
      {
        id: 'rep-2',
        sender: 'Admin Support',
        time: new Date(Date.now() - 45 * 60 * 60 * 1000).toISOString(),
        text: 'Hello Kavita, our BLUSH formula is naturally scented strictly with steam-distilled Bulgarian Rose Otto and mineral-rich French Rose Kaolin clay. It is 100% free of artificial fragrances, phthalates, and synthetic dyes.'
      }
    ]
  }
];

export const SUPPORT_STORAGE_KEY = 'love_co_customer_support_tickets';

