'use server';

import { getSystemSettingInternal } from "@/lib/system-settings";

import { getCurrentUser } from "./user";

export async function getGoldPrice() {
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
    app: 'finance.gold_price',
    goldid: '1053',
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
      // Structure: result: { dtList: { "1053": { last_price: "..." } } }
      let price = null;
      if (data.result && data.result.dtList && data.result.dtList['1053']) {
        price = data.result.dtList['1053'].last_price;
      }

      return {
        success: true,
        price: price,
        result: data.result
      };
    } else {
      return {
        success: false,
        message: `${data.msgid} ${data.msg}`
      };
    }
  } catch (error: any) {
    console.error('Error fetching gold price:', error);
    return {
      success: false,
      message: error.message
    };
  }
}
