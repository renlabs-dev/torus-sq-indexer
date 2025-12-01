// Auto-generated , DO NOT EDIT
import {Entity, FunctionPropertyNames, FieldsExpression, GetOptions } from "@subql/types-core";
import assert from 'assert';



export type DelegateBalanceProps = Omit<DelegateBalance, NonNullable<FunctionPropertyNames<DelegateBalance>> | '_name'>;

/*
 * Compat types allows for support of alternative `id` types without refactoring the node
 */
type CompatDelegateBalanceProps = Omit<DelegateBalanceProps, 'id'> & { id: string; };
type CompatEntity = Omit<Entity, 'id'> & { id: string; };

export class DelegateBalance implements CompatEntity {

    constructor(
        
        id: string,
        lastUpdate: number,
        account: string,
        agent: string,
        amount: bigint,
    ) {
        this.id = id;
        this.lastUpdate = lastUpdate;
        this.account = account;
        this.agent = agent;
        this.amount = amount;
        
    }

    public id: string;
    public lastUpdate: number;
    public account: string;
    public agent: string;
    public amount: bigint;
    

    get _name(): string {
        return 'DelegateBalance';
    }

    async save(): Promise<void> {
        const id = this.id;
        assert(id !== null, "Cannot save DelegateBalance entity without an ID");
        await store.set('DelegateBalance', id.toString(), this as unknown as CompatDelegateBalanceProps);
    }

    static async remove(id: string): Promise<void> {
        assert(id !== null, "Cannot remove DelegateBalance entity without an ID");
        await store.remove('DelegateBalance', id.toString());
    }

    static async get(id: string): Promise<DelegateBalance | undefined> {
        assert((id !== null && id !== undefined), "Cannot get DelegateBalance entity without an ID");
        const record = await store.get('DelegateBalance', id.toString());
        if (record) {
            return this.create(record as unknown as DelegateBalanceProps);
        } else {
            return;
        }
    }

    static async getByLastUpdate(lastUpdate: number, options: GetOptions<CompatDelegateBalanceProps>): Promise<DelegateBalance[]> {
        // Inputs must be cast as the store interface has not been updated to support alternative ID types
        const records = await store.getByField<CompatDelegateBalanceProps>('DelegateBalance', 'lastUpdate', lastUpdate, options);
        return records.map(record => this.create(record as unknown as DelegateBalanceProps));
    }
    

    static async getByAccount(account: string, options: GetOptions<CompatDelegateBalanceProps>): Promise<DelegateBalance[]> {
        // Inputs must be cast as the store interface has not been updated to support alternative ID types
        const records = await store.getByField<CompatDelegateBalanceProps>('DelegateBalance', 'account', account, options);
        return records.map(record => this.create(record as unknown as DelegateBalanceProps));
    }
    

    static async getByAgent(agent: string, options: GetOptions<CompatDelegateBalanceProps>): Promise<DelegateBalance[]> {
        // Inputs must be cast as the store interface has not been updated to support alternative ID types
        const records = await store.getByField<CompatDelegateBalanceProps>('DelegateBalance', 'agent', agent, options);
        return records.map(record => this.create(record as unknown as DelegateBalanceProps));
    }
    

    static async getByAmount(amount: bigint, options: GetOptions<CompatDelegateBalanceProps>): Promise<DelegateBalance[]> {
        // Inputs must be cast as the store interface has not been updated to support alternative ID types
        const records = await store.getByField<CompatDelegateBalanceProps>('DelegateBalance', 'amount', amount, options);
        return records.map(record => this.create(record as unknown as DelegateBalanceProps));
    }
    


    /**
     * Gets entities matching the specified filters and options.
     *
     * ⚠️ This function will first search cache data followed by DB data. Please consider this when using order and offset options.⚠️
     * */
    static async getByFields(filter: FieldsExpression<DelegateBalanceProps>[], options: GetOptions<DelegateBalanceProps>): Promise<DelegateBalance[]> {
        const records = await store.getByFields<CompatDelegateBalanceProps>('DelegateBalance', filter  as unknown as FieldsExpression<CompatDelegateBalanceProps>[], options as unknown as GetOptions<CompatDelegateBalanceProps>);
        return records.map(record => this.create(record as unknown as DelegateBalanceProps));
    }

    static create(record: DelegateBalanceProps): DelegateBalance {
        assert(record.id !== undefined && record.id !== null, "id must be provided");
        const entity = new this(
            record.id,
            record.lastUpdate,
            record.account,
            record.agent,
            record.amount,
        );
        Object.assign(entity,record);
        return entity;
    }
}
