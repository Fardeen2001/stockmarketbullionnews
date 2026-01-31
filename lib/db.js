import clientPromise from './mongodb';

export async function getDatabase() {
  const client = await clientPromise;
  return client.db(process.env.MONGODB_DB_NAME || 'stockmarketbullion');
}

export async function getStocksCollection() {
  const db = await getDatabase();
  return db.collection('stocks');
}

export async function getMetalsCollection() {
  const db = await getDatabase();
  return db.collection('metals');
}

export async function getNewsCollection() {
  const db = await getDatabase();
  return db.collection('news');
}

export async function getScrapedContentCollection() {
  const db = await getDatabase();
  return db.collection('scrapedContent');
}

export async function getTrendingTopicsCollection() {
  const db = await getDatabase();
  return db.collection('trendingTopics');
}
