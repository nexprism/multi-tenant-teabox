import { NextResponse } from "next/server";

// Use process.env for server-side environment variables
const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY || "AIzaSyApJRbaVZNuthc2Mi72xifDbdk8b-3WI9Q";

export async function GET(req) {
    try {
        const { searchParams } = new URL(req.url);
        const type = searchParams.get("type"); // "autocomplete" or "details"
        const input = searchParams.get("input");
        const placeid = searchParams.get("placeid");

        let url = "";
        if (type === "autocomplete" && input) {
            url = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(
                input
            )}&key=${GOOGLE_MAPS_API_KEY}&components=country:in`;
        } else if (type === "details" && placeid) {
            url = `https://maps.googleapis.com/maps/api/place/details/json?placeid=${placeid}&key=${GOOGLE_MAPS_API_KEY}`;
        } else {
            return NextResponse.json({ error: "Invalid request" }, { status: 400 });
        }

        const res = await fetch(url);
        const data = await res.json();
        return NextResponse.json(data);
    } catch (error) {
        //console.log("er", error.message);
        return NextResponse.json({ error: error.message || "Unknown error" }, { status: 500 });
    }
}
