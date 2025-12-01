// Auto-generated , DO NOT EDIT
import {Entity, FunctionPropertyNames, FieldsExpression, GetOptions } from "@subql/types-core";
import assert from 'assert';



export type BridgeActionProps = Omit<BridgeAction, NonNullable<FunctionPropertyNames<BridgeAction>> | '_name'>;

/*
 * Compat types allows for support of alternative `id` types without refactoring the node
 */
type CompatBridgeActionProps = Omit<BridgeActionProps, 'id'> & { id: string; };
type CompatEntity = Omit<Entity, 'id'> & { id: string; };

export class BridgeAction implements CompatEntity {

    constructor(
        
        id: string,
        address: string,
        intermediaryAddress: string,
        amountBridged: bigint,
        toBase: boolean,
    ) {
        this.id = id;
        this.address = address;
        this.intermediaryAddress = intermediaryAddress;
        this.amountBridged = amountBridged;
        this.toBase = toBase;
        
    }

    public id: string;
    public address: string;
    public intermediaryAddress: string;
    public amountBridged: bigint;
    public toBase: boolean;
    

    get _name(): string {
        return 'BridgeAction';
    }

    async save(): Promise<void> {
        const id = this.id;
        assert(id !== null, "Cannot save BridgeAction entity without an ID");
        await store.set('BridgeAction', id.toString(), this as unknown as CompatBridgeActionProps);
    }

    static async remove(id: string): Promise<void> {
        assert(id !== null, "Cannot remove BridgeAction entity without an ID");
        await store.remove('BridgeAction', id.toString());
    }

    static async get(id: string): Promise<BridgeAction | undefined> {
        assert((id !== null && id !== undefined), "Cannot get BridgeAction entity without an ID");
        const record = await store.get('BridgeAction', id.toString());
        if (record) {
            return this.create(record as unknown as BridgeActionProps);
        } else {
            return;
        }
    }

    static async getByAddress(address: string, options: GetOptions<CompatBridgeActionProps>): Promise<BridgeAction[]> {
        // Inputs must be cast as the store interface has not been updated to support alternative ID types
        const records = await store.getByField<CompatBridgeActionProps>('BridgeAction', 'address', address, options);
        return records.map(record => this.create(record as unknown as BridgeActionProps));
    }
    

    static async getByIntermediaryAddress(intermediaryAddress: string, options: GetOptions<CompatBridgeActionProps>): Promise<BridgeAction[]> {
        // Inputs must be cast as the store interface has not been updated to support alternative ID types
        const records = await store.getByField<CompatBridgeActionProps>('BridgeAction', 'intermediaryAddress', intermediaryAddress, options);
        return records.map(record => this.create(record as unknown as BridgeActionProps));
    }
    

    static async getByAmountBridged(amountBridged: bigint, options: GetOptions<CompatBridgeActionProps>): Promise<BridgeAction[]> {
        // Inputs must be cast as the store interface has not been updated to support alternative ID types
        const records = await store.getByField<CompatBridgeActionProps>('BridgeAction', 'amountBridged', amountBridged, options);
        return records.map(record => this.create(record as unknown as BridgeActionProps));
    }
    

    static async getByToBase(toBase: boolean, options: GetOptions<CompatBridgeActionProps>): Promise<BridgeAction[]> {
        // Inputs must be cast as the store interface has not been updated to support alternative ID types
        const records = await store.getByField<CompatBridgeActionProps>('BridgeAction', 'toBase', toBase, options);
        return records.map(record => this.create(record as unknown as BridgeActionProps));
    }
    


    /**
     * Gets entities matching the specified filters and options.
     *
     * ⚠️ This function will first search cache data followed by DB data. Please consider this when using order and offset options.⚠️
     * */
    static async getByFields(filter: FieldsExpression<BridgeActionProps>[], options: GetOptions<BridgeActionProps>): Promise<BridgeAction[]> {
        const records = await store.getByFields<CompatBridgeActionProps>('BridgeAction', filter  as unknown as FieldsExpression<CompatBridgeActionProps>[], options as unknown as GetOptions<CompatBridgeActionProps>);
        return records.map(record => this.create(record as unknown as BridgeActionProps));
    }

    static create(record: BridgeActionProps): BridgeAction {
        assert(record.id !== undefined && record.id !== null, "id must be provided");
        const entity = new this(
            record.id,
            record.address,
            record.intermediaryAddress,
            record.amountBridged,
            record.toBase,
        );
        Object.assign(entity,record);
        return entity;
    }
}
