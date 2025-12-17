'use server';

import { getSystemSettingInternal } from "@/lib/system-settings";

import { getCurrentUser } from "./user";

export async function getStockPrice(symbol: string) {
  // Handle symbol format: 
  // If input is "00700" or "00700.HK", convert to "hk00700"
  // If input is "700", convert to "hk00700" (maybe?)
  // Let's assume standard 5 digit for HK.
  
  let apiSymbol = symbol.toLowerCase();
  
  // Remove .HK suffix if present
  if (apiSymbol.endsWith('.hk')) {
    apiSymbol = apiSymbol.replace('.hk', '');
  }
  
  // Add 'hk' prefix if not present and looks like a number
  if (/^\d+$/.test(apiSymbol)) {
    // Pad with zeros to ensure 5 digits for HK stocks
    // e.g. 700 -> 00700, 2718 -> 02718
    const paddedSymbol = apiSymbol.padStart(5, '0');
    apiSymbol = `hk${paddedSymbol}`;
  }

  const user = await getCurrentUser();
  if (!user) {
    return {
      success: false,
      message: 'Please login first.'
    };
  }
  const familyId = (user as any).familyId || user.id;

  // Get API credentials from database
  const appkey = await getSystemSettingInternal('k780_appkey', familyId);
  const sign = await getSystemSettingInternal('k780_sign', familyId);

  if (!appkey || !sign) {
    return {
      success: false,
      message: 'API configuration missing. Please configure AppKey and Sign in settings.'
    };
  }

  const url = 'http://api.k780.com';
  const params = new URLSearchParams({
    app: 'finance.stock_realtime',
    stoSym: apiSymbol,
    appkey: appkey,
    sign: sign,
    format: 'json',
  });

  const fullUrl = `${url}?${params.toString()}`;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    const response = await fetch(fullUrl, { 
      cache: 'no-store',
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.success !== '0') {
      // API returns success != '0' for success
      // Structure: result: { lists: { "hk00700": { last_price: "..." } } }
      // Or sometimes just result: { ... } depending on endpoint?
      // Based on test output: { success: '1', result: { lists: { hk00700: { ... } } } }
      
      let price = null;
      let name = null;
      
      if (data.result && data.result.lists) {
        const keys = Object.keys(data.result.lists);
        if (keys.length > 0) {
          const item = data.result.lists[keys[0]];
          price = item.last_price;
          name = item.sname;
        }
      }

      return {
        success: true,
        price: price,
        name: name,
        result: data.result
      };
    } else {
      return {
        success: false,
        message: `${data.msgid} ${data.msg}`
      };
    }
  } catch (error: any) {
    console.error('Error fetching stock price:', error);
    return {
      success: false,
      message: error.message
    };
  }
}
