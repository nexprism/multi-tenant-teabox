import { NextResponse } from "next/server";
import { getSubdomain, getDbConnection } from "../../../lib/tenantDb.js";
import shippingZoneController from "../../../lib/controllers/ShippingZoneController.js";
import { withUserAuth } from "../../../middleware/commonAuth.js";
import { read, utils } from "xlsx"; // Changed to named imports
import mongoose from "mongoose";

// POST: Import shipping zones from Excel file (requires authentication)
export const POST = withUserAuth(async function (request) {
  try {
    const subdomain = getSubdomain(request);
    //consolle.log("Subdomain:", subdomain);
    const conn = await getDbConnection(subdomain);
    if (!conn) {
      //consolle.error("No database connection established");
      return NextResponse.json(
        { success: false, message: "DB not found" },
        { status: 404 }
      );
    }
    //consolle.log("Connection name in route:", conn.name);

    const formData = await request.formData();
    const shippingId = formData.get("shippingId");
    const file = formData.get("file");

    if (!shippingId || !file) {
      return NextResponse.json(
        { success: false, message: "Shipping ID and Excel file are required" },
        { status: 400 }
      );
    }

    if (!mongoose.Types.ObjectId.isValid(shippingId)) {
      return NextResponse.json(
        { success: false, message: "Invalid Shipping ID" },
        { status: 400 }
      );
    }

    // Read the file as ArrayBuffer
    const buffer = await file.arrayBuffer();
    const workbook = read(buffer, { type: "array" }); // Updated to use 'read'

    // Assume the first sheet contains the data
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];

    // Convert sheet to JSON array
    const data = utils.sheet_to_json(sheet); // Updated to use 'utils'

    if (data.length === 0) {
      return NextResponse.json(
        { success: false, message: "Excel file is empty" },
        { status: 400 }
      );
    }

    // Map data to postalCodes array (columns: 'Dtdc Pincodes' and 'Price')
    const postalCodes = data.map((row) => ({
      code: row["Pincode"]?.toString().trim(),
      price: 0,
    }));

    // Basic validation for each row
    for (let i = 0; i < postalCodes.length; i++) {
      const item = postalCodes[i];
      if (
        !item.code ||
        item.code === "" ||
        isNaN(item.price) ||
        item.price < 0
      ) {
        return NextResponse.json(
          {
            success: false,
            message: `Invalid data in row ${
              i + 1
            }: Postal code must be a non-empty string, and price must be a non-negative number`,
          },
          { status: 400 }
        );
      }
    }

    // Use the existing controller to upsert (update if exists, create if not)
    const body = { postalCodes };
    return await shippingZoneController.updateShippingZone(
      request,
      null,
      body,
      shippingId,
      conn
    );
  } catch (err) {
    //consolle.error("ShippingZone Import error:", err.message, err.stack);
    return NextResponse.json(
      { success: false, message: err.message },
      { status: 400 }
    );
  }
});
