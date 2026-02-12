export const demoInstances: string[] = [
  'mastodon.social',
  'fosstodon.org',
  'techhub.social',
  'infosec.exchange',
  'mas.to',
];

export class InstanceApi {
  #baseUrl: string;

  /**
   * @param name The instance name or domain (e.g., "mastodon.social" or "techhub.social")
   */
  constructor(name: string) {
    // 1. Remove any existing http/https prefix to standardize
    let domain = name.replace(/^https?:\/\//, '');
    // 2. Remove trailing slashes
    domain = domain.replace(/\/$/, '');
    // 3. Build the final secure URL
    this.#baseUrl = `https://${domain}`;
  }

  toString() {
    return this.#baseUrl;
  }

  /**
   * Standardized call to retrieve public instance metadata.
   */
  async getMeta() {
    const endpoint = `${this.#baseUrl}/api/v1/instance`;

    const response = await fetch(endpoint);
    if (!response.ok) {
      throw new Error(`Could not reach instance "${this.#baseUrl}": ${response.statusText}`);
    }

    const data = await response.json();

    return {
      title: data.title,
      version: data.version,
      userCount: data.stats.user_count,
      description: data.short_description,
    };
  }
}
