import { BlogRepository } from "../repository/blogRepository";
import { saveFile } from "../../config/fileUpload";
import { AddressRepository } from "../repository/addressRepository";

export async function handleCreateAddress(form, conn) {
  try {
    const repo = new AddressRepository(conn);
    const address = await repo.create(form);
    return address;
  } catch (err) {
    throw err;
  }
}

export async function handleGetAddresses(query, conn) {
  try {
    const repo = new AddressRepository(conn);
    // Support both page/pageNum and limit/limitNum
    const filterConditions = { deletedAt: null };

    // Add user filter if provided
    if (query.user) {
      filterConditions.user = query.user;
    }

    var result = await repo.getAll(filterConditions);
    // console.log("result", result);

    return result;
  } catch (err) {
    throw err;
  }
}
