import {
  handleCreateAddress,
  handleGetAddresses,
} from "../services/addressService";
import { handleCreateBlog, handleGetBlogs } from "../services/blogService";

export async function createAddressController(form, conn) {
  try {
    const address = await handleCreateAddress(form, conn);
    return {
      status: 201,
      body: {
        success: true,
        message: "Address created successfully",
        data: address,
      },
    };
  } catch (err) {
    return {
      status: 400,
      body: {
        success: false,
        message: err.message || "Failed to create address",
      },
    };
  }
}

export async function updateAddressController(form, conn, id) {
  try {
    const addressRepo = new (
      await import("../repository/addressRepository")
    ).AddressRepository(conn);
    const updated = await addressRepo.update(id, form);
    if (!updated) {
      return {
        status: 404,
        body: { success: false, message: "Address not found" },
      };
    }
    return {
      status: 200,
      body: {
        success: true,
        message: "Address updated successfully",
        data: updated,
      },
    };
  } catch (err) {
    return {
      status: 500,
      body: {
        success: false,
        message: err.message || "Failed to update address",
      },
    };
  }
}

export async function deleteAddressController(conn, id) {
  try {
    const addressRepo = new (
      await import("../repository/addressRepository")
    ).AddressRepository(conn);
    const deleted = await addressRepo.destroy(id);
    if (!deleted) {
      return {
        status: 404,
        body: { success: false, message: "Address not found" },
      };
    }
    return {
      status: 200,
      body: {
        success: true,
        message: "Address deleted successfully",
        data: deleted,
      },
    };
  } catch (err) {
    return {
      status: 500,
      body: {
        success: false,
        message: err.message || "Failed to delete address",
      },
    };
  }
}
export async function getAddressesController(query, conn) {
  try {
    const addresses = await handleGetAddresses(query, conn);
    return {
      status: 200,
      body: {
        success: true,
        data: addresses.result,
        currentPage: addresses.currentPage,
        totalPages: addresses.totalPages,
        totalDocuments: addresses.totalDocuments,
      },
    };
  } catch (err) {
    return {
      status: 500,
      body: { success: false, message: err.message || "Failed to fetch blogs" },
    };
  }
}
