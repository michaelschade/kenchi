/**
 * Factory base class. Extend this class to create factory function;
 * For example:
 * export default new (class extends Factory<InputParams, CreatedModel>({
 *  defaults() {
 *      return {name: 'Hello Dave'}
 *  }
 *  persist(createParams: InputParams) {
 *      return db.myModel.create({data: createParams}))
 *  }
 * })();
 * @template TCreateParams The creation params for the DB create
 * @template TCreatedObject The object the factory builds
 */

import { times } from 'lodash';

export default abstract class Factory<TCreateParams, TCreatedObject> {
  protected sequence: number = 1;
  abstract defaults(opts: {
    sequence: number;
    params: Partial<TCreateParams>;
  }): TCreateParams | Promise<TCreateParams>;
  abstract persist(createParams: TCreateParams): Promise<TCreatedObject>;
  async createParams(
    overrides?: Partial<TCreateParams>
  ): Promise<TCreateParams> {
    return {
      ...(await this.defaults({
        sequence: this.sequence++,
        params: overrides || {},
      })),
      ...overrides,
    };
  }
  async create(overrides?: Partial<TCreateParams>): Promise<TCreatedObject> {
    const createParams = this.createParams(overrides);
    return this.persist(await createParams);
  }

  async createList(
    count: number,
    overrides?: Partial<TCreateParams>
  ): Promise<TCreatedObject[]> {
    const allCreateParams = times(count, (_) => this.createParams(overrides));
    return Promise.all(
      allCreateParams.map(async (params) => this.persist(await params))
    );
  }
}
