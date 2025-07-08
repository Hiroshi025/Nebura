/**
 * Configuration for an embed.
 * This interface defines the structure of an embed configuration object.
 */
export interface EmbedConfig {
  /**
   * The color of the embed, represented as a hexadecimal string.
   */
  color: string;

  /**
   * Footer information for the embed.
   * This includes optional text and an optional icon URL.
   */
  footer?: {
    /**
     * The text to display in the footer of the embed.
     */
    text: string;

    /**
     * The URL of the icon to display in the footer of the embed.
     */
    iconURL?: string;
  };
}