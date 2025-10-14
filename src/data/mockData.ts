// Mock data for the Sterling Publishers e-commerce site

export interface Category {
  id: string;
  name: string;
  slug: string;
  parent_id: string | null;
  code: string;
  sort_order: number;
}

export interface Author {
  id: string;
  name: string;
  slug: string;
  photo_url?: string;
  bio: string;
  socials?: {
    twitter?: string;
    instagram?: string;
    website?: string;
  };
}

export interface Book {
  id: string;
  title: string;
  subtitle?: string;
  slug: string;
  description: string;
  language: string;
  format: 'Hardcover' | 'Paperback' | 'eBook';
  price: number;
  currency: string;
  isbn10?: string;
  isbn13?: string;
  publication_date: string;
  pages?: number;
  stock_status: 'In Stock' | 'Out of Stock' | 'Preorder';
  images: string[];
  authors: Author[];
  series?: string;
  category_id: string;
  tags: string[];
  bestseller_rank?: number;
  is_latest_release: boolean;
  rating?: number;
}

// Categories following the exact taxonomy specified
export const categories: Category[] = [
  { id: '1', name: 'Latest Releases', slug: 'latest-releases', parent_id: null, code: '1', sort_order: 1 },
  
  // Books on Shirdi Sai Baba
  { id: '2', name: 'Books on Shirdi Sai Baba', slug: 'shirdi-sai-baba', parent_id: null, code: '2', sort_order: 2 },
  { id: '2a', name: 'Hindi', slug: 'shirdi-sai-baba-hindi', parent_id: '2', code: '2a', sort_order: 1 },
  { id: '2b', name: 'Oriya', slug: 'shirdi-sai-baba-oriya', parent_id: '2', code: '2b', sort_order: 2 },
  { id: '2c', name: 'Kannada', slug: 'shirdi-sai-baba-kannada', parent_id: '2', code: '2c', sort_order: 3 },
  { id: '2d', name: 'Tamil', slug: 'shirdi-sai-baba-tamil', parent_id: '2', code: '2d', sort_order: 4 },
  { id: '2e', name: 'Telugu', slug: 'shirdi-sai-baba-telugu', parent_id: '2', code: '2e', sort_order: 5 },
  
  // Other Religious Books
  { id: '3', name: 'Other Religious Books', slug: 'other-religious', parent_id: null, code: '3', sort_order: 3 },
  { id: '3a', name: 'Divine Gurus', slug: 'divine-gurus', parent_id: '3', code: '3a', sort_order: 1 },
  { id: '3b', name: 'The Thousand Names of God Series', slug: 'thousand-names-series', parent_id: '3', code: '3b', sort_order: 2 },
  { id: '3c', name: '108 Names of God Series', slug: '108-names-series', parent_id: '3', code: '3c', sort_order: 3 },
  
  // Coffee Table Books and Paperbacks
  { id: '4', name: 'Coffee Table Books and Paperbacks', slug: 'coffee-table-paperbacks', parent_id: null, code: '4', sort_order: 4 },
  { id: '4a', name: 'Featured', slug: 'featured', parent_id: '4', code: '4a', sort_order: 1 },
  { id: '4b', name: 'Health', slug: 'health', parent_id: '4', code: '4b', sort_order: 2 },
  { id: '4b1', name: 'Healthy Living and Yoga', slug: 'healthy-living-yoga', parent_id: '4b', code: '4b1', sort_order: 1 },
  { id: '4b2', name: 'Holistic Health', slug: 'holistic-health', parent_id: '4b', code: '4b2', sort_order: 2 },
  { id: '4c', name: 'Occult Sciences', slug: 'occult-sciences', parent_id: '4', code: '4c', sort_order: 3 },
  { id: '4d', name: 'Spirituality', slug: 'spirituality', parent_id: '4', code: '4d', sort_order: 4 },
  { id: '4e', name: 'Management and Leadership', slug: 'management-leadership', parent_id: '4', code: '4e', sort_order: 5 },
  { id: '4f', name: 'International Language', slug: 'international-language', parent_id: '4', code: '4f', sort_order: 6 },
  { id: '4g', name: 'Cookery', slug: 'cookery', parent_id: '4', code: '4g', sort_order: 7 },
  { id: '4h', name: 'Fiction', slug: 'fiction', parent_id: '4', code: '4h', sort_order: 8 },
  { id: '4i', name: 'Real Life Poetry', slug: 'real-life-poetry', parent_id: '4', code: '4i', sort_order: 9 },
  { id: '4j', name: 'Reference', slug: 'reference', parent_id: '4', code: '4j', sort_order: 10 },
  { id: '4k', name: 'Miscellaneous', slug: 'miscellaneous', parent_id: '4', code: '4k', sort_order: 11 },
  { id: '4l', name: 'Gift Books', slug: 'gift-books', parent_id: '4', code: '4l', sort_order: 12 },
  { id: '4m', name: 'Books In Hindi', slug: 'books-hindi', parent_id: '4', code: '4m', sort_order: 13 },
  
  // Text Books
  { id: '5', name: 'Text Books', slug: 'textbooks', parent_id: null, code: '5', sort_order: 5 },
  { id: '5a', name: 'Political Science', slug: 'political-science', parent_id: '5', code: '5a', sort_order: 1 },
  { id: '5b', name: 'Public Administration', slug: 'public-administration', parent_id: '5', code: '5b', sort_order: 2 },
  { id: '5c', name: 'History', slug: 'history', parent_id: '5', code: '5c', sort_order: 3 },
  { id: '5d', name: 'Sociology', slug: 'sociology', parent_id: '5', code: '5d', sort_order: 4 },
  { id: '5e', name: 'English', slug: 'english', parent_id: '5', code: '5e', sort_order: 5 },
  { id: '5f', name: 'Media Studies', slug: 'media-studies', parent_id: '5', code: '5f', sort_order: 6 },
  { id: '5g', name: 'Tourism', slug: 'tourism', parent_id: '5', code: '5g', sort_order: 7 },
  { id: '5h', name: 'Environmental Studies', slug: 'environmental-studies', parent_id: '5', code: '5h', sort_order: 8 },
  { id: '5i', name: 'Education', slug: 'education', parent_id: '5', code: '5i', sort_order: 9 },
  { id: '5j', name: 'Psychology', slug: 'psychology', parent_id: '5', code: '5j', sort_order: 10 },
  { id: '5k', name: 'Management', slug: 'management', parent_id: '5', code: '5k', sort_order: 11 },
];

