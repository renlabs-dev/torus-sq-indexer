// Auto-generated , DO NOT EDIT
import {Entity, FunctionPropertyNames, FieldsExpression, GetOptions } from "@subql/types-core";
import assert from 'assert';



export type AccountProps = Omit<Account, NonNullable<FunctionPropertyNames<Account>> | '_name'>;

/*
 * Compat types allows for support of alternative `id` types without refactoring the node
 */
type CompatAccountProps = Omit<AccountProps, 'id'> & { id: string; };
type CompatEntity = Omit<Entity, 'id'> & { id: string; };

export class Account implements CompatEntity {

    constructor(
        
        id: string,
        address: string,
        createdAt: number,
        updatedAt: number,
        balance_free: bigint,
        balance_staked: bigint,
        balance_total: bigint,
    ) {
        this.id = id;
        this.address = address;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
        this.balance_free = balance_free;
        this.balance_staked = balance_staked;
        this.balance_total = balance_total;
        
    }

    public id: string;
    public address: string;
    public createdAt: number;
    public updatedAt: number;
    public balance_free: bigint;
    public balance_staked: bigint;
    public balance_total: bigint;
    

    get _name(): string {
        return 'Account';
    }

    async save(): Promise<void> {
        const id = this.id;
        assert(id !== null, "Cannot save Account entity without an ID");
        await store.set('Account', id.toString(), this as unknown as CompatAccountProps);
    }

    static async remove(id: string): Promise<void> {
        assert(id !== null, "Cannot remove Account entity without an ID");
        await store.remove('Account', id.toString());
    }

    static async get(id: string): Promise<Account | undefined> {
        assert((id !== null && id !== undefined), "Cannot get Account entity without an ID");
        const record = await store.get('Account', id.toString());
        if (record) {
            return this.create(record as unknown as AccountProps);
        } else {
            return;
        }
    }

    static async getByAddress(address: string, options: GetOptions<CompatAccountProps>): Promise<Account[]> {
        // Inputs must be cast as the store interface has not been updated to support alternative ID types
        const records = await store.getByField<CompatAccountProps>('Account', 'address', address, options);
        return records.map(record => this.create(record as unknown as AccountProps));
    }
    

    static async getByCreatedAt(createdAt: number, options: GetOptions<CompatAccountProps>): Promise<Account[]> {
        // Inputs must be cast as the store interface has not been updated to support alternative ID types
        const records = await store.getByField<CompatAccountProps>('Account', 'createdAt', createdAt, options);
        return records.map(record => this.create(record as unknown as AccountProps));
    }
    

    static async getByUpdatedAt(updatedAt: number, options: GetOptions<CompatAccountProps>): Promise<Account[]> {
        // Inputs must be cast as the store interface has not been updated to support alternative ID types
        const records = await store.getByField<CompatAccountProps>('Account', 'updatedAt', updatedAt, options);
        return records.map(record => this.create(record as unknown as AccountProps));
    }
    

    static async getByBalance_free(balance_free: bigint, options: GetOptions<CompatAccountProps>): Promise<Account[]> {
        // Inputs must be cast as the store interface has not been updated to support alternative ID types
        const records = await store.getByField<CompatAccountProps>('Account', 'balance_free', balance_free, options);
        return records.map(record => this.create(record as unknown as AccountProps));
    }
    

    static async getByBalance_staked(balance_staked: bigint, options: GetOptions<CompatAccountProps>): Promise<Account[]> {
        // Inputs must be cast as the store interface has not been updated to support alternative ID types
        const records = await store.getByField<CompatAccountProps>('Account', 'balance_staked', balance_staked, options);
        return records.map(record => this.create(record as unknown as AccountProps));
    }
    

    static async getByBalance_total(balance_total: bigint, options: GetOptions<CompatAccountProps>): Promise<Account[]> {
        // Inputs must be cast as the store interface has not been updated to support alternative ID types
        const records = await store.getByField<CompatAccountProps>('Account', 'balance_total', balance_total, options);
        return records.map(record => this.create(record as unknown as AccountProps));
    }
    


    /**
     * Gets entities matching the specified filters and options.
     *
     * ⚠️ This function will first search cache data followed by DB data. Please consider this when using order and offset options.⚠️
     * */
    static async getByFields(filter: FieldsExpression<AccountProps>[], options: GetOptions<AccountProps>): Promise<Account[]> {
        const records = await store.getByFields<CompatAccountProps>('Account', filter  as unknown as FieldsExpression<CompatAccountProps>[], options as unknown as GetOptions<CompatAccountProps>);
        return records.map(record => this.create(record as unknown as AccountProps));
    }

    static create(record: AccountProps): Account {
        assert(record.id !== undefined && record.id !== null, "id must be provided");
        const entity = new this(
            record.id,
            record.address,
            record.createdAt,
            record.updatedAt,
            record.balance_free,
            record.balance_staked,
            record.balance_total,
        );
        Object.assign(entity,record);
        return entity;
    }
}
