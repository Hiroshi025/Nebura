import { ClientEvents } from "discord.js";

/**
 * Class representing an event in the bot system.
 * This class defines the event name, the execution logic for the event, and whether it runs only once.
 *
 * @example
 * const event = new Event('messageCreate', (message) => {
 *   console.log(`Message received: ${message.content}`);
 * });
 *
 * @template K - A key from `ClientEvents`, representing the event name.
 * @class
 */
export class Event<K extends keyof ClientEvents> {
  /**
   * The name of the event, which corresponds to a key in `ClientEvents`.
   *
   * @type {K}
   * @readonly
   */
  readonly event: K;

  /**
   * The function that runs when the event is triggered.
   * It receives arguments based on the event type.
   *
   * @type {(...args: ClientEvents[K]) => void}
   * @readonly
   */
  readonly run: (...args: ClientEvents[K]) => void;

  /**
   * Whether the event should only run once. If `true`, the event listener is removed after the first execution.
   *
   * @type {boolean | undefined}
   * @readonly
   */
  readonly once?: boolean;

  /**
   * Creates an instance of Event.
   *
   * @param event - The name of the event, which corresponds to a key in `ClientEvents`.
   * @param run - The function that executes when the event is triggered. It receives the arguments expected for that event.
   * @param once - Optional. Whether the event should run only once. Defaults to `false`.
   */
  constructor(event: K, run: (...args: ClientEvents[K]) => void, once?: boolean) {
    this.event = event;
    this.run = run;
    this.once = once;
  }
}
