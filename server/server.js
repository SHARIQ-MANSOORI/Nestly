const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

const app = require('./app');
const connectDB = require('./config/db');

const PORT = process.env.PORT || 5000;

// Start Server after connecting to Database
const startServer = async () => {
  try {
    await connectDB();
    
    // Auto seed data if in memory or empty DB
    const Hotel = require('./models/Hotel');
    const hotelCount = await Hotel.countDocuments();
    if (hotelCount === 0) {
      console.log('[Seed] Database empty. Running auto-seed script...');
      const seedDatabase = require('./seed');
      await seedDatabase(false); // don't disconnect process
    }

    app.listen(PORT, () => {
      console.log(`[Nestly Server] Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
    });
  } catch (error) {
    console.error(`[Nestly Server] Failed to start server: ${error.message}`);
    process.exit(1);
  }
};

startServer();
