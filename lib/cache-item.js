class CacheItem {
  constructor(sha1, pp, fetch, args) {
    this.sha1 = sha1;
    this.pp = pp;
    this.fetch = fetch;
    this.args = args;
    this._val = null;
  }
  async refresh() {
    this._val = await this.fetch.apply(this.pp, this.args);
  }
  get val() {
    this.lastAccess = new Date();
    return this._val;
  }
}

module.exports = CacheItem;
