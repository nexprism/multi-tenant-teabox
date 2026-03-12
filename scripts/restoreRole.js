const mongoose = require('mongoose');

async function restoreRole() {
    const uri = "mongodb+srv://anshul:anshul149@clusterdatabase.24furrx.mongodb.net/tenant_bharat?retryWrites=true&w=majority";
    const roleId = "6888848d897c0923edbed1fb";

    try {
        await mongoose.connect(uri);
        console.log("Connected to MongoDB");

        const Role = mongoose.model('Role', new mongoose.Schema({
            deletedAt: { type: Date, default: null }
        }));

        const result = await Role.updateOne(
            { _id: new mongoose.Types.ObjectId(roleId) },
            { $set: { deletedAt: null } }
        );

        if (result.modifiedCount > 0) {
            console.log(`Successfully restored role: ${roleId}`);
        } else if (result.matchedCount > 0) {
            console.log(`Role ${roleId} was already active (deletedAt was already null or mismatched).`);
        } else {
            console.log(`Role ${roleId} not found in the database.`);
        }

        await mongoose.disconnect();
    } catch (err) {
        console.error("Error restoring role:", err);
    }
}

restoreRole();
