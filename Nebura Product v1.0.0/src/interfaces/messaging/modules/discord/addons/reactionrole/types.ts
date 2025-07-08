/**
 * Data structure for reaction roles.
 * This interface defines the configuration for managing reaction roles in Discord.
 */
export interface ReactionRoleData {
  /**
   * The ID of the message associated with the reaction roles.
   */
  MESSAGE_ID: string;

  /**
   * Indicates whether adding one role removes others.
   * If `true`, selecting one role will deselect others.
   */
  remove_others: boolean;

  /**
   * Parameters for each reaction role.
   * This includes the emoji, message, and role associated with the reaction.
   */
  Parameters: {
    /**
     * The emoji used for the reaction role.
     */
    Emoji: string;

    /**
     * The message associated with the emoji.
     */
    Emojimsg: string;

    /**
     * The role ID associated with the emoji.
     */
    Role: string;
  }[];
}