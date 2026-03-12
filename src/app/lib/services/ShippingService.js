import shippingRepository from "../repository/ShippingRepository.js";
import mongoose from "mongoose";
import axios from "axios";
import { shippingServiceSchema } from "../models/ShippingService.js";


class ShippingService {
  async createShipping(data, conn) {
    // console.log(
    //   "[ShippingService.createShipping] Creating shipping:",
    //   JSON.stringify(data, null, 2),
    //   "Connection:",
    //   conn.name || "global mongoose"
    // );
    this.validateShippingData(data);
    return await shippingRepository.createShipping(data, conn);
  }

  //getServicesByShippingId
  async getServicesByShippingId(id, conn) {
   const shipping = await shippingRepository.getShippingById(id, conn);
   if (!shipping) {
     throw new Error("Shipping method not found");
   }

    // static pincodes as requested
    const origin = "110001";
    const destination = "400001";

    // Determine provider by shipping.name (case-insensitive)
    const name = (shipping.name || "").toLowerCase();
  

    if (name.includes("dtdc")) {
      return await this.getDtdcServices(origin, destination, shipping._id, conn);
    }

    

    // fallback: return services stored in DB
    return await shippingRepository.getServicesByShippingId(id, conn);
  }

  // Fetch DTDC services (origin/destination are pincodes)
  async getDtdcServices(originPincode = "110001", destinationPincode = "400001", shippingId = null, conn) {
    try {
      const resp = await axios.post(
        "http://smarttrack.ctbsplus.dtdc.com/ratecalapi/PincodeApiCall",
        { orgPincode: originPincode, desPincode: destinationPincode }
      );
      const services = resp?.data?.SERV_LIST_DTLS || [];

      const ShippingServiceModel = conn.models.ShippingService || conn.model("ShippingService", shippingServiceSchema);
      console.log("[ShippingService.getDtdcServices] Upserting DTDC services");
      // Upsert each DTDC service into ShippingServiceModel (unique by serviceCode + shippingId)
      for (const s of services) {
        try {
          const code = s.NAME || s.CODE || s.serviceCode || String(s);
          const name = s.NAME || s.serviceName || s.CODE || code;
          const filter = shippingId ? { serviceCode: code, shippingId } : { serviceCode: code };
          const update = {
            $set: {
              serviceCode: code,
              serviceName: name,
              servicePriority: 0,
              status: "active",
            },
          };
          if (shippingId) update.$set.shippingId = shippingId;
          await ShippingServiceModel.updateOne(filter, update, { upsert: true });
        } catch (upsertErr) {
          // ignore individual upsert errors
        }
      }

      return services.map((s) => ({
        code: s.NAME || s.CODE || s.serviceCode,
        name: s.NAME || s.serviceName || s.CODE || s.serviceCode,
        courier: "DTDC",
        priority: 0,
      }));
    } catch (err) {
      // if provider fails, return empty array
      return [];
    }
  }



  async getShippingById(id, conn) {
    // console.log(
    //   "[ShippingService.getShippingById] Fetching shipping:",
    //   id,
    //   "Connection:",
    //   conn.name || "global mongoose"
    // );
    const shipping = await shippingRepository.getShippingById(id, conn);

    // If shipping name indicates DTDC, populate services from ShippingServiceModel
    try {
      const name = (shipping.name || "").toLowerCase();
      if (name.includes("dtdc")) {
        const ShippingServiceModel = conn.models.ShippingService || conn.model("ShippingService", shippingServiceSchema);
        const services = await ShippingServiceModel.find({ shippingId: shipping._id, status: "active" }).lean();
        // attach services array to returned shipping object
        // if shipping is a mongoose document convert to plain object
        const shippingObj = typeof shipping.toObject === 'function' ? shipping.toObject() : shipping;
        shippingObj.services = services;
        return shippingObj;
      }
    } catch (err) {
      // ignore service population errors and return shipping as-is
    }

    return shipping;
  }

  async getAllShipping(filters = {}, conn) {
    // console.log(
    //   "[ShippingService.getAllShipping] Fetching all shipping methods",
    //   "Connection:",
    //   conn.name || "global mongoose",
    //   "Filters:",
    //   filters
    // );
    return await shippingRepository.getAllShipping(filters, conn);
  }

  async updateShipping(id, data, conn) {
    // console.log(
    //   "[ShippingService.updateShipping] Updating shipping:",
    //   id,
    //   "Data:",
    //   JSON.stringify(data, null, 2),
    //   "Connection:",
    //   conn.name || "global mongoose"
    // );
    this.validateShippingData(data, true);
    // First update the shipping document
    const shipping = await shippingRepository.updateShipping(id, data, conn);

    // If frontend passed defaultServices array, update ShippingServiceModel accordingly
    // defaultServices is expected to be an array of serviceCode strings (or serviceName strings)
    try {
      const defaults = data.defaultServices;
      const ShippingServiceModel = conn.models.ShippingService || conn.model("ShippingService", shippingServiceSchema);
      if (Array.isArray(defaults)) {
        // unset existing defaults for this shipping
        await ShippingServiceModel.updateMany({ shippingId: id }, { $set: { isDefaultService: false } });

        if (defaults.length > 0) {
          // set new defaults based on serviceCode OR serviceName matching provided values
          await ShippingServiceModel.updateMany(
            { shippingId: id, $or: [{ serviceCode: { $in: defaults } }, { serviceName: { $in: defaults } }] },
            { $set: { isDefaultService: true } }
          );
        }
      }
      // If services array provided, update priorities and default flags accordingly
      const servicesArray = data.services;
      if (Array.isArray(servicesArray)) {
        // ensure all existing services for this shipping have isDefaultService unset
        await ShippingServiceModel.updateMany({ shippingId: id }, { $set: { isDefaultService: false } });

        const ops = servicesArray.map((s) => {
          const code = s.serviceCode || s.serviceName;
          const setObj = {
            serviceCode: code,
            serviceName: s.serviceName || code,
            servicePriority: typeof s.servicePriority === 'number' ? s.servicePriority : 0,
            isDefaultService: !!s.isDefaultService,
          };
          return {
            updateOne: {
              filter: { shippingId: id, serviceCode: code },
              update: { $set: setObj },
              upsert: true,
            },
          };
        });

        if (ops.length > 0) {
          await ShippingServiceModel.bulkWrite(ops);
        }
      }
    } catch (err) {
      // swallow errors here so shipping update still succeeds
    }

    return shipping;
  }

