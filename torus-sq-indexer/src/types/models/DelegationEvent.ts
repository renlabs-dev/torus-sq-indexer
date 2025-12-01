// Auto-generated , DO NOT EDIT
import {Entity, FunctionPropertyNames, FieldsExpression, GetOptions } from "@subql/types-core";
import assert from 'assert';


import {
    DelegateAction,
} from '../enums';

export type DelegationEventProps = Omit<DelegationEvent, NonNullable<FunctionPropertyNames<DelegationEvent>> | '_name'>;

/*
 * Compat types allows for support of alternative `id` types without refactoring the node
 */
type CompatDelegationEventProps = Omit<DelegationEventProps, 'id'> & { id: string; };
type CompatEntity = Omit<Entity, 'id'> & { id: string; };

export class DelegationEvent implements CompatEntity {

    constructor(
        
        id: string,
        height: number,
        extrinsicId: number,
        account: string,
        agent: string,
        amount: bigint,
        action: DelegateAction,
    ) {
        this.id = id;
        this.height = height;
        this.extrinsicId = extrinsicId;
        this.account = account;
        this.agent = agent;
        this.amount = amount;
        this.action = action;
        
    }

    public id: string;
    public height: number;
    public extrinsicId: number;
    public account: string;
    public agent: string;
    public amount: bigint;
    public action: DelegateAction;
    

    get _name(): string {
        return 'DelegationEvent';
    }

    async save(): Promise<void> {
        const id = this.id;
        assert(id !== null, "Cannot save DelegationEvent entity without an ID");
        await store.set('DelegationEvent', id.toString(), this as unknown as CompatDelegationEventProps);
    }

    static async remove(id: string): Promise<void> {
        assert(id !== null, "Cannot remove DelegationEvent entity without an ID");
        await store.remove('DelegationEvent', id.toString());
    }

    static async get(id: string): Promise<DelegationEvent | undefined> {
        assert((id !== null && id !== undefined), "Cannot get DelegationEvent entity without an ID");
        const record = await store.get('DelegationEvent', id.toString());
        if (record) {
            return this.create(record as unknown as DelegationEventProps);
        } else {
            return;
        }
    }

    static async getByHeight(height: number, options: GetOptions<CompatDelegationEventProps>): Promise<DelegationEvent[]> {
        // Inputs must be cast as the store interface has not been updated to support alternative ID types
        const records = await store.getByField<CompatDelegationEventProps>('DelegationEvent', 'height', height, options);
        return records.map(record => this.create(record as unknown as DelegationEventProps));
    }
    

    static async getByAgent(agent: string, options: GetOptions<CompatDelegationEventProps>): Promise<DelegationEvent[]> {
        // Inputs must be cast as the store interface has not been updated to support alternative ID types
        const records = await store.getByField<CompatDelegationEventProps>('DelegationEvent', 'agent', agent, options);
        return records.map(record => this.create(record as unknown as DelegationEventProps));
    }
    

    static async getByAmount(amount: bigint, options: GetOptions<CompatDelegationEventProps>): Promise<DelegationEvent[]> {
        // Inputs must be cast as the store interface has not been updated to support alternative ID types
        const records = await store.getByField<CompatDelegationEventProps>('DelegationEvent', 'amount', amount, options);
        return records.map(record => this.create(record as unknown as DelegationEventProps));
    }
    


    /**
     * Gets entities matching the specified filters and options.
     *
     * ⚠️ This function will first search cache data followed by DB data. Please consider this when using order and offset options.⚠️
     * */
    static async getByFields(filter: FieldsExpression<DelegationEventProps>[], options: GetOptions<DelegationEventProps>): Promise<DelegationEvent[]> {
        const records = await store.getByFields<CompatDelegationEventProps>('DelegationEvent', filter  as unknown as FieldsExpression<CompatDelegationEventProps>[], options as unknown as GetOptions<CompatDelegationEventProps>);
        return records.map(record => this.create(record as unknown as DelegationEventProps));
    }

    static create(record: DelegationEventProps): DelegationEvent {
        assert(record.id !== undefined && record.id !== null, "id must be provided");
        const entity = new this(
            record.id,
            record.height,
            record.extrinsicId,
            record.account,
            record.agent,
            record.amount,
            record.action,
        );
        Object.assign(entity,record);
        return entity;
    }
}
