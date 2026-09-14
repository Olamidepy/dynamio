import { GameState } from './types';

export type StateChangeCallback = (newState: GameState, prevState: GameState) => void;

export class StateMachine {
  private currentState: GameState = 'BOOT';
  private listeners: Set<StateChangeCallback> = new Set();

  constructor(initialState: GameState = 'TITLE') {
    this.currentState = initialState;
  }

  public getState(): GameState {
    return this.currentState;
  }

  public setState(nextState: GameState) {
    if (this.currentState === nextState) return;
    const prev = this.currentState;
    this.currentState = nextState;
    this.listeners.forEach((cb) => cb(nextState, prev));
  }

  public subscribe(cb: StateChangeCallback): () => void {
    this.listeners.add(cb);
    return () => {
      this.listeners.delete(cb);
    };
  }
}
