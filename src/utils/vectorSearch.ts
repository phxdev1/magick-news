import { pipeline } from '@xenova/transformers';
import hnsw from 'hnswlib-node';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Constants
const VECTOR_DB_PATH = path.join(process.cwd(), 'public', 'vector-db');
const EMBEDDINGS_FILE = path.join(VECTOR_DB_PATH, 'embeddings.hnsw');
const METADATA_FILE = path.join(VECTOR_DB_PATH, 'metadata.json');
const EMBEDDING_DIM = 384; // all-MiniLM-L6-v2 dimension
const MAX_ELEMENTS = 10000;

// Types
interface Article {
  title: string;
  description?: string;
  subtitle?: string;
  url: string;
  type: 'blog' | 'news';
  date: Date;
}

interface SearchResult extends Article {
  score: number;
}

// Ensure vector DB directory exists
if (!fs.existsSync(VECTOR_DB_PATH)) {
  fs.mkdirSync(VECTOR_DB_PATH, { recursive: true });
}

// Initialize the embedding model
let embedder: any = null;
async function getEmbedder() {
  if (!embedder) {
    embedder = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2', {
      quantized: false
    });
  }
  return embedder;
}

// Get text embedding
async function getEmbedding(text: string): Promise<Float32Array> {
  const embedder = await getEmbedder();
  const output = await embedder(text, { pooling: 'mean', normalize: true });
  return output.data;
}

// Create or load vector index
function createVectorIndex() {
  const index = new hnsw.HierarchicalNSW('cosine', EMBEDDING_DIM);
  index.initIndex(MAX_ELEMENTS);
  return index;
}

// Save vector index and metadata
function saveVectorDB(index: any, metadata: Article[]) {
  index.writeIndex(EMBEDDINGS_FILE);
  fs.writeFileSync(METADATA_FILE, JSON.stringify(metadata, null, 2));
}

// Load vector index and metadata
function loadVectorDB(): { index: any, metadata: Article[] } {
  if (!fs.existsSync(EMBEDDINGS_FILE) || !fs.existsSync(METADATA_FILE)) {
    const index = createVectorIndex();
    return { index, metadata: [] };
  }

  const index = new hnsw.HierarchicalNSW('cosine', EMBEDDING_DIM);
  index.readIndex(EMBEDDINGS_FILE);
  const metadata = JSON.parse(fs.readFileSync(METADATA_FILE, 'utf-8'));
  return { index, metadata };
}

// Build vector database from articles
export async function buildVectorDB(articles: Article[]) {
  console.log('Building vector database...');
  const index = createVectorIndex();
  
  for (let i = 0; i < articles.length; i++) {
    const article = articles[i];
    const text = `${article.title} ${article.subtitle || ''} ${article.description || ''}`;
    const embedding = await getEmbedding(text);
    index.addPoint(Array.from(embedding), i);
    console.log(`Processed ${i + 1}/${articles.length} articles`);
  }

  saveVectorDB(index, articles);
  console.log('Vector database built successfully');
}

// Search vector database
export async function searchVectorDB(query: string, k: number = 5): Promise<SearchResult[]> {
  const { index, metadata } = loadVectorDB();
  const queryEmbedding = await getEmbedding(query);
  
  const results = index.searchKnn(Array.from(queryEmbedding), k);
  return results.neighbors.map((idx: number, i: number) => ({
    ...metadata[idx],
    score: 1 - results.distances[i] // Convert cosine distance to similarity score
  }));
}

// Get typeahead suggestions
export async function getTypeaheadSuggestions(prefix: string, limit: number = 5): Promise<string[]> {
  const { metadata } = loadVectorDB();
  const prefixLower = prefix.toLowerCase();
  
  // Get all words from titles that start with the prefix
  const suggestions = new Set<string>();
  for (const article of metadata) {
    const words = article.title.toLowerCase().split(/\s+/);
    for (const word of words) {
      if (word.startsWith(prefixLower)) {
        suggestions.add(word);
      }
    }
  }

  return Array.from(suggestions)
    .sort()
    .slice(0, limit);
}