declare module 'ggwave' {
  export interface GGWaveOptions {
    sampleRate: number;
    sampleSize?: number;
  }

  export interface EncodeOptions {
    protocol: 'audible' | 'ultrasound';
    volume: number;
    sampleRate: number;
  }

  export class GGWave {
    static init(options: GGWaveOptions): Promise<GGWave>;
    encode(message: string, options: EncodeOptions): Promise<Float32Array>;
    decode(audioData: Float32Array): Promise<string | null>;
  }
}
