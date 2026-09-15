declare module '@nimiq/identicons' {
  export default class Identicons {
    static svg(text: string): Promise<string>;
    static render(text: string, element: HTMLElement): Promise<void>;
    static toDataUrl(text: string): Promise<string>;
    static placeholder(color?: string, strokeWidth?: number): string;
    static placeholderToDataUrl(color?: string, strokeWidth?: number): string;
    static image(text: string): Promise<HTMLImageElement>;
  }
  export function makeHash(t: string): string;
  export function getBackgroundColorName(o: string): string;
  export const colorNames: string[];
  export const colors: string[];
  export const backgroundColors: string[];
}

declare module '@nimiq/identicons/dist/identicons-name.min.js' {
  export function name(address: string): string;
  export function getBackgroundColorName(address: string): string;
  export const colorNames: string[];
  export const colors: string[];
  export const backgroundColors: string[];
}
