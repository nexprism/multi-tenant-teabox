import mongoose from "mongoose";

const connections = {};

export const createTenantDatabase = async (dbName) => {
    if (connections[dbName]) return connections[dbName];

    const uri = `mongodb+srv://anshul:anshul149@clusterdatabase.24furrx.mongodb.net/${dbName}?retryWrites=true&w=majority`;
    const conn = await mongoose.createConnection(uri, {
        dbName,
    }).asPromise();

    // Define a simple schema for the test_table collection
    const testSchema = new mongoose.Schema({
        name: String,
        value: Number,
    });

    // Create the model (this will create the collection if it doesn't exist)
    const TestModel = conn.model("test_table", testSchema);

    await TestModel.create({ name: "example", value: 42 });

    connections[dbName] = conn;
    return conn;
};
