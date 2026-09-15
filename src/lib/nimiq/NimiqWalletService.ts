import { init } from '@nimiq/mini-app-sdk';
import HubApi from '@nimiq/hub-api';
import { NimiqProfileService } from './NimiqProfileService';

export interface NimiqWalletAccount {
  address: string;
  formattedAddress: string;
  label?: string; // Official scraped name
  moniker?: string; // Official Nimiq 3-word name
  colorName?: string; // e.g. "Red"
  avatarDataUrl?: string; // Authentic SVG data URL
  balanceNim: number;
  isConnected: boolean;
  isMiniApp?: boolean;
  consensus?: boolean;
  blockNumber?: number;
}

export class NimiqWalletService {
  private static instance: NimiqWalletService;
  private account: NimiqWalletAccount = {
    address: '',
    formattedAddress: '',
    label: '',
    moniker: '',
    colorName: '',
    balanceNim: 0,
    isConnected: false,
    isMiniApp: false,
  };

  private listeners: Set<(account: NimiqWalletAccount) => void> = new Set();
  private nimiqProvider: any = null;
  private isMiniAppReady = false;
  private isInitializing = false;

  private constructor() {
    this.restoreSession();
    this.initMiniApp();
  }

  public static getInstance(): NimiqWalletService {
    if (!NimiqWalletService.instance) {
      NimiqWalletService.instance = new NimiqWalletService();
    }
    return NimiqWalletService.instance;
  }

  /**
   * Initializes the Nimiq Mini App SDK bridge.
   * Auto-detects if running inside Nimiq Pay mobile wallet.
   */
  public async initMiniApp(): Promise<void> {
    if (this.isInitializing) return;
    this.isInitializing = true;

    try {
      // Initialize with 4s timeout so standalone web browsers don't stall
      const provider = await init({ timeout: 4000 });
      if (provider) {
        this.nimiqProvider = provider;
        this.isMiniAppReady = true;
        await this.syncMiniAppAccount();
      }
    } catch {
      // Fallback: outside Nimiq Pay (standard web browser)
      this.isMiniAppReady = false;
    } finally {
      this.isInitializing = false;
    }
  }

  /**
   * Fetches the real on-chain balance from the Nimiq network (Mainnet / Testnet)
   */
  public async fetchOnChainBalance(address: string): Promise<number | null> {
    const clean = address.replace(/\s+/g, '').toUpperCase();
    if (!clean.startsWith('NQ')) return null;

    try {
      const res = await fetch(`https://api.nimiq.watch/account/${clean}`);
      if (res.ok) {
        const data = await res.json();
        if (typeof data.balance === 'number') {
          return data.balance / 1e5; // Convert Lunas to NIM
        }
      }
    } catch {
      // Try testnet fallback
      try {
        const res = await fetch(`https://api.nimiq-testnet.watch/account/${clean}`);
        if (res.ok) {
          const data = await res.json();
          if (typeof data.balance === 'number') {
            return data.balance / 1e5;
          }
        }
      } catch {}
    }
    return null;
  }

  /**
   * Fetches the user's accounts, consensus, and block height from Nimiq Pay
   */
  public async syncMiniAppAccount(): Promise<NimiqWalletAccount | null> {
    if (!this.nimiqProvider) return null;

    try {
      const [accountsResult, consensusResult, blockResult] = await Promise.all([
        this.nimiqProvider.listAccounts(),
        this.nimiqProvider.isConsensusEstablished().catch(() => false),
        this.nimiqProvider.getBlockNumber().catch(() => null),
      ]);

      const accounts = Array.isArray(accountsResult) ? accountsResult : [];
      if (accounts.length > 0) {
        const address = accounts[0];
        // Fetch real live on-chain balance
        const liveBal = await this.fetchOnChainBalance(address);
        const profile = NimiqProfileService.getProfile(address);

        this.account = {
          address,
          formattedAddress: this.formatAddress(address),
          label: profile.label,
          moniker: profile.moniker,
          colorName: profile.colorName,
          avatarDataUrl: profile.avatarDataUrl,
          balanceNim: liveBal !== null ? liveBal : (this.account.balanceNim || 0),
          isConnected: true,
          isMiniApp: true,
          consensus: !!consensusResult,
          blockNumber: typeof blockResult === 'number' ? blockResult : undefined,
        };
        this.enrichWithProfile(address);
        this.saveSession();
        return this.account;
      }
    } catch (e) {
      console.warn('Mini App sync warning:', e);
    }
    return null;
  }

