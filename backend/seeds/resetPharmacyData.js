const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

const resetData = async () => {
  await connectDB();
  try {
    console.log('Resetting Pharmacy inventory and billing records...');
    
    // Delete documents from PharmacyInventory
    const inventoryResult = await mongoose.connection.collection('pharmacyinventories').deleteMany({});
    console.log(`Deleted ${inventoryResult.deletedCount} pharmacy inventory items.`);

    // Delete documents from PharmacyBill
    const billResult = await mongoose.connection.collection('pharmacybills').deleteMany({});
    console.log(`Deleted ${billResult.deletedCount} pharmacy bills.`);

    // Delete documents from PharmacyStockMovement, PharmacyUploadHistory, PharmacyAdjustment, PharmacyDispense
    const stockMoveResult = await mongoose.connection.collection('pharmacystockmovements').deleteMany({});
    console.log(`Deleted ${stockMoveResult.deletedCount} stock movements.`);

    const uploadHistResult = await mongoose.connection.collection('pharmacyuploadhistories').deleteMany({});
    console.log(`Deleted ${uploadHistResult.deletedCount} upload history entries.`);

    const adjustmentResult = await mongoose.connection.collection('pharmacyadjustments').deleteMany({});
    console.log(`Deleted ${adjustmentResult.deletedCount} adjustments.`);

    const dispenseResult = await mongoose.connection.collection('pharmacydispenses').deleteMany({});
    console.log(`Deleted ${dispenseResult.deletedCount} dispense records.`);

    console.log('Reset completed successfully.');
    process.exit(0);
  } catch (error) {
    console.error(`Error during reset: ${error.message}`);
    process.exit(1);
  }
};

resetData();
