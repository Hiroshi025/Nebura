/**
 * Represents the body of a request to the Google API for text processing.
 *
 * @remarks
 * This type is used to structure the payload sent to Google-based endpoints, such as for generative AI or NLP tasks.
 *
 * @see {@link https://cloud.google.com/vertex-ai/docs/generative-ai Google Generative AI Documentation}
 *
 * @example
 * ```ts
 * const body: GoogleBody = {
 *   text: "Summarize this article.",
 *   systemInstruction: "Be concise."
 * };
 * ```
 */
export type GoogleBody = {
  /**
   * The text input to be processed by the Google API.
   */
  text: string;
  /**
   * Optional system instruction to guide the model's behavior.
   */
  systemInstruction?: string;
};