  private enrichWithProfile(address: string, customLabel?: string) {
    if (!address) return;
    const profile = NimiqProfileService.getProfile(address, customLabel);
    if (!this.account.label || customLabel) this.account.label = customLabel || profile.label;
    if (!this.account.moniker) this.account.moniker = profile.moniker;
    if (!this.account.colorName) this.account.colorName = profile.colorName;
    if (profile.avatarDataUrl && !this.account.avatarDataUrl) {
      this.account.avatarDataUrl = profile.avatarDataUrl;
    }

    NimiqProfileService.loadAvatarDataUrl(address).then((dataUrl) => {
      if (dataUrl && this.account.address === address && this.account.avatarDataUrl !== dataUrl) {
        this.account.avatarDataUrl = dataUrl;
        this.saveSession();
      }
    });
  }

  private restoreSession() {
    const saved = localStorage.getItem('dynamio_wallet');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.address && parsed.address.startsWith('NQ') && !parsed.address.startsWith('NQDYN')) {
          this.account = { ...this.account, ...parsed };
          if (this.account.address) {
            this.enrichWithProfile(this.account.address, this.account.label);
            this.fetchOnChainBalance(this.account.address).then((bal) => {
              if (bal !== null) {
                this.account.balanceNim = bal;
                this.saveSession();
              }
            });
          }
        } else {
          // Clear any old synthetic demo session
          localStorage.removeItem('dynamio_wallet');
        }
      } catch (e) {
        localStorage.removeItem('dynamio_wallet');
      }
    }
  }

  private saveSession() {
    localStorage.setItem('dynamio_wallet', JSON.stringify(this.account));
    this.listeners.forEach((cb) => cb(this.account));
  }

  public subscribe(cb: (account: NimiqWalletAccount) => void): () => void {
    this.listeners.add(cb);
    cb(this.account);
    return () => {
      this.listeners.delete(cb);
    };
  }

  public getAccount(): NimiqWalletAccount {
    return this.account;
  }

  /**
   * Sets the active user's Nimiq address, queries on-chain balance & profile
   */
  public async setAddress(rawAddress: string, customLabel?: string): Promise<NimiqWalletAccount> {
    const clean = rawAddress.replace(/\s+/g, '').toUpperCase();
    if (!clean.startsWith('NQ')) {
      throw new Error('Invalid Nimiq address format. Must start with NQ');
    }
    const liveBal = await this.fetchOnChainBalance(clean);
    const profile = NimiqProfileService.getProfile(clean, customLabel);

    this.account = {
      address: clean,
      formattedAddress: this.formatAddress(clean),
      label: customLabel || profile.label,
      moniker: profile.moniker,
      colorName: profile.colorName,
      avatarDataUrl: profile.avatarDataUrl,
      balanceNim: liveBal !== null ? liveBal : 0,
      isConnected: true,
      isMiniApp: this.isMiniAppReady,
    };

    this.enrichWithProfile(clean, customLabel);
    this.saveSession();
    return this.account;
  }

  /**
   * Connects via official Nimiq Hub (chooseAddress)
   */
  public async connectViaHub(): Promise<NimiqWalletAccount> {
    try {
      const hub = new HubApi('https://hub.nimiq.com');
      const res = await hub.chooseAddress({ appName: 'Dynamio' });
      if (res && res.address) {
        return await this.setAddress(res.address, res.label);
      }
    } catch (e: any) {
      console.warn('Nimiq Hub connection cancelled or failed:', e);
      throw e;
    }
    return this.account;
  }

  /**
   * Connects to Nimiq wallet.
   * If running inside Nimiq Pay, queries live accounts.
   * If running in browser with Hub, triggers Nimiq Hub account chooser.
   */
  public async connect(): Promise<NimiqWalletAccount> {
    // 1. If Nimiq Pay mini app provider is ready, query live accounts
    if (this.isMiniAppReady && this.nimiqProvider) {
      const liveAcc = await this.syncMiniAppAccount();
      if (liveAcc) return liveAcc;
    }

    // 2. Official Nimiq Hub connection
    return await this.connectViaHub();
  }

  public disconnect() {
    this.account = {
      address: '',
      formattedAddress: '',
      balanceNim: 0,
      isConnected: false,
      isMiniApp: false,
    };
    this.saveSession();
  }

  /**
   * Claims a verified NIM reward transaction
   * Dispatches real on-chain transaction from the Dynamio Game Treasury!
   */
  public async claimRewardTransaction(
    nimAmount: number,
    claimTicketId: string
  ): Promise<{ success: boolean; txHash: string; rawHex?: string }> {
    if (!this.account.isConnected || !this.account.address) {
      throw new Error('Wallet not connected');
    }

    if (this.account.address.startsWith('NQDYN')) {
      throw new Error('Please connect your real Nimiq wallet (e.g. Red Address NQ39... or NQ51...) to receive live Mainnet payouts.');
    }

    try {
      // 1. Call automated Treasury payout dispenser
      const res = await fetch('/api/claim-reward', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          recipient: this.account.address,
          amount: nimAmount,
          ticketId: claimTicketId,
          blockNumber: this.account.blockNumber,
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `HTTP ${res.status}: Failed to dispatch on-chain reward`);
      }

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || 'Failed to dispatch on-chain reward');
      }

      // 2. Refresh on-chain balance
      setTimeout(async () => {
        const liveBal = await this.fetchOnChainBalance(this.account.address);
        if (liveBal !== null) {
          this.account.balanceNim = liveBal;
          this.saveSession();
        }
      }, 2000);

      // Optimistic balance increment while on-chain confirms
      this.account.balanceNim = Number((this.account.balanceNim + nimAmount).toFixed(4));
      this.saveSession();

      return {
        success: true,
        txHash: data.txHash,
        rawHex: data.rawHex,
      };
    } catch (err: any) {
      console.error('Treasury claim API error:', err);
      throw err;
    }
  }

  /**
   * Sends or escrows NIM for challenge entry
   * Dispatches a live on-chain transaction via Nimiq Pay or official Nimiq Hub!
   */
  public async sendTransaction(recipient: string, nimAmount: number): Promise<{ success: boolean; txHash: string }> {
    if (!this.account.isConnected) {
      throw new Error('Wallet not connected');
    }

    const cleanRecipient = recipient.replace(/\s+/g, '').toUpperCase();
    const lunas = Math.round(nimAmount * 1e5); // 1 NIM = 100,000 Lunas

    // 1. If inside Nimiq Pay Mini App, use native sendBasicTransaction
    if (this.isMiniAppReady && this.nimiqProvider && this.nimiqProvider.sendBasicTransaction) {
      try {
        const res = await this.nimiqProvider.sendBasicTransaction({
          recipient: cleanRecipient,
          value: lunas,
        });

        if (typeof res === 'object' && res && 'error' in res) {
          throw new Error((res as any).error?.message || 'Transaction was cancelled or failed in Nimiq Pay');
        }

        const txHash = typeof res === 'string' ? res : (res as any)?.hash || (res as any)?.transactionHash || 'tx_confirmed';
        // Refresh on-chain balance
        const liveBal = await this.fetchOnChainBalance(this.account.address);
        if (liveBal !== null) this.account.balanceNim = liveBal;
        this.saveSession();
        return { success: true, txHash };
      } catch (err: any) {
        console.error('Nimiq Pay transaction failed:', err);
        throw err;
      }
    }

    // 2. Web / Mobile browser: Official Nimiq Hub Checkout (Live On-Chain Transaction)
    try {
      const hub = new HubApi('https://hub.nimiq.com');
      const result = await hub.checkout({
        appName: 'Dynamio Arena',
        recipient: cleanRecipient,
        value: lunas,
        shopLogoUrl: `${window.location.origin}/icon-192.png`,
      });

      const txHash = (result as any)?.hash || (result as any)?.transactionHash || 'tx_confirmed';

      // Refresh on-chain balance after checkout confirmation
      setTimeout(async () => {
        const liveBal = await this.fetchOnChainBalance(this.account.address);
        if (liveBal !== null) {
          this.account.balanceNim = liveBal;
          this.saveSession();
        }
      }, 1500);

      return {
        success: true,
        txHash,
      };
    } catch (err: any) {
      console.error('Nimiq Hub checkout transaction failed:', err);
      throw err;
    }
  }

  public formatAddress(raw: string): string {
    const clean = raw.replace(/\s+/g, '').toUpperCase();
    const parts: string[] = [];
    for (let i = 0; i < clean.length; i += 4) {
      parts.push(clean.substring(i, i + 4));
    }
    return parts.join(' ');
  }
}
