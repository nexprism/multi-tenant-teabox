import { NextResponse } from "next/server";
import { contactIdValidator } from "@/app/validators/contactValidator.js";
import { getDbConnection, getSubdomain } from "@/app/lib/tenantDb.js";
import { ContactSchema } from "@/app/lib/models/Contact.js";
import ContactRepository from "@/app/lib/repository/ContactRepository.js";
import ContactService from "@/app/lib/services/ContactService.js";
import ContactController from "@/app/lib/controllers/ContactController.js";

export async function GET(req, { params }) {
  const { id } = await params;

  // Validate id param
  const { error: idError } = contactIdValidator.validate({ id });
  if (idError) {
    return NextResponse.json(
      {
        success: false,
        message: "Invalid id parameter",
        data: idError.details,
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
    const result = await contactController.getById(id, conn);

    if (!result.success) {
      const status = result.status || 404;
      return NextResponse.json(result, { status });
    }

    return NextResponse.json({ success: true, data: result.data });
  } catch (error) {
    //consolle.error("Contact by id GET error:", error.message);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}

export async function PUT(req, { params }) {
  const { id } = await params;

  // Validate id
  const { error: idError } = contactIdValidator.validate({ id });
  if (idError) {
    return NextResponse.json(
      {
        success: false,
        message: "Invalid id parameter",
        data: idError.details,
      },
      { status: 400 }
    );
  }

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

    const result = await contactController.updateById(id, body, conn);
    if (!result.success) {
      const status = result.status || 400;
      return NextResponse.json(result, { status });
    }

    return NextResponse.json(
      { success: true, data: result.data },
      { status: 200 }
    );
  } catch (error) {
    //consolle.error("Contact by id UPDATE error:", error.message);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}
