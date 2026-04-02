export async function structureReport(rawNotes: string, context: {
  courtName: string;
  caseCaption: string;
  appearanceType: string;
  outcome: string;
}) {
  const response = await fetch('/api/reports/structure', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ rawNotes, context }),
  });

  if (!response.ok) {
    throw new Error('Failed to structure report');
  }

  return response.json();
}
