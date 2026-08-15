const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const connectDB = require('./config/db');

const User = require('./models/User');
const Hotel = require('./models/Hotel');
const Room = require('./models/Room');
const Booking = require('./models/Booking');
const Review = require('./models/Review');
const Payment = require('./models/Payment');

dotenv.config({ path: path.join(__dirname, '../.env') });

const sampleHotels = [
  {
    name: 'The Metropolitan Grand',
    description: 'Experience refined luxury in the heart of New Delhi. Featuring panoramic city views, an award-winning spa, fine dining, and bespoke concierge hospitality.',
    location: 'Connaught Place, Central Delhi',
    city: 'Delhi',
    country: 'India',
    rating: 4.8,
    reviewCount: 342,
    startingPrice: 5500,
    amenities: ['Free Wi-Fi', 'Swimming Pool', 'Luxury Spa', 'Fine Dining', 'Fitness Center', 'Valet Parking', 'Airport Shuttle', '24/7 Room Service'],
    images: [
      'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&q=80&w=1000',
      'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&q=80&w=1000',
      'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&q=80&w=1000'
    ]
  },
  {
    name: 'Azure Bay Ocean Resort',
    description: 'A serene beachside sanctuary nestled along the sun-drenched coastline of North Goa. Enjoy private beach access, infinity pools, and tropical cocktail lounges.',
    location: 'Candolim Beach Road, North Goa',
    city: 'Goa',
    country: 'India',
    rating: 4.9,
    reviewCount: 512,
    startingPrice: 4200,
    amenities: ['Private Beach', 'Infinity Pool', 'Cocktail Bar', 'Free Wi-Fi', 'Water Sports', 'Spa & Massage', 'Seafood Grill', 'Ocean View Balcony'],
    images: [
      'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&q=80&w=1000',
      'https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&q=80&w=1000',
      'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&q=80&w=1000'
    ]
  },
  {
    name: 'The Grand Residency',
    description: 'Iconic heritage hospitality overlooking the Arabian Sea. Renowned for elegant architecture, world-class dining options, and exceptional personal service.',
    location: 'Marine Drive, Nariman Point',
    city: 'Mumbai',
    country: 'India',
    rating: 4.7,
    reviewCount: 428,
    startingPrice: 6800,
    amenities: ['Sea View', 'Rooftop Bar', 'High-Speed Wi-Fi', 'Executive Lounge', 'Fitness Studio', 'Fine Dining', 'Business Center', 'Concierge Service'],
    images: [
      'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?auto=format&fit=crop&q=80&w=1000',
      'https://images.unsplash.com/photo-1618773928121-c32242e63f39?auto=format&fit=crop&q=80&w=1000',
      'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&q=80&w=1000'
    ]
  },
  {
    name: 'Urban Nest Tech Suites',
    description: 'Modern boutique hotel designed for business executives and tech travelers in Silicon Valley of India. Features ergonomic workspaces and smart amenities.',
    location: 'Indiranagar 100ft Road',
    city: 'Bengaluru',
    country: 'India',
    rating: 4.6,
    reviewCount: 289,
    startingPrice: 3800,
    amenities: ['High-Speed Wi-Fi', 'Coworking Hub', 'Smart TV', 'Fitness Center', 'Artisan Coffee Shop', '24/7 Check-in', 'EV Charging'],
    images: [
      'https://images.unsplash.com/photo-1591088398332-8a7791972843?auto=format&fit=crop&q=80&w=1000',
      'https://images.unsplash.com/photo-1596394516093-501ba68a0ba6?auto=format&fit=crop&q=80&w=1000',
      'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&q=80&w=1000'
    ]
  },
  {
    name: 'Royal Heritage Palace Hotel',
    description: 'Immerse yourself in royal Rajasthani grandeur. Traditional archways, lush courtyard gardens, cultural evening performances, and royal dining rooms.',
    location: 'Civil Lines, Near Pink City',
    city: 'Jaipur',
    country: 'India',
    rating: 4.9,
    reviewCount: 620,
    startingPrice: 5200,
    amenities: ['Heritage Architecture', 'Swimming Pool', 'Ayurvedic Spa', 'Cultural Shows', 'Royal Banquet', 'Free Breakfast', 'Free Wi-Fi', 'Guided Tours'],
    images: [
      'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&q=80&w=1000',
      'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&q=80&w=1000',
      'https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&q=80&w=1000'
    ]
  },
  {
    name: 'Palm Grove Retreat & Villa',
    description: 'Tranquil luxury resort surrounded by tropical gardens and palm trees. Perfect for relaxing weekend getaways, couples, and family vacations.',
    location: 'Baga-Calangute Link Road',
    city: 'Goa',
    country: 'India',
    rating: 4.5,
    reviewCount: 194,
    startingPrice: 3400,
    amenities: ['Outdoor Pool', 'Lush Gardens', 'Free Wi-Fi', 'Poolside Bar', 'Barbecue', 'Bicycle Rental', 'Free Breakfast'],
    images: [
      'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&q=80&w=1000',
      'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&q=80&w=1000',
      'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&q=80&w=1000'
    ]
  },
  {
    name: 'Crown Horizon Sky Hotel',
    description: 'Sleek glass-front luxury tower in Bandra Kurla Complex with rooftop infinity pool, panoramic skyline view, and signature steakhouse.',
    location: 'BKC Financial Center, Bandra East',
    city: 'Mumbai',
    country: 'India',
    rating: 4.8,
    reviewCount: 310,
    startingPrice: 7200,
    amenities: ['Sky Pool', 'Panorama Views', 'Helipad Access', 'High-Speed Wi-Fi', 'Spa', 'Cocktail Lounge', 'Chauffeur Service'],
    images: [
      'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?auto=format&fit=crop&q=80&w=1000',
      'https://images.unsplash.com/photo-1618773928121-c32242e63f39?auto=format&fit=crop&q=80&w=1000',
      'https://images.unsplash.com/photo-1591088398332-8a7791972843?auto=format&fit=crop&q=80&w=1000'
    ]
  },
  {
    name: 'Serenity Sands Luxury Resort',
    description: 'Secluded beach villa resort along Palolem South Goa. Enjoy pristine white sand beaches, yoga pavilions, and farm-to-table organic dining.',
    location: 'Palolem Beach, Canacona',
    city: 'Goa',
    country: 'India',
    rating: 4.7,
    reviewCount: 240,
    startingPrice: 4800,
    amenities: ['Beachfront', 'Yoga Deck', 'Organic Restaurant', 'Free Wi-Fi', 'Kayak Rentals', 'Sunset Bar', 'Open Air Spa'],
    images: [
      'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&q=80&w=1000',
      'https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&q=80&w=1000',
      'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&q=80&w=1000'
    ]
  },
  {
    name: 'Verdant Breeze Hillside Resort',
    description: 'Peaceful getaway tucked away in the lush greenery of Koramangala. Features botanical gardens, heated indoor pool, and cozy fireplace lounges.',
    location: 'Koramangala 4th Block',
    city: 'Bengaluru',
    country: 'India',
    rating: 4.4,
    reviewCount: 165,
    startingPrice: 2900,
    amenities: ['Garden Terrace', 'Indoor Heated Pool', 'Free Wi-Fi', 'Pet Friendly', 'Fireplace Lounge', 'Complementary Tea'],
    images: [
      'https://images.unsplash.com/photo-1596394516093-501ba68a0ba6?auto=format&fit=crop&q=80&w=1000',
      'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&q=80&w=1000',
      'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&q=80&w=1000'
    ]
  },
  {
    name: 'The Imperial Aerocity Hotel',
    description: 'Premier airport hotel minutes away from IGI Airport Delhi. Designed with soundproof acoustic suites, express check-in, and 24h dining.',
    location: 'Aerocity Hospitality District',
    city: 'Delhi',
    country: 'India',
    rating: 4.6,
    reviewCount: 405,
    startingPrice: 4600,
    amenities: ['Soundproof Rooms', 'Airport Shuttle', '24/7 Buffet', 'Free Wi-Fi', 'Fitness Center', 'Meeting Rooms'],
    images: [
      'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&q=80&w=1000',
      'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&q=80&w=1000',
      'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&q=80&w=1000'
    ]
  },
  {
    name: 'Amber Fort View Suites',
    description: 'Boutique stay offering breathtaking rooftop vistas of the lit Amber Fort. Combines traditional artwork with contemporary comfort.',
    location: 'Amer Road, Jaipur',
    city: 'Jaipur',
    country: 'India',
    rating: 4.7,
    reviewCount: 380,
    startingPrice: 3900,
    amenities: ['Fort View Terrace', 'Rooftop Dining', 'Free Wi-Fi', 'Cultural Tours', 'Air Conditioning', 'Traditional Chai Bar'],
    images: [
      'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&q=80&w=1000',
      'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&q=80&w=1000',
      'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&q=80&w=1000'
    ]
  },
  {
    name: 'Highland Manor & Spa',
    description: 'Exclusive luxury estate boasting lush landscaped lawns, hydrotherapy pools, and multi-cuisine culinary experiences.',
    location: 'UB City Precinct, Lavelle Road',
    city: 'Bengaluru',
    country: 'India',
    rating: 4.8,
    reviewCount: 298,
    startingPrice: 6200,
    amenities: ['Hydrotherapy Spa', 'Wine Cellar', 'Valet Parking', 'Free Wi-Fi', 'Heated Pool', 'Tennis Court', 'High Tea Lounge'],
    images: [
      'https://images.unsplash.com/photo-1618773928121-c32242e63f39?auto=format&fit=crop&q=80&w=1000',
      'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?auto=format&fit=crop&q=80&w=1000',
      'https://images.unsplash.com/photo-1591088398332-8a7791972843?auto=format&fit=crop&q=80&w=1000'
    ]
  }
];

