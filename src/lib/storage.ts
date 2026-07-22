import type { LinkItem } from '../types'

const databaseName = 'later-db'
const storeName = 'links'

/** 打开浏览器本地数据库，并在首次使用时创建唯一的数据表。 */
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

/** 将 IndexedDB 的事件式请求 API 转换为界面使用的异步风格。 */
function requestResult<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

/** 等待写入事务完成，确保浏览器保存数据后才更新界面。 */
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

/** 为明确的演示数据重置操作替换本地数据集。 */
export async function replaceLinks(links: LinkItem[]): Promise<void> {
  const database = await openDatabase()
  const transaction = database.transaction(storeName, 'readwrite')
  const store = transaction.objectStore(storeName)

  store.clear()
  links.forEach((link) => store.put(link))

  await transactionComplete(transaction)
  database.close()
}
