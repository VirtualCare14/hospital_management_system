const mongoose = require('mongoose');

const ensureTenantIndexes = async (db) => {
  const dropIndexIfExists = async (collectionName, indexName) => {
    try {
      const collection = db.collection(collectionName);
      const indexes = await collection.indexes();
      if (indexes.some((index) => index.name === indexName)) {
        await collection.dropIndex(indexName);
        console.log(`Dropped legacy index ${collectionName}.${indexName}`);
      }
    } catch (error) {
      if (error.codeName !== 'NamespaceNotFound') {
        throw error;
      }
    }
  };

  // Drop legacy global unique indexes and any auto-generated compound variations to prevent name mismatch errors
  await dropIndexIfExists('users', 'username_1');
  await dropIndexIfExists('users', 'hospitalId_1_username_1');
  await dropIndexIfExists('departments', 'departmentName_1');
  await dropIndexIfExists('departments', 'hospitalId_1_departmentName_1');

  await dropIndexIfExists('patients', 'uhid_1');
  await dropIndexIfExists('patients', 'hospitalId_1_uhid_1');
  await dropIndexIfExists('patients', 'hospital_patient_uhid_unique');

  await dropIndexIfExists('visits', 'registrationNumber_1');
  await dropIndexIfExists('visits', 'hospitalId_1_registrationNumber_1');
  await dropIndexIfExists('visits', 'hospital_visit_registration_unique');

  await dropIndexIfExists('pharmacyrequests', 'requestNumber_1');
  await dropIndexIfExists('pharmacyrequests', 'hospitalId_1_requestNumber_1');
  await dropIndexIfExists('pharmacyrequests', 'hospital_pharmacy_request_unique');

  await dropIndexIfExists('pharmacybills', 'billNumber_1');
  await dropIndexIfExists('pharmacybills', 'hospitalId_1_billNumber_1');
  await dropIndexIfExists('pharmacybills', 'hospital_pharmacy_bill_unique');

  await dropIndexIfExists('billings', 'billNo_1');
  await dropIndexIfExists('billings', 'hospitalId_1_billNo_1');
  await dropIndexIfExists('billings', 'hospital_billing_billNo_unique');

  // Create compound tenant-isolated indexes
  await db.collection('users').createIndex(
    { hospitalId: 1, username: 1 },
    { unique: true, name: 'hospital_user_username_unique' }
  );
  await db.collection('departments').createIndex(
    { hospitalId: 1, departmentName: 1 },
    { unique: true, name: 'hospital_department_name_unique' }
  );
  await db.collection('patients').createIndex(
    { hospitalId: 1, uhid: 1 },
    { unique: true, name: 'hospital_patient_uhid_unique' }
  );
  await db.collection('visits').createIndex(
    { hospitalId: 1, registrationNumber: 1 },
    { unique: true, partialFilterExpression: { registrationNumber: { $type: "string" } }, name: 'hospital_visit_registration_unique' }
  );
  await db.collection('pharmacyrequests').createIndex(
    { hospitalId: 1, requestNumber: 1 },
    { unique: true, name: 'hospital_pharmacy_request_unique' }
  );
  await db.collection('pharmacybills').createIndex(
    { hospitalId: 1, billNumber: 1 },
    { unique: true, name: 'hospital_pharmacy_bill_unique' }
  );
  await db.collection('billings').createIndex(
    { hospitalId: 1, billNo: 1 },
    { unique: true, sparse: true, name: 'hospital_billing_billNo_unique' }
  );
};

const disableLegacyDefaultAdmin = async (db) => {
  const result = await db.collection('users').updateMany(
    {
      username: 'admin',
      $or: [
        { hospitalId: { $exists: false } },
        { hospitalId: null }
      ]
    },
    {
      $set: { isActive: false, currentSessionId: null }
    }
  );

  if (result.modifiedCount > 0) {
    console.log('Disabled legacy default admin/admin account');
  }
};

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/hospital_management');
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    await ensureTenantIndexes(conn.connection.db);
    await disableLegacyDefaultAdmin(conn.connection.db);
  } catch (error) {
    console.error(`MongoDB connection error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
