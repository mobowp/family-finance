'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import yahooFinance from 'yahoo-finance2';
import { getCurrentUser } from './user';

export async function createAsset(formData: FormData) {
  const name = formData.get('name') as string;
  const type = formData.get('type') as string;
  const symbol = formData.get('symbol') as string;
  const quantity = parseFloat(formData.get('quantity') as string);
  const costPrice = parseFloat(formData.get('costPrice') as string);
  const inputMarketPrice = formData.get('marketPrice') ? parseFloat(formData.get('marketPrice') as string) : null;
  const userId = formData.get('userId') as string;
  
  const user = await getCurrentUser();

  if (!user) {
    throw new Error('User not found');
  }

  try {
    // Initial market price is cost price unless fetched or provided
    let marketPrice = costPrice;

    if (inputMarketPrice !== null && !isNaN(inputMarketPrice)) {
      marketPrice = inputMarketPrice;
    } else if (symbol) {
      // Try to fetch real price if symbol is provided and no market price input
      try {
        const quote: any = await fetchQuoteWithTimeout(symbol);
        if (quote && quote.regularMarketPrice) {
          marketPrice = quote.regularMarketPrice;
        }
      } catch (e) {
        console.warn(`Failed to fetch initial price for ${symbol}`, e);
      }
    }

    const createData: any = {
      name,
      type,
      symbol,
      quantity,
      costPrice,
      marketPrice,
      userId: user.id,
    };

    if (user.role === 'ADMIN' && userId) {
      createData.userId = userId;
    }

    await prisma.asset.create({
      data: createData,
    });

  } catch (error) {
    console.error('Failed to create asset:', error);
    throw new Error('Failed to create asset');
  }

  revalidatePath('/assets');
  revalidatePath('/wealth');
  redirect('/wealth?tab=assets');
}

import { getGoldPrice } from './gold-price';
import { getStockPrice } from './stock-price';

const fetchQuoteWithTimeout = async (symbol: string, timeout = 5000) => {
  return Promise.race([
    yahooFinance.quote(symbol),
    new Promise((_, reject) => 
      setTimeout(() => reject(new Error(`Request timeout for ${symbol}`)), timeout)
    )
  ]);
};

export async function getAssetsForUpdate() {
  const assets = await prisma.asset.findMany({
    select: {
      id: true,
      symbol: true,
      type: true,
    }
  });
  return assets;
}

export async function updateBatchGoldPrices(ids: string[]) {
  if (!ids.length) return 0;
  
  try {
    // Fetch gold price once
    const res = await getGoldPrice();
    if (res.success && res.price) {
      const price = parseFloat(res.price);
      
      // Update all assets
      const result = await prisma.asset.updateMany({
        where: {
          id: { in: ids },
          type: 'PHYSICAL_GOLD' // Safety check
        },
        data: {
          marketPrice: price
        }
      });
      
      return result.count;
    }
    return 0;
  } catch (error) {
    console.error('Failed to batch update gold prices:', error);
    return 0;
  }
}

export async function updateSingleAssetPrice(id: string) {
  try {
    const asset = await prisma.asset.findUnique({ where: { id } });
    if (!asset) return false;

    let updated = false;

    // Update Yahoo Finance assets
    if (asset.symbol) {
      // Special handling for HK stocks using K780 API if type is HK_STOCK
      if (asset.type === 'HK_STOCK') {
        try {
          const res = await getStockPrice(asset.symbol);
          if (res.success && res.price) {
            await prisma.asset.update({
              where: { id: asset.id },
              data: { marketPrice: parseFloat(res.price) }
            });
            return true; // Successfully updated via K780
          }
        } catch (e) {
          console.error(`Failed to update HK stock price for ${asset.symbol}`, e);
          // Fallback to Yahoo Finance if K780 fails
        }
      }

      try {
        const quote: any = await fetchQuoteWithTimeout(asset.symbol);
        if (quote && quote.regularMarketPrice) {
          await prisma.asset.update({
            where: { id: asset.id },
            data: { marketPrice: quote.regularMarketPrice }
          });
          updated = true;
        }
      } catch (e) {
        console.error(`Failed to update price for ${asset.symbol}`, e);
      }
    }
    
    // Update Physical Gold assets
    if (asset.type === 'PHYSICAL_GOLD') {
      try {
        const res = await getGoldPrice();
        if (res.success && res.price) {
          await prisma.asset.update({
            where: { id: asset.id },
            data: { marketPrice: parseFloat(res.price) }
          });
          updated = true;
        }
      } catch (e) {
        console.error(`Failed to update gold price for asset ${asset.id}`, e);
      }
    }

    return updated;
  } catch (error) {
    console.error(`Failed to update asset ${id}:`, error);
    return false;
  }
}

export async function revalidateAssets() {
  revalidatePath('/assets');
  revalidatePath('/wealth');
}

export async function updateAssetPrices() {
  // Deprecated: Use client-side iteration instead
  return { success: false, message: 'Please use client-side update' };
}

export async function updateAsset(id: string, formData: FormData) {
  console.log('Updating asset:', id);
  const name = formData.get('name') as string;
  const type = formData.get('type') as string;
  const symbol = formData.get('symbol') as string;
  const quantity = parseFloat(formData.get('quantity') as string);
  const costPrice = parseFloat(formData.get('costPrice') as string);
  const inputMarketPrice = formData.get('marketPrice') ? parseFloat(formData.get('marketPrice') as string) : null;
  const userId = formData.get('userId') as string;

  const user = await getCurrentUser();
  if (!user) {
    throw new Error('User not found');
  }

  try {
    const data: any = {
      name,
      type,
      symbol,
      quantity,
      costPrice,
    };

    // If market price is explicitly provided, use it
    if (inputMarketPrice !== null && !isNaN(inputMarketPrice)) {
      data.marketPrice = inputMarketPrice;
    } 
    // If symbol is provided (and maybe changed, but we don't check change here easily), try to fetch
    else if (symbol) {
      try {
        console.log('Fetching price for symbol:', symbol);
        const quote: any = await fetchQuoteWithTimeout(symbol);
        if (quote && quote.regularMarketPrice) {
          data.marketPrice = quote.regularMarketPrice;
          console.log('Fetched price:', data.marketPrice);
        }
      } catch (e) {
        console.warn(`Failed to fetch price for ${symbol}`, e);
      }
    }

    if (user.role === 'ADMIN' && userId) {
      data.userId = userId;
    }

    const whereClause: any = { id };
    if (user.role !== 'ADMIN') {
      whereClause.userId = user.id;
    }

    await prisma.asset.update({
      where: whereClause,
      data,
    });
    console.log('Asset updated successfully');

  } catch (error) {
    console.error('Failed to update asset:', error);
    throw new Error('Failed to update asset');
  }

  revalidatePath('/assets');
  revalidatePath('/wealth');
  redirect('/wealth?tab=assets');
}

export async function deleteAsset(id: string) {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error('User not found');
  }

  try {
    // 先检查资产是否存在且属于当前用户
    const asset = await prisma.asset.findUnique({
      where: { id },
      select: { userId: true }
    });

    if (!asset) {
      throw new Error('Asset not found');
    }

    if (asset.userId !== user.id) {
      throw new Error('Unauthorized to delete this asset');
    }

    // 删除资产
    await prisma.asset.delete({
      where: { id },
    });
  } catch (error) {
    console.error('Failed to delete asset:', error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Failed to delete asset');
  }

  revalidatePath('/assets');
  revalidatePath('/wealth');
  redirect('/wealth?tab=assets');
}
