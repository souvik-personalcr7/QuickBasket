/**
 * Utility to compress and downscale client-side image files before saving
 * to localStorage or sending via API, preventing QuotaExceededError and slow network payloads.
 */
export function compressImageFile(
  file: File,
  maxWidth = 800,
  maxHeight = 800,
  quality = 0.82
): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!file || !file.type.startsWith('image/')) {
      return reject(new Error('Selected file is not an image'));
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      if (!dataUrl) return resolve('');

      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        try {
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve(dataUrl);
            return;
          }
          ctx.drawImage(img, 0, 0, width, height);
          const compressed = canvas.toDataURL('image/jpeg', quality);
          resolve(compressed);
        } catch {
          resolve(dataUrl);
        }
      };
      img.onerror = () => resolve(dataUrl);
      img.src = dataUrl;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * Sync shop details (specifically name, image, category, address) across all
 * matching records in qb_registered_shops and dedicated storage keys.
 */
export function syncShopImageToStorage(params: {
  shopName: string;
  image: string;
  category?: string;
  address?: string;
  ownerId?: string;
  ownerEmail?: string;
  isOpen?: boolean;
}) {
  if (typeof window === 'undefined') return;

  const { shopName, image, category, address, ownerId, ownerEmail, isOpen } = params;
  const cleanName = (shopName || '').trim();
  const cleanImg = (image || '').trim();

  try {
    // 1. Save directly under dedicated key by shop name
    if (cleanName) {
      const keyName = `qb_shop_image_${encodeURIComponent(cleanName.toLowerCase())}`;
      localStorage.setItem(keyName, cleanImg);
    }

    // 2. Save directly under owner email & id if available
    if (ownerEmail) {
      const keyEmail = `qb_shop_image_${encodeURIComponent(ownerEmail.trim().toLowerCase())}`;
      localStorage.setItem(keyEmail, cleanImg);
    }
    if (ownerId) {
      localStorage.setItem(`qb_shop_image_${ownerId}`, cleanImg);
    }
    if (cleanImg) {
      localStorage.setItem('qb_latest_shop_image', cleanImg);
    }

    // 3. Update all entries in qb_registered_shops
    const raw = localStorage.getItem('qb_registered_shops');
    const list: any[] = raw ? JSON.parse(raw) : [];
    let updatedAny = false;

    const normalizedShopId = `shop_${ownerId || ownerEmail || 'guest'}`;

    for (let i = 0; i < list.length; i++) {
      const s = list[i];
      if (!s) continue;

      const matchesName = cleanName && s.name && s.name.trim().toLowerCase() === cleanName.toLowerCase();
      const matchesEmail = ownerEmail && s.ownerEmail && s.ownerEmail.trim().toLowerCase() === ownerEmail.trim().toLowerCase();
      const matchesId = (ownerId && s.ownerId === ownerId) || (s.id === normalizedShopId);

      if (matchesName || matchesEmail || matchesId) {
        list[i] = {
          ...list[i],
          name: cleanName || list[i].name,
          image: cleanImg || list[i].image,
          category: category !== undefined ? category : list[i].category,
          address: address !== undefined ? address : list[i].address,
          ownerId: ownerId || list[i].ownerId,
          ownerEmail: ownerEmail || list[i].ownerEmail,
          isOpen: isOpen !== undefined ? isOpen : list[i].isOpen,
        };
        updatedAny = true;
      }
    }

    if (!updatedAny && cleanName) {
      list.push({
        id: normalizedShopId,
        name: cleanName,
        category: category || 'Retail & Grocery',
        address: address || 'Store Address',
        image: cleanImg || 'https://images.unsplash.com/photo-1578916171728-46686eac8d58?w=350&auto=format&fit=crop&q=80',
        ownerId,
        ownerEmail,
        isOpen: isOpen ?? true,
        rating: 4.8,
        reviewCount: 'Verified Store',
        deliveryTime: '20-30 mins',
        isFreeDelivery: true,
      });
    }

    localStorage.setItem('qb_registered_shops', JSON.stringify(list));

    // Dispatch global event for instant reactive UI updates
    window.dispatchEvent(
      new CustomEvent('qb_shop_details_updated', {
        detail: { shopName: cleanName, image: cleanImg },
      })
    );
  } catch (err) {
    console.error('Error syncing shop image to storage:', err);
  }
}

/**
 * Resolve the most up-to-date shop image from localStorage or fallback.
 */
export function getStoredShopImage(shop: {
  name?: string;
  image?: string;
  ownerEmail?: string;
  ownerId?: string;
}): string {
  if (typeof window === 'undefined') return shop.image || '';

  const cleanName = (shop.name || '').trim().toLowerCase();
  const cleanEmail = (shop.ownerEmail || '').trim().toLowerCase();

  if (cleanName) {
    const byName = localStorage.getItem(`qb_shop_image_${encodeURIComponent(cleanName)}`);
    if (byName && byName.trim()) return byName.trim();
  }

  if (cleanEmail) {
    const byEmail = localStorage.getItem(`qb_shop_image_${encodeURIComponent(cleanEmail)}`);
    if (byEmail && byEmail.trim()) return byEmail.trim();
  }

  if (shop.ownerId) {
    const byId = localStorage.getItem(`qb_shop_image_${shop.ownerId}`);
    if (byId && byId.trim()) return byId.trim();
  }

  if (shop.image && !shop.image.includes('photo-1578916171728-46686eac8d58')) {
    return shop.image;
  }

  return shop.image || 'https://images.unsplash.com/photo-1578916171728-46686eac8d58?w=350&auto=format&fit=crop&q=80';
}

