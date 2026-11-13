import { NextResponse } from "next/server";

const PRIVATE_NO_STORE_HEADERS = { "Cache-Control": "private, no-store" };

export function privateJson(body: unknown, status = 200) {
  return NextResponse.json(body, {
    status,
    headers: PRIVATE_NO_STORE_HEADERS,
  });
}

export function privateNoContent() {
  return new NextResponse(null, {
    status: 204,
    headers: PRIVATE_NO_STORE_HEADERS,
  });
}
