/**
 * Extends the Express Request interface to include additional properties.
 * This allows for custom properties to be added to the request object
 * in an Express application, enabling more flexible and type-safe usage.
 */
declare global {
  namespace Express {
    interface Request {
      /**
       * The authenticated user object, if available.
       * This property is typically populated after a successful authentication process.
       */
      user?: any;

      /**
       * The license information associated with the request.
       * This property can be used to determine the type of license the client holds.
       */
      license?: {
        /**
         * The type of license. Can be one of the following values:
         * - "FREE": Indicates a free license.
         * - "BASIC": Indicates a basic license.
         * - "PREMIUM": Indicates a premium license.
         */
        type: "FREE" | "BASIC" | "PREMIUM";
      };

      /**
       * The IP address of the client making the request.
       * This property can be used for logging, analytics, or security purposes.
       */
      clientIp?: string;

      /**
       * The unique identifier of the request, if available.
       * This property can be used for tracing and debugging purposes.
       */
      id?: string;
    }
  }
}

/**
 * Represents the input required to initialize application routes.
 * This interface is used to define the structure of the object
 * passed to route initialization functions.
 */
export interface TRoutesInput {
  /**
   * The Express application instance.
   * This is the main application object provided by the Express framework.
   */
  app: Application;
}

/**
 * Represents a user in the system.
 * This interface defines the structure of a user object, which includes
 * various properties related to the user's identity and account details.
 */
export interface User {
  /**
   * The unique identifier of the user.
   * This is typically a UUID or a database-generated ID.
   */
  id: string;

  /**
   * The email address of the user.
   * This property is used for communication and authentication purposes.
   */
  email: string;

  /**
   * The name of the user.
   * This property represents the full name of the user.
   */
  name: string;

  /**
   * The Discord username of the user.
   * This property is used to link the user's account with their Discord profile.
   */
  discord: {
    id: string;
    avatar: string;
    username: string,
    global_name: string;
  }

  /**
   * The hashed password of the user.
   * This property stores the user's password in a secure, hashed format.
   */
  password: string;

  /**
   * The role of the user in the system.
   * This property defines the user's permissions and access level.
   */
  rol: string;

  /**
   * The date and time when the user was created.
   * This property is typically set automatically when the user is registered.
   */
  createdAt: Date;
}

/**
 * Represents the input required for a login operation.
 * This interface defines the structure of the object used to authenticate a user.
 */
interface LoginInput {
  /**
   * The email address of the user attempting to log in.
   */
  email: string;

  /**
   * The password of the user attempting to log in.
   */
  password: string;
}

/**
 * Represents the input required for a registration operation.
 * Extends the LoginInput interface to include additional fields needed for registration.
 */
interface RegisterInput extends LoginInput {
  /**
   * The name of the user registering.
   * This property is required to create a new user account.
   */
  name: string;

  /**
   * Additional fields required for registration.
   * This can include optional or custom fields specific to the application.
   */
  // otros campos necesarios
}

/**
 * Represents the input required to update a user's information.
 * Extends a partial version of the RegisterInput interface, allowing for
 * optional updates to specific fields.
 */
interface UpdateInput extends Partial<RegisterInput> {
  /**
   * The unique identifier of the user to be updated.
   * This property is required to identify the user whose information is being modified.
   */
  id: string;
}

/**
 * Represents a field used in various contexts, such as forms or UI components.
 * This interface defines the structure of a field object, which includes
 * properties for the field's name, value, and display options.
 */
export interface Fields {
  /**
   * The name of the field.
   * This property identifies the field and is typically used as a key.
   */
  name: string;

  /**
   * The value of the field.
   * This property stores the data associated with the field.
   */
  value: string;

  /**
   * Whether the field should be displayed inline.
   * This property is optional and can be used to control the field's layout.
   */
  inline?: boolean;
}

/**
 * Represents a GitHub user.
 * This interface defines the structure of a GitHub user object, which includes
 * various properties related to the user's profile and activity on GitHub.
 */
interface GitHubUser {
  /**
   * The username of the GitHub user.
   */
  login: string;

  /**
   * The unique identifier of the GitHub user.
   */
  id: number;

  /**
   * The URL of the user's avatar image.
   */
  avatar_url: string;

  /**
   * The URL of the user's GitHub profile.
   */
  html_url: string;

  /**
   * The full name of the GitHub user.
   */
  name: string;

  /**
   * The company the user is associated with.
   */
  company: string;

  /**
   * The user's blog or personal website URL.
   */
  blog: string;

  /**
   * The location of the user.
   */
  location: string;

  /**
   * The email address of the user, if available.
   */
  email: string | null;

  /**
   * The biography of the user.
   */
  bio: string;

  /**
   * The Twitter username of the user, if available.
   */
  twitter_username: string | null;

  /**
   * The number of public repositories owned by the user.
   */
  public_repos: number;