const roomTemplates = [
  {
    name: 'Deluxe City View Room',
    description: 'Spacious king-size bed with floor-to-ceiling windows offering mesmerizing city views, marble bathroom, and workspace.',
    type: 'Deluxe',
    priceMultiplier: 1.0,
    capacity: 2,
    amenities: ['King Bed', 'City View', 'Marble Bathroom', 'Work Desk', 'Smart TV', 'Mini Bar', 'Coffee Maker'],
    images: ['https://images.unsplash.com/photo-1618773928121-c32242e63f39?auto=format&fit=crop&q=80&w=800']
  },
  {
    name: 'Executive Garden Suite',
    description: 'Separate living and sleeping areas, private balcony facing manicured gardens, rain shower, and complimentary executive lounge access.',
    type: 'Executive Suite',
    priceMultiplier: 1.45,
    capacity: 3,
    amenities: ['Living Room', 'Garden Balcony', 'Executive Lounge Access', 'Rain Shower', 'Nespresso Machine', 'Free Wi-Fi'],
    images: ['https://images.unsplash.com/photo-1591088398332-8a7791972843?auto=format&fit=crop&q=80&w=800']
  },
  {
    name: 'Presidential Ocean Suite',
    description: 'Ultimate luxury penthouse suite with private jacuzzi, wrap-around ocean view deck, dining table for 6, and personal butler service.',
    type: 'Presidential Suite',
    priceMultiplier: 2.2,
    capacity: 4,
    amenities: ['Private Jacuzzi', 'Wrap-around Deck', 'Butler Service', 'Dining Area', 'Walk-in Closet', 'Premium Audio'],
    images: ['https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&q=80&w=800']
  },
  {
    name: 'Comfort Standard Room',
    description: 'Cozy queen-size room equipped with ergonomic desk, high-speed fiber internet, and premium cotton bedding for a peaceful stay.',
    type: 'Standard',
    priceMultiplier: 0.8,
    capacity: 2,
    amenities: ['Queen Bed', 'Fiber Wi-Fi', 'Air Conditioning', 'Safe Box', 'En-suite Bathroom'],
    images: ['https://images.unsplash.com/photo-1596394516093-501ba68a0ba6?auto=format&fit=crop&q=80&w=800']
  }
];

