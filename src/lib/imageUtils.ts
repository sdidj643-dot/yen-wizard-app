// Compress image to reduce storage size
export function compressImage(base64: string, maxWidth: number = 200, quality: number = 0.7): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let { width, height } = img;
      
      // Calculate new dimensions
      if (width > maxWidth) {
        height = (height * maxWidth) / width;
        width = maxWidth;
      }
      
      canvas.width = width;
      canvas.height = height;
      
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      } else {
        resolve(base64);
      }
    };
    img.onerror = () => resolve(base64);
    img.src = base64;
  });
}

// Get localStorage usage info
export function getStorageUsage(): { used: number; max: number; percentage: number } {
  let used = 0;
  for (const key in localStorage) {
    if (localStorage.hasOwnProperty(key)) {
      used += localStorage.getItem(key)?.length || 0;
    }
  }
  // localStorage typically has 5MB limit
  const max = 5 * 1024 * 1024;
  return {
    used,
    max,
    percentage: Math.round((used / max) * 100),
  };
}

// Clear all app data from localStorage
export function clearAppData(): void {
  localStorage.removeItem('mercari-inventory-data');
  localStorage.removeItem('mercari-inventory-settings');
}
