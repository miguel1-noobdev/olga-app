function unavailable(): Response {
  return Response.json({ error: 'google_unavailable' }, { status: 503 });
}

export async function POST(_request: Request): Promise<Response> {
  // A local session or token cannot prove ownership of a Google identity.
  // Keep linking disabled until a server-verified OAuth callback binds the subject.
  return unavailable();
}