const seedDatabase = async (exitOnComplete = true) => {
  try {
    if (mongoose.connection.readyState === 0) {
      await connectDB();
    }

    console.log('[Seed] Clearing existing collections...');
    await User.deleteMany({});
    await Hotel.deleteMany({});
    await Room.deleteMany({});
    await Booking.deleteMany({});
    await Review.deleteMany({});
    await Payment.deleteMany({});

    console.log('[Seed] Creating demo user accounts...');
    const demoOwner = await User.create({
      name: 'Sarah Jenkins (Hotel Manager)',
      email: 'sarah.manager@nestly.com',
      password: 'password123', // Hashed in Phase 2
      role: 'manager',
    });

    console.log('[Seed] Creating hotels & rooms...');
    for (const hData of sampleHotels) {
      const hotel = await Hotel.create({
        ...hData,
        owner: demoOwner._id,
      });

      // Create 3 rooms per hotel based on templates
      const selectedTemplates = [roomTemplates[0], roomTemplates[1], roomTemplates[2]];
      for (const tpl of selectedTemplates) {
        await Room.create({
          hotel: hotel._id,
          name: `${hotel.name} - ${tpl.name}`,
          description: tpl.description,
          type: tpl.type,
          pricePerNight: Math.round(hotel.startingPrice * tpl.priceMultiplier),
          capacity: tpl.capacity,
          amenities: tpl.amenities,
          images: tpl.images,
          totalRooms: 8,
        });
      }
    }

    console.log('[Seed] Seed completed successfully!');
    if (exitOnComplete) {
      process.exit(0);
    }
  } catch (error) {
    console.error('[Seed] Error during database seeding:', error);
    if (exitOnComplete) {
      process.exit(1);
    }
  }
};

if (require.main === module) {
  seedDatabase();
}

module.exports = seedDatabase;
