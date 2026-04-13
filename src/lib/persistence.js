/**
 * Persistence utility to handle the Storage Manager API.
 * Ensures data is not automatically deleted by the browser.
 */

export const persistence = {
  /**
   * Checks if the storage is already persistent.
   * @returns {Promise<boolean>}
   */
  isPersistent: async () => {
    if (navigator.storage && navigator.storage.persisted) {
      return await navigator.storage.persisted();
    }
    return false;
  },

  /**
   * Requests the browser to make the storage persistent.
   * @returns {Promise<boolean>} - Whether the request was granted.
   */
  requestPersistence: async () => {
    if (navigator.storage && navigator.storage.persist) {
      return await navigator.storage.persist();
    }
    return false;
  },

  /**
   * Gets storage quota and usage information.
   * @returns {Promise<{usage: number, quota: number, percent: number} | null>}
   */
  getStorageEstimate: async () => {
    if (navigator.storage && navigator.storage.estimate) {
      const estimate = await navigator.storage.estimate();
      return {
        usage: estimate.usage || 0,
        quota: estimate.quota || 0,
        percent: estimate.quota ? ((estimate.usage || 0) / estimate.quota) * 100 : 0
      };
    }
    return null;
  },

  /**
   * Formats bytes into a human readable string.
   */
  formatBytes: (bytes, decimals = 2) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  }
};
