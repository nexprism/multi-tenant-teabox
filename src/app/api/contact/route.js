import { NextResponse } from "next/server";
import { getSubdomain, getDbConnection } from "../../lib/tenantDb.js";
import mongoose from "mongoose";
import ContactController from "../../lib/controllers/ContactController.js";
import ContactService from "../../lib/services/ContactService.js";
import ContactRepository from "../../lib/repository/ContactRepository.js";
import { ContactSchema } from "../../lib/models/Contact.js";
import { contactQueryValidator } from "../../validators/contactValidator.js";

export async function GET(req) {
  const searchParams = req.nextUrl.searchParams;
  const query = Object.fromEntries(searchParams.entries());

  // Validate query params
  const { error: queryError, value: validatedQuery } =
    contactQueryValidator.validate(query);
  if (queryError) {
    return NextResponse.json(
      {
        success: false,
        message: "Invalid query parameters",
        data: queryError.details,
      },
      { status: 400 }
    );
  }
  try {
    const subdomain = getSubdomain(req);
    const conn = await getDbConnection(subdomain);
    if (!conn)
      return NextResponse.json(
        { success: false, message: "DB not found" },
        { status: 404 }
      );

    const Contact = conn.models.Contact || conn.model("Contact", ContactSchema);
    const contactRepo = new ContactRepository(Contact);
    const contactService = new ContactService(contactRepo);
    const contactController = new ContactController(contactService);
    const result = await contactController.getAll(validatedQuery, conn);
    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    //consolle.error("Contact route GET error:", error.message);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}

export async function POST(req) {
  try {
    const body = await req.json();
    const subdomain = getSubdomain(req);
    const conn = await getDbConnection(subdomain);
    if (!conn)
      return NextResponse.json(
        { success: false, message: "DB not found" },
        { status: 404 }
      );

    const Contact = conn.models.Contact || conn.model("Contact", ContactSchema);
    const contactRepo = new ContactRepository(Contact);
    const contactService = new ContactService(contactRepo);
    const contactController = new ContactController(contactService);
    const result = await contactController.create({ body }, conn);

    if (!result.success) {
      return NextResponse.json(result, { status: 400 });
    }

    return NextResponse.json(
      { success: true, data: result.data },
      { status: 201 }
    );
  } catch (error) {
    //consolle.error("Contact route POST error:", error.message);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}
