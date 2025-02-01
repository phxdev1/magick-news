import { searchVectorDB, getTypeaheadSuggestions } from '../../utils/vectorSearch';

export async function GET({ url }: { url: URL }) {
  try {
    const query = url.searchParams.get('q') || '';
    const typeahead = url.searchParams.get('typeahead') === 'true';
    const limit = parseInt(url.searchParams.get('limit') || '5', 10);

    // Return typeahead suggestions if requested
    if (typeahead) {
      const suggestions = await getTypeaheadSuggestions(query, limit);
      return new Response(JSON.stringify(suggestions), {
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'max-age=60'
        }
      });
    }

    // Perform vector similarity search
    const results = await searchVectorDB(query, limit);

    return new Response(JSON.stringify(results), {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'max-age=60'
      }
    });
  } catch (error) {
    console.error('Search error:', error);
    return new Response(JSON.stringify({ error: 'Search failed' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}