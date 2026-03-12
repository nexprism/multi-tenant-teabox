import BrandService from "../services/brandService.js";
import { successResponse, errorResponse } from "../../../utils/response.js";

const brandService = new BrandService();

// Create Brand
export const createBrand = async (req, res) => {
  try {
    const brand = await brandService.createBrand(req.body);
    return res.status(201).json(successResponse("Brand created successfully", brand));
  } catch (err) {
    return res.status(500).json(errorResponse(err.message));
  }
};

// Get All Brands (with optional search)
export const getAllBrands = async (req, res) => {
  try {
    const search = req.query.search || "";
    const brands = await brandService.getAllBrands(search);
    return res.json(successResponse("Brands fetched", brands));
  } catch (err) {
    return res.status(500).json(errorResponse(err.message));
  }
};

// Get Brand by ID
export const getBrandById = async (req, res) => {
  try {
    const brand = await brandService.getBrandById(req.params.id);
    if (!brand) return res.status(404).json(errorResponse("Brand not found"));
    return res.json(successResponse("Brand found", brand));
  } catch (err) {
    return res.status(500).json(errorResponse(err.message));
  }
};

// ✅ Update Brand (allows updating all fields)
export const updateBrand = async (req, res) => {
  try {
    const brand = await brandService.updateBrand(req.params.id, req.body);
    if (!brand) return res.status(404).json(errorResponse("Brand not found"));
    return res.json(successResponse("Brand updated", brand));
  } catch (err) {
    return res.status(500).json(errorResponse(err.message));
  }
};

// Delete Brand
export const deleteBrand = async (req, res) => {
  try {
    const result = await brandService.deleteBrand(req.params.id);
    if (!result) return res.status(404).json(errorResponse("Brand not found"));
    return res.json(successResponse("Brand deleted", null));
  } catch (err) {
    return res.status(500).json(errorResponse(err.message));
  }
};