  /**
   * The number of public gists owned by the user.
   */
  public_gists: number;

  /**
   * The number of followers the user has.
   */
  followers: number;

  /**
   * The number of users the user is following.
   */
  following: number;

  /**
   * The date and time when the user's account was created.
   */
  created_at: string;

  /**
   * The date and time when the user's profile was last updated.
   */
  updated_at: string;
}

interface GitHubRepo {
  id: number;
  name: string;
  full_name: string;
  private: boolean;
  owner: GitHubUser;
  html_url: string;
  description: string | null;
  fork: boolean;
  url: string;
  created_at: string;
  updated_at: string;
  pushed_at: string;
  git_url: string;
  ssh_url: string;
  clone_url: string;
  svn_url: string;
  homepage: string | null;
  size: number;
  stargazers_count: number;
  watchers_count: number;
  language: string | null;
  forks_count: number;
  open_issues_count: number;
  license: {
    key: string;
    name: string;
    spdx_id: string;
    url: string;
    node_id: string;
  } | null;
  topics: string[];
  visibility: string;
  default_branch: string;
}

interface GitHubEvent {
  id: string;
  type: string;
  actor: {
    id: number;
    login: string;
    avatar_url: string;
  };
  repo: {
    id: number;
    name: string;
    url: string;
  };
  payload: any;
  public: boolean;
  created_at: string;
}

interface GitHubOrganization {
  login: string;
  id: number;
  url: string;
  avatar_url: string;
  description: string | null;
}

interface GitHubFollower {
  login: string;
  id: number;
  avatar_url: string;
  html_url: string;
}

interface GitHubGist {
  id: string;
  html_url: string;
  files: Record<
    string,
    {
      filename: string;
      type: string;
      language: string;
      size: number;
      content?: string;
    }
  >;
  public: boolean;
  created_at: string;
  updated_at: string;
  description: string | null;
}

export interface RecentLogFile {
  filename: string;
  path: string;
  lastModified: string;
  size: string;
}

export interface LogFile {
  filename: string;
  path: string;
  lastModified: string;
  size: string;
}

export interface LogEntry {
  timestamp: string;
  level: string;
  message: string;
  category?: string;
}

/**
 * Represents the options for a button component.
 * This interface defines the structure of a button object, which includes
 * properties for the button's label, style, and optional disabled state.
 */
export interface ButtonOptions {
  /**
   * The text label displayed on the button.
   * This property is required and represents the button's main identifier.
   */
  label: string;

  /**
   * The visual style of the button.
   * This property determines the button's appearance and is required.
   */
  style: ButtonStyle;

  /**
   * Indicates whether the button is disabled.
   * If true, the button will be non-interactive. This property is optional.
   */
  disabled?: boolean;
}

/**
 * Represents the set of buttons used for pagination controls.
 * This interface defines the structure of an object containing buttons
 * for navigating through paginated content.
 */
export interface PaginationButtons {
  /**
   * The button used to navigate to the first page.
   */
  first: ButtonOptions;

  /**
   * The button used to navigate to the previous page.
   */
  previous: ButtonOptions;

  /**
   * The button used to display the current page index.
   */
  index: ButtonOptions;

  /**
   * The button used to navigate to the next page.
   */
  next: ButtonOptions;

  /**
   * The button used to navigate to the last page.
   */
  last: ButtonOptions;
}

/**
 * Represents the options for configuring pagination behavior.
 * This interface defines the structure of an object used to customize
 * pagination functionality, including methods, button configurations, and index handling.
 */
export interface PaginationOptions {
  /**
   * The method used to handle pagination.
   * - "addEmbeds": Adds embeds to the existing content.
   * - "createPages": Creates separate pages for the content.
   * - null: No specific pagination method is applied.
   */
  method: "addEmbeds" | "createPages" | null;

  /**
   * Determines whether the current page index should be preserved.
   * If true, the index will remain consistent across pagination actions.
   */
  keepIndex: boolean;

  /**
   * The set of buttons used for pagination controls.
   * This property defines the navigation buttons for the pagination interface.
   */
  buttons: PaginationButtons;
}

/**
 * Represents the context for logging operations.
 * This interface defines the structure of an object used to provide
 * additional context information for log entries, such as user and session details.
 */
export interface LogContext {
  /**
   * The unique identifier of the user associated with the log entry.
   * This property is optional and can be used to trace user-specific actions.
   */
  userId?: string;

  /**
   * The unique identifier of the session associated with the log entry.
   * This property is optional and can be used to trace session-specific actions.
   */
  sessionId?: string;

  /**
   * The unique identifier of the request associated with the log entry.
   * This property is optional and can be used for tracing and debugging purposes.
   */
  requestId?: string;

  /**
   * Additional custom properties for the log context.
   * This property allows for the inclusion of arbitrary key-value pairs
   * to provide more detailed context for the log entry.
   */
  [key: string]: any;
}
