import Identicons from '@nimiq/identicons';
import { getBackgroundColorName, name as getIdenticonMoniker } from '@nimiq/identicons/dist/identicons-name.min.js';

export interface NimiqUserProfile {
  address: string;
  formattedAddress: string;
  label: string; // e.g. "Red Address"
  moniker: string; // e.g. "Country Duck Harvester"
  colorName: string; // e.g. "Red"
  avatarDataUrl?: string;
  avatarSvg?: string;
}

// In-memory cache for generated identicon data URLs
const avatarCache = new Map<string, string>();

export class NimiqProfileService {
  /**
   * Generates or derives the human-friendly Nimiq profile info from an address
   */
  public static getProfile(rawAddress: string): NimiqUserProfile {
    const clean = (rawAddress || '').replace(/\s+/g, '').toUpperCase();
    if (!clean.startsWith('NQ')) {
      return {
        address: clean,
        formattedAddress: rawAddress,
        label: 'Anonymous Player',
        moniker: 'Arcade Contender',
        colorName: 'Gold',
      };
    }

    let colorName = 'Gold';
    let moniker = 'Speed Striker';
    try {
      colorName = getBackgroundColorName(clean) || 'Gold';
    } catch {
      colorName = 'Gold';
    }

    try {
      moniker = getIdenticonMoniker(clean) || 'Speed Striker';
    } catch {
      moniker = 'Speed Striker';
    }

    const cachedDataUrl = avatarCache.get(clean) || localStorage.getItem(`nim_pfp_${clean}`) || undefined;

    return {
      address: clean,
      formattedAddress: this.formatAddress(clean),
      label: `${colorName} Address`,
      moniker,
      colorName,
      avatarDataUrl: cachedDataUrl,
    };
  }

  /**
   * Generates the authentic Nimiq Identicon SVG data URL (client-side)
   */
  public static async loadAvatarDataUrl(rawAddress: string): Promise<string> {
    const clean = (rawAddress || '').replace(/\s+/g, '').toUpperCase();
    if (!clean.startsWith('NQ')) return '';

    if (avatarCache.has(clean)) {
      return avatarCache.get(clean)!;
    }

    const stored = localStorage.getItem(`nim_pfp_${clean}`);
    if (stored) {
      avatarCache.set(clean, stored);
      return stored;
    }

    try {
      const dataUrl = await Identicons.toDataUrl(clean);
      if (dataUrl) {
        avatarCache.set(clean, dataUrl);
        try {
          localStorage.setItem(`nim_pfp_${clean}`, dataUrl);
        } catch {
          // localStorage full fallback
        }
        return dataUrl;
      }
    } catch (e) {
      console.warn('Could not generate full identicon dataUrl, using placeholder:', e);
    }

    // Fallback to placeholder
    try {
      const ph = Identicons.placeholderToDataUrl('#FC8702', 2);
      avatarCache.set(clean, ph);
      return ph;
    } catch {
      return '';
    }
  }

  public static formatAddress(raw: string): string {
    const clean = raw.replace(/\s+/g, '').toUpperCase();
    const parts: string[] = [];
    for (let i = 0; i < clean.length; i += 4) {
      parts.push(clean.substring(i, i + 4));
    }
    return parts.join(' ');
  }
}
