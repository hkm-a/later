import type { LinkItem } from '../types'

const databaseName = 'later-db'
const storeName = 'links'

/** Opens the one-browser database and creates its single object store on first use. */
function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(databaseName, 1)

    request.onupgradeneeded = () => {
      const database = request.result

      if (!database.objectStoreNames.contains(storeName)) {
        database.createObjectStore(storeName, { keyPath: 'id' })
      }
    }

    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

/** Converts IndexedDB's event request API into the async style used by the UI. */
function requestResult<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

/** Waits for a write transaction so the UI only updates after the browser saved data. */
function transactionComplete(transaction: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => resolve()
    transaction.onerror = () => reject(transaction.error)
    transaction.onabort = () => reject(transaction.error)
  })
}

export async function getLinks(): Promise<LinkItem[]> {
  const database = await openDatabase()
  const transaction = database.transaction(storeName, 'readonly')
  const links = await requestResult(transaction.objectStore(storeName).getAll())

  database.close()
  return links
}

export async function saveLink(link: LinkItem): Promise<void> {
  const database = await openDatabase()
  const transaction = database.transaction(storeName, 'readwrite')
  transaction.objectStore(storeName).put(link)

  await transactionComplete(transaction)
  database.close()
}

/** Replaces the local dataset for the explicit demo reset action. */
export async function replaceLinks(links: LinkItem[]): Promise<void> {
  const database = await openDatabase()
  const transaction = database.transaction(storeName, 'readwrite')
  const store = transaction.objectStore(storeName)

  store.clear()
  links.forEach((link) => store.put(link))

  await transactionComplete(transaction)
  database.close()
}
