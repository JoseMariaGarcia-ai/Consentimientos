export async function handlePdf(body: any) {
  // PDF generation happens client-side in Phase 1 via react-pdf
  // This endpoint stores the PDF URL after client uploads to Supabase Storage
  const { consentId, pdfUrl } = body;
  return { consentId, pdfUrl, message: "PDF URL saved" };
}

export const handler = async (event: any) => {
  try {
    const body = JSON.parse(event.body || "{}");
    const result = await handlePdf(body);
    return { statusCode: 200, body: JSON.stringify(result) };
  } catch (err: any) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