export const authors: Author[] = [
  {
    id: '1',
    name: 'Dr. Rajesh Sharma',
    slug: 'dr-rajesh-sharma',
    bio: 'Dr. Rajesh Sharma is a renowned spiritual teacher and author with over 20 years of experience in Vedic studies.',
    socials: {
      website: 'https://drrajeshsharma.com'
    }
  },
  {
    id: '2',
    name: 'Priya Nair',
    slug: 'priya-nair',
    bio: 'Priya Nair is an accomplished author specializing in health and wellness literature.',
  },
  {
    id: '3',
    name: 'Prof. Amit Kumar',
    slug: 'prof-amit-kumar',
    bio: 'Professor Amit Kumar has authored several textbooks on political science and public administration.',
  }
];

export const books: Book[] = [
  // Books on Shirdi Sai Baba - Hindi
  {
    id: '1',
    title: 'Shirdi Sai Baba Ki Divya Leela',
    subtitle: 'Sachchi Ghatnaon Par Aadharit',
    slug: 'shirdi-sai-baba-divya-leela-hindi',
    description: 'Shirdi Sai Baba ke jeevan ki anmol ghatnaon aur unki divya leela ka sampoorna varnan. Ye pustak bhakton ke liye ek anmol khazana hai.',
    language: 'Hindi',
    format: 'Hardcover',
    price: 450,
    currency: 'INR',
    isbn10: '8123456789',
    isbn13: '978-81-234-5678-9',
    publication_date: '2024-01-15',
    pages: 320,
    stock_status: 'In Stock',
    images: ['/img/book/01.png'],
    authors: [authors[0]],
    series: 'Sai Leela Series',
    category_id: '2a',
    tags: ['spirituality', 'sai baba', 'devotion', 'hindi'],
    is_latest_release: true,
    bestseller_rank: 1,
    rating: 4.8
  },
  {
    id: '2',
    title: 'Sai Charitra Mala',
    subtitle: 'Shirdi Sai Baba Ke 108 Anmol Vachan',
    slug: 'sai-charitra-mala-hindi',
    description: 'Shirdi Sai Baba ke 108 anmol vachan jo jeevan mein shanti aur samriddhi laate hain.',
    language: 'Hindi',
    format: 'Paperback',
    price: 299,
    currency: 'INR',
    isbn13: '978-81-234-5679-6',
    publication_date: '2023-11-20',
    pages: 180,
    stock_status: 'In Stock',
    images: ['/img/book/02.png'],
    authors: [authors[0]],
    category_id: '2a',
    tags: ['sai baba', 'quotes', 'wisdom', 'hindi'],
    is_latest_release: false,
    bestseller_rank: 4,
    rating: 4.6
  },
  
  // Books on Shirdi Sai Baba - Telugu
  {
    id: '3',
    title: 'Sri Sai Leelalu',
    subtitle: 'Shirdi Sai Baba Yoka Divya Charitra',
    slug: 'sri-sai-leelalu-telugu',
    description: 'Shirdi Sai Baba gari jeevan charitra mariyu divya leelala gurinchi Telugu lo sampurna grantham.',
    language: 'Telugu',
    format: 'Hardcover',
    price: 520,
    currency: 'INR',
    isbn13: '978-81-234-5680-2',
    publication_date: '2023-12-10',
    pages: 350,
    stock_status: 'In Stock',
    images: ['/img/book/03.png'],
    authors: [authors[0]],
    category_id: '2e',
    tags: ['sai baba', 'telugu', 'biography', 'spirituality'],
    is_latest_release: true,
    bestseller_rank: 6,
    rating: 4.7
  },

  // Other Religious Books - Divine Gurus
  {
    id: '4',
    title: 'The Thousand Names of Vishnu',
    subtitle: 'Vishnu Sahasranama with Commentary',
    slug: 'thousand-names-vishnu',
    description: 'A detailed commentary on the Vishnu Sahasranama with meanings and spiritual significance of each name.',
    language: 'English',
    format: 'Hardcover',
    price: 899,
    currency: 'INR',
    isbn13: '978-81-234-5681-9',
    publication_date: '2024-02-28',
    pages: 420,
    stock_status: 'In Stock',
    images: ['/img/book/04.png'],
    authors: [authors[0]],
    series: 'Divine Names Series',
    category_id: '3b',
    tags: ['hinduism', 'vishnu', 'spirituality', 'mantras'],
    is_latest_release: true,
    bestseller_rank: 2,
    rating: 4.9
  },
  {
    id: '5',
    title: 'Ashtottara Shatanamavali',
    subtitle: '108 Names of Lord Krishna',
    slug: 'krishna-108-names',
    description: 'Sacred collection of 108 names of Lord Krishna with detailed meanings and meditation practices.',
    language: 'English',
    format: 'Paperback',
    price: 350,
    currency: 'INR',
    isbn13: '978-81-234-5682-6',
    publication_date: '2023-09-15',
    pages: 180,
    stock_status: 'In Stock',
    images: ['/img/book/05.png'],
    authors: [authors[0]],
    series: '108 Names Series',
    category_id: '3c',
    tags: ['krishna', 'mantras', 'devotion', '108 names'],
    is_latest_release: false,
    bestseller_rank: 7,
    rating: 4.5
  },

  // Coffee Table Books - Health
  {
    id: '6',
    title: 'Yoga for Modern Living',
    subtitle: 'Ancient Wisdom for Contemporary Life',
    slug: 'yoga-modern-living',
    description: 'A comprehensive guide to incorporating yoga and mindfulness into your daily routine for better health and wellness.',
    language: 'English',
    format: 'Paperback',
    price: 599,
    currency: 'INR',
    isbn13: '978-81-234-5683-3',
    publication_date: '2023-11-20',
    pages: 280,
    stock_status: 'In Stock',
    images: ['/img/book/06.png'],
    authors: [authors[1]],
    category_id: '4b1',
    tags: ['yoga', 'health', 'wellness', 'meditation'],
    is_latest_release: true,
    bestseller_rank: 3,
    rating: 4.6
  },
  {
    id: '7',
    title: 'Holistic Healing Techniques',
    subtitle: 'Natural Methods for Complete Wellness',
    slug: 'holistic-healing-techniques',
    description: 'Explore ancient and modern healing methods for complete wellness of body, mind, and spirit.',
    language: 'English',
    format: 'Hardcover',
    price: 750,
    currency: 'INR',
    isbn13: '978-81-234-5684-0',
    publication_date: '2023-12-05',
    pages: 320,
    stock_status: 'In Stock',
    images: ['/img/book/07.png'],
    authors: [authors[1]],
    category_id: '4b2',
    tags: ['healing', 'holistic', 'wellness', 'natural medicine'],
    is_latest_release: true,
    bestseller_rank: 5,
    rating: 4.5
  },
  {
    id: '8',
    title: 'Ayurvedic Lifestyle Guide',
    subtitle: 'Living in Harmony with Nature',
    slug: 'ayurvedic-lifestyle-guide',
    description: 'Complete guide to Ayurvedic principles for healthy living, including diet, exercise, and daily routines.',
    language: 'English',
    format: 'Paperback',
    price: 450,
    currency: 'INR',
    isbn13: '978-81-234-5685-7',
    publication_date: '2024-01-10',
    pages: 250,
    stock_status: 'In Stock',
    images: ['/img/book/08.png'],
    authors: [authors[1]],
    category_id: '4b2',
    tags: ['ayurveda', 'lifestyle', 'health', 'natural living'],
    is_latest_release: true,
    rating: 4.4
  },

  // Coffee Table Books - Spirituality
  {
    id: '9',
    title: 'Meditation: The Inner Journey',
    subtitle: 'A Practical Guide to Self-Discovery',
    slug: 'meditation-inner-journey',
    description: 'Comprehensive guide to various meditation techniques and their benefits for mental and spiritual growth.',
    language: 'English',
    format: 'Hardcover',
    price: 650,
    currency: 'INR',
    isbn13: '978-81-234-5686-4',
    publication_date: '2023-10-15',
    pages: 300,
    stock_status: 'In Stock',
    images: ['/img/book/08.png'],
    authors: [authors[0]],
    category_id: '4d',
    tags: ['meditation', 'spirituality', 'mindfulness', 'self-help'],
    is_latest_release: false,
    bestseller_rank: 9,
    rating: 4.3
  },

  // Coffee Table Books - Management
  {
    id: '10',
    title: 'Leadership Excellence',
    subtitle: 'Strategies for Effective Management',
    slug: 'leadership-excellence',
    description: 'Modern leadership strategies and management techniques for today business environment.',
    language: 'English',
    format: 'Paperback',
    price: 550,
    currency: 'INR',
    isbn13: '978-81-234-5687-1',
    publication_date: '2023-08-20',
    pages: 280,
    stock_status: 'In Stock',
    images: ['/img/book/09.png'],
    authors: [authors[2]],
    category_id: '4e',
    tags: ['leadership', 'management', 'business', 'strategy'],
    is_latest_release: false,
    bestseller_rank: 12,
    rating: 4.2
  },

  // Coffee Table Books - Fiction
  {
    id: '11',
    title: 'Tales of Ancient India',
    subtitle: 'Mythological Stories Retold',
    slug: 'tales-ancient-india',
    description: 'Collection of classic Indian mythological tales retold for modern readers.',
    language: 'English',
    format: 'Hardcover',
    price: 699,
    currency: 'INR',
    isbn13: '978-81-234-5688-8',
    publication_date: '2023-07-10',
    pages: 350,
    stock_status: 'In Stock',
    images: ['/img/book/10.png'],
    authors: [authors[0]],
    category_id: '4h',
    tags: ['fiction', 'mythology', 'indian culture', 'stories'],
    is_latest_release: false,
    rating: 4.1
  },

  // Coffee Table Books - Cookery
  {
    id: '12',
    title: 'Traditional Indian Recipes',
    subtitle: 'Authentic Flavors from Every Region',
    slug: 'traditional-indian-recipes',
    description: 'Comprehensive collection of traditional Indian recipes from different regions with step-by-step instructions.',
    language: 'English',
    format: 'Hardcover',
    price: 850,
    currency: 'INR',
    isbn13: '978-81-234-5689-5',
    publication_date: '2023-09-25',
    pages: 400,
    stock_status: 'In Stock',
    images: ['/img/book/11.png'],
    authors: [authors[1]],
    category_id: '4g',
    tags: ['cooking', 'recipes', 'indian cuisine', 'food'],
    is_latest_release: false,
    rating: 4.6
  },

  // Text Books - Political Science
  {
    id: '13',
    title: 'Indian Political Systems',
    subtitle: 'Constitution, Governance and Democracy',
    slug: 'indian-political-systems',
    description: 'Comprehensive analysis of the Indian political framework, constitution, and governance structures.',
    language: 'English',
    format: 'Paperback',
    price: 750,
    currency: 'INR',
    isbn13: '978-81-234-5690-1',
    publication_date: '2023-08-10',
    pages: 450,
    stock_status: 'In Stock',
    images: ['/img/top-book/01.png'],
    authors: [authors[2]],
    category_id: '5a',
    tags: ['political science', 'textbook', 'india', 'constitution'],
    is_latest_release: false,
    bestseller_rank: 8,
    rating: 4.4
  },
  {
    id: '14',
    title: 'Comparative Politics',
    subtitle: 'Global Perspectives on Governance',
    slug: 'comparative-politics',
    description: 'Study of different political systems around the world and their comparative analysis.',
    language: 'English',
    format: 'Hardcover',
    price: 950,
    currency: 'INR',
    isbn13: '978-81-234-5691-8',
    publication_date: '2024-01-05',
    pages: 520,
    stock_status: 'In Stock',
    images: ['/img/top-book/02.png'],
    authors: [authors[2]],
    category_id: '5a',
    tags: ['political science', 'comparative politics', 'governance', 'textbook'],
    is_latest_release: true,
    rating: 4.3
  },

  // Text Books - History
  {
    id: '15',
    title: 'Medieval Indian History',
    subtitle: 'From Delhi Sultanate to Mughal Empire',
    slug: 'medieval-indian-history',
    description: 'Detailed study of medieval Indian history covering major dynasties, cultural developments, and socio-economic changes.',
    language: 'English',
    format: 'Paperback',
    price: 680,
    currency: 'INR',
    isbn13: '978-81-234-5692-5',
    publication_date: '2023-06-15',
    pages: 380,
    stock_status: 'In Stock',
    images: ['/img/top-book/03.png'],
    authors: [authors[2]],
    category_id: '5c',
    tags: ['history', 'medieval india', 'textbook', 'education'],
    is_latest_release: false,
    rating: 4.2
  },

  // Text Books - Psychology
  {
    id: '16',
    title: 'Introduction to Psychology',
    subtitle: 'Understanding Human Behavior',
    slug: 'introduction-psychology',
    description: 'Comprehensive introduction to psychological principles, theories, and their practical applications.',
    language: 'English',
    format: 'Paperback',
    price: 620,
    currency: 'INR',
    isbn13: '978-81-234-5693-2',
    publication_date: '2023-07-20',
    pages: 340,
    stock_status: 'In Stock',
    images: ['/img/top-book/04.png'],
    authors: [authors[1]],
    category_id: '5j',
    tags: ['psychology', 'textbook', 'behavior', 'mental health'],
    is_latest_release: false,
    rating: 4.1
  }
];

// Helper functions
export const getCategoryById = (id: string) => categories.find(cat => cat.id === id);
export const getCategoriesByParent = (parentId: string | null) => 
  categories.filter(cat => cat.parent_id === parentId).sort((a, b) => a.sort_order - b.sort_order);

export const getBooksByCategory = (categoryId: string): Book[] => {
  // Handle both direct category matches and subcategory matches
  return books.filter(book => {
    // Direct match
    if (book.category_id === categoryId) return true;
    
    // Check if the book's category is a subcategory of the requested category
    const bookCategory = getCategoryById(book.category_id);
    if (bookCategory?.parent_id === categoryId) return true;
    
    return false;
  });
};

export const getLatestReleases = () => 
  books.filter(book => book.is_latest_release).sort((a, b) => (a.bestseller_rank || 999) - (b.bestseller_rank || 999));

export const getBestsellers = () => 
  books.filter(book => book.bestseller_rank).sort((a, b) => (a.bestseller_rank || 999) - (b.bestseller_rank || 999));
