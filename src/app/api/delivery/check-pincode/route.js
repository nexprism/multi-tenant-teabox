import { ShippingSchema } from "@/app/lib/models/Shipping";
import { NextResponse } from "next/server";
import { getSubdomain, getDbConnection } from "../../../lib/tenantDb";

export async function POST(req) {
  try {
    const body = await req.json();
    const { orgPincode, desPincode } = body;
    //console.log("Request body: ", orgPincode, " - ", desPincode);

    if (!orgPincode || !desPincode) {
      return NextResponse.json(
        {
          success: false,
          message: "Both orgPincode and desPincode are required",
        },
        { status: 400 }
      );
    }

    // Get subdomain and establish tenant-specific database connection
    const subdomain = getSubdomain(req);
    //console.log("Subdomain:", subdomain);
    const conn = await getDbConnection(subdomain);
    if (!conn) {
      //console.error(
      //   "No database connection established for subdomain:",
      //   subdomain
      // );
      return NextResponse.json(
        {
          success: false,
          message: "Tenant database not found",
        },
        { status: 404 }
      );
    }
    //console.log("Connected to database:", conn.name);

    // Register ShippingModel with tenant-specific connection
    const ShippingModel =
      conn.models.Shipping || conn.model("Shipping", ShippingSchema);

    const shippingMethods = await ShippingModel.find({ status: "active" }).sort(
      { priority: 1 }
    );
    //console.log("Using shipping methods:", shippingMethods.length);
    if (!shippingMethods || shippingMethods.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: "No active shipping methods found",
        },
        { status: 404 }
      );
    }

    // Sort methods by priority
    const methods = shippingMethods
      .filter((m) => m.status === "active")
      .sort((a, b) => a.priority - b.priority);

    //console.log("Shipping methods after filtering and sorting:", methods);

    for (const method of methods) {
      let isServiceable = false;
      let responseMessage = "";
      let extraData = {};
      //console.log("Checking shipping method:", method.name);
      if (method.name === "DTDC") {
        
        //console.log("DTDC method selected <<<<<>>>>>>>");
        // Call DTDC API

        const dtdcApiUrl =
          "http://smarttrack.ctbsplus.dtdc.com/ratecalapi/PincodeApiCall";
        const response = await fetch(dtdcApiUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ orgPincode, desPincode }),
        });

        console.log("DTDC API response status: ===========>", response);

        if (!response.ok) {
          throw new Error(`DTDC API responded with status: ${response.status}`);
        }

        const data = await response.json();

        if (data.ZIPCODE_RESP && data.ZIPCODE_RESP.length > 0) {
          const zipcodeResponse = data.ZIPCODE_RESP[0];
          if (
            zipcodeResponse.MESSAGE === "SUCCESS" &&
            zipcodeResponse.SERVFLAG === "Y"
          ) {
            isServiceable = true;
            responseMessage = "Pincode is serviceable by DTDC";
            extraData = {
              serviceDetails: data.SERV_LIST || [],
              serviceListDetails: data.SERV_LIST_DTLS || [],
              branches: data.SERV_BR || [],
              franchises: data.SERV_FR || [],
              locationInfo: data.PIN_CITY || [],
            };
          } else {
            responseMessage = "Pincode is not serviceable by DTDC";
          }
        }
      }

      if (method.name === "Delivery" && !isServiceable) {
        try {
          //console.log(`Delhivery Token ${process.env.DELHIVERY_API_KEY}`);

          //console.log("Delhivery method selected <<<<<>>>>>>>");
          const delhiveryApiUrl = `https://track.delhivery.com/c/api/pin-codes/json/?filter_codes=${desPincode}`;

          const response = await fetch(delhiveryApiUrl, {
            method: "GET",
            headers: {
              Authorization: `Token ${process.env.DELHIVERY_API_KEY}`, // 🔑 required
              "Content-Type": "application/json",
            },
          });

          console.log("Delhivery API response status: ===========>", response);

          if (!response.statusText.includes("OK")) {
            throw new Error(
              `Delhivery API responded with status: ${response.status}`
            );
          }

          const data = await response.json();
          if (data.delivery_codes && data.delivery_codes.length > 0) {
            isServiceable = true;
            responseMessage = "Pincode is serviceable by Delhivery";
            extraData = { raw: data };
          } else {
            responseMessage = "Pincode is not serviceable by Delhivery";
          }
        } catch (error) {
          //console.log("Delhivery API error:", error);
        }
      }

      // ✅ If serviceable, return immediately (respecting priority)
      if (isServiceable) {
        return NextResponse.json({
          success: true,
          message: responseMessage,
          method: method.name,
          priority: method.priority,
          data: {
            orgPincode,
            desPincode,
            ...extraData,
          },
        });
      }
    }

    // ❌ If no method available
    return NextResponse.json({
      success: false,
      message: "No shipping method available for this pincode",
      data: { orgPincode, desPincode },
    });
  } catch (error) {
    //console.log("Route POST error:", error.message);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}
