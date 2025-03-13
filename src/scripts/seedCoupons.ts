import mongoose from 'mongoose';
import Coupon from '../model/Coupon';

const coupons = [
  { code: 'SAVE10' },
  { code: 'DISCOUNT20' },
  { code: 'FREESHIP' },
  { code: 'EXTRA15' },
  { code: 'WELCOME25' },
];

async function seedDatabase() {
  try {
    // Replace with your MongoDB Atlas connection string or local URI
    const uri = 'mongodb+srv://<username>:<password>@<cluster>.mongodb.net/<dbname>?retryWrites=true&w=majority';
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
    console.log('Connected to MongoDB');

    // Clear existing data
    await Coupon.deleteMany({});
    console.log('Cleared existing coupons');

    // Insert sample coupons
    await Coupon.insertMany(coupons);
    console.log('Inserted sample coupons');

    // Verify insertion
    const count = await Coupon.countDocuments();
    console.log(`Total coupons in database: ${count}`);
  } catch (error) {
    console.error('Error seeding database:', error);
  } finally {
    await mongoose.connection.close();
    console.log('Database connection closed');
  }
}

seedDatabase();