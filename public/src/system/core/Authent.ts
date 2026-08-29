import { IRegistry } from "./Registry";

export const DEFAULT_USERS_REGKEY = "System/Users";

/**
 * The primary authentication subsystem for ExperienceOS.
 */
export default class Authent implements IAuthentication {
	private _registry: IRegistry;
	private _usersRegKey: string;
	private _activeUser: IUserData | null;

	public constructor(registry: IRegistry) {
		this._registry = registry;
		this._usersRegKey = DEFAULT_USERS_REGKEY;
		this._activeUser = null;
	}

	public login(username: string, passwordHash: string): boolean {
		const userRegKey = this._usersRegKey + "/" + username;
		const userExists = this._registry.groupExists(userRegKey);

		if (!userExists)
			throw new AuthenticationError("User does not exist.");

		let regUser: IRegUser;
		try {
			regUser = {
				username: this._registry.getNodeValue(userRegKey + "/username"),
				passwordHash: this._registry.getNodeValue(userRegKey + "/passwordHash"),
			};
		} catch {
			throw new AuthenticationError("Potentially corrupted user profile.");
		}

		if (regUser.passwordHash !== passwordHash)
			return false;

		this._activeUser = {
			username: regUser.username,
			loginTime: Date.now(),
		};

		return true;
	}

	public promptLogin(callback: (user?: IUserInfo) => void, required?: boolean): void {
		throw new AuthenticationError("NOT_IMPLEMENTED");
	}

	public logout(): void {
		this._activeUser = null;
	}

	public userExists(username: string): boolean {
		const userRegKey = this._usersRegKey + "/" + username;
		return this._registry.groupExists(userRegKey);
	}

	public getUsernameList(): string[] {
		throw new AuthenticationError("NOT_IMPLEMENTED");
	}

	public getCurrentUserInfo(): IUserInfo | null {
		return !this._activeUser ? null : {
			username: this._activeUser.username,
			uptime: Date.now() - this._activeUser.loginTime,
		};
	}
}

export class AuthenticationError extends Error {
	public constructor(message?: string, options?: ErrorOptions) {
		super(message, options);
	}
}

export interface IAuthentication {
	/**
	 * Forcefully logs in the user
	 * @returns A boolean indicating if the login completed.
	 * @throws If the username is invalid or if the login failed.
	 */
	login(username: string, passwordHash: string): boolean;

	/**
	 * Triggers a login screen for the user.
	 * @param callback Called when the login screen has completed, and receives `undefined` if the user didn't login.
	 * @param required Whether the user is required to log in to continue operating the system.
	 * @throws If the login prompt cannot be shown, or if something else fails.
	 */
	promptLogin(callback: (user?: IUserInfo) => void, required?: boolean): void;

	/**
	 * Forcefully logs out the user.
	 * @throws If something goes wrong during the logout.
	 */
	logout(): void;

	/**
	 * Returns a boolean indicating if the specified username points to a valid user.
	 */
	userExists(username: string): boolean;

	/**
	 * Gets a list of valid usernames on the system.
	 */
	getUsernameList(): string[];

	/**
	 * Gets the current, active user info.
	 * @returns `null` if no user is logged in.
	 */
	getCurrentUserInfo(): IUserInfo | null;
}

export interface IRegUser {
	username: string;
	passwordHash: string;
	avatarImagePath?: string;
	domain?: string;
	userRoot?: string;
}

export interface IUserInfo {
	username: string;
	uptime: number;
}

export interface IUserData {
	username: string;
	loginTime: number;
}