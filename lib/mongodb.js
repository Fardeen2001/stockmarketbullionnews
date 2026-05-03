import { MongoClient } from 'mongodb';

const options = {};

let cachedPromise;

function createClientPromise() {
  const uri = process.env.MONGODB_URI || process.env.MONGODB_URL;
  if (!uri) {
    return Promise.reject(
      new Error('Please add MONGODB_URI (or MONGODB_URL) to your environment')
    );
  }

  if (process.env.NODE_ENV === 'development') {
    if (!global._mongoClientPromise) {
      const client = new MongoClient(uri, options);
      global._mongoClientPromise = client.connect();
    }
    return global._mongoClientPromise;
  }

  const client = new MongoClient(uri, options);
  return client.connect();
}

function getClientPromise() {
  if (!cachedPromise) {
    cachedPromise = createClientPromise();
  }
  return cachedPromise;
}

/** Lazy thenable so importing this module does not throw during `next build` without MONGODB_URI. */
const clientPromise = {
  then(onFulfilled, onRejected) {
    return getClientPromise().then(onFulfilled, onRejected);
  },
  catch(onRejected) {
    return getClientPromise().catch(onRejected);
  },
  finally(onFinally) {
    return getClientPromise().finally(onFinally);
  },
};

export default clientPromise;