  async deleteShipping(id, conn) {
    // console.log(
    //   "[ShippingService.deleteShipping] Deleting shipping:",
    //   id,
    //   "Connection:",
    //   conn.name || "global mongoose"
    // );
    return await shippingRepository.deleteShipping(id, conn);
  }

  validateShippingData(data, isUpdate = false) {
    if (!isUpdate) {
      if (!data.name) throw new Error("Name is required");
      if (!data.shippingMethod) throw new Error("Shipping method is required");
      if (
        ![
          "standard",
          "express",
          "overnight",
          "international",
          "pickup",
        ].includes(data.shippingMethod)
      ) {
        throw new Error("Invalid shipping method");
      }
      if (data.cost == null || isNaN(data.cost) || data.cost < 0)
        throw new Error("Cost must be a non-negative number");
      if (
        !data.estimatedDeliveryDays ||
        typeof data.estimatedDeliveryDays !== "object" ||
        data.estimatedDeliveryDays.min == null ||
        data.estimatedDeliveryDays.max == null
      ) {
        throw new Error("Estimated delivery days (min and max) are required");
      }
    } else {
      if (
        data.shippingMethod &&
        ![
          "standard",
          "express",
          "overnight",
          "international",
          "pickup",
        ].includes(data.shippingMethod)
      ) {
        throw new Error("Invalid shipping method");
      }
      if (data.cost != null && (isNaN(data.cost) || data.cost < 0))
        throw new Error("Cost must be a non-negative number");
      if (
        data.estimatedDeliveryDays &&
        (typeof data.estimatedDeliveryDays !== "object" ||
          data.estimatedDeliveryDays.min == null ||
          data.estimatedDeliveryDays.max == null)
      ) {
        throw new Error(
          "Estimated delivery days (min and max) must be provided if updating"
        );
      }
    }

    if (
      data.freeShippingThreshold != null &&
      (isNaN(data.freeShippingThreshold) || data.freeShippingThreshold < 0)
    ) {
      throw new Error("Free shipping threshold must be a non-negative number");
    }
    if (data.supportedRegions) {
      if (!Array.isArray(data.supportedRegions))
        throw new Error("Supported regions must be an array");
      for (const region of data.supportedRegions) {
        if (!region.country)
          throw new Error("Country is required for each supported region");
        if (region.states && !Array.isArray(region.states))
          throw new Error("States must be an array");
        if (region.postalCodes && !Array.isArray(region.postalCodes))
          throw new Error("Postal codes must be an array");
      }
    }
    if (
      data.weightLimit &&
      (typeof data.weightLimit !== "object" ||
        data.weightLimit.min == null ||
        data.weightLimit.max == null)
    ) {
      throw new Error(
        "Weight limit (min and max) must be provided if specified"
      );
    }
    if (
      data.dimensionsLimit &&
      (typeof data.dimensionsLimit !== "object" ||
        data.dimensionsLimit.length == null ||
        data.dimensionsLimit.width == null ||
        data.dimensionsLimit.height == null)
    ) {
      throw new Error(
        "Dimensions limit (length, width, height) must be provided if specified"
      );
    }
    if (
      data.cod &&
      (typeof data.cod !== "object" ||
        data.cod.available == null ||
        (data.cod.available &&
          (data.cod.fee == null || isNaN(data.cod.fee) || data.cod.fee < 0)))
    ) {
      throw new Error(
        "COD fee must be a non-negative number if COD is available"
      );
    }
    if (data.additionalCharges && typeof data.additionalCharges === "object") {
      const charges = [
        "fuelSurcharge",
        "remoteAreaSurcharge",
        "oversizedSurcharge",
        "dangerousGoodsSurcharge",
      ];
      for (const charge of charges) {
        if (
          data.additionalCharges[charge] != null &&
          (isNaN(data.additionalCharges[charge]) ||
            data.additionalCharges[charge] < 0)
        ) {
          throw new Error(`${charge} must be a non-negative number`);
        }
      }
    }
    if (data.customs && typeof data.customs === "object") {
      if (
        data.customs.clearanceRequired != null &&
        typeof data.customs.clearanceRequired !== "boolean"
      ) {
        throw new Error("Customs clearanceRequired must be a boolean");
      }
      if (
        data.customs.documentation &&
        !Array.isArray(data.customs.documentation)
      ) {
        throw new Error("Customs documentation must be an array");
      }
    }
    if (data.proofOfDelivery && typeof data.proofOfDelivery === "object") {
      if (
        data.proofOfDelivery.available != null &&
        typeof data.proofOfDelivery.available !== "boolean"
      ) {
        throw new Error("Proof of delivery available must be a boolean");
      }
    }
    if (data.status && !["active", "inactive"].includes(data.status)) {
      throw new Error("Invalid status");
    }
  }
}

const shippingService = new ShippingService();
export default shippingService;
