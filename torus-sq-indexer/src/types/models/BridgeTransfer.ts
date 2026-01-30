// Auto-generated , DO NOT EDIT
import {Entity, FunctionPropertyNames, FieldsExpression, GetOptions } from "@subql/types-core";
import assert from 'assert';



export type BridgeTransferProps = Omit<BridgeTransfer, NonNullable<FunctionPropertyNames<BridgeTransfer>> | '_name'>;

/*
 * Compat types allows for support of alternative `id` types without refactoring the node
 */
type CompatBridgeTransferProps = Omit<BridgeTransferProps, 'id'> & { id: string; };
type CompatEntity = Omit<Entity, 'id'> & { id: string; };

export class BridgeTransfer implements CompatEntity {

    constructor(
        
        id: string,
        evmAddress: string,
        address: string,
        intermediaryAddress: string,
        amountBridged: bigint,
        toBase: boolean,
    ) {
        this.id = id;
        this.evmAddress = evmAddress;
        this.address = address;
        this.intermediaryAddress = intermediaryAddress;
        this.amountBridged = amountBridged;
        this.toBase = toBase;
        
    }

    public id: string;
    public evmAddress: string;
    public address: string;
    public intermediaryAddress: string;
    public amountBridged: bigint;
    public toBase: boolean;
    

    get _name(): string {
        return 'BridgeTransfer';
    }

    async save(): Promise<void> {
        const id = this.id;
        assert(id !== null, "Cannot save BridgeTransfer entity without an ID");
        await store.set('BridgeTransfer', id.toString(), this as unknown as CompatBridgeTransferProps);
    }

    static async remove(id: string): Promise<void> {
        assert(id !== null, "Cannot remove BridgeTransfer entity without an ID");
        await store.remove('BridgeTransfer', id.toString());
    }

    static async get(id: string): Promise<BridgeTransfer | undefined> {
        assert((id !== null && id !== undefined), "Cannot get BridgeTransfer entity without an ID");
        const record = await store.get('BridgeTransfer', id.toString());
        if (record) {
            return this.create(record as unknown as BridgeTransferProps);
        } else {
            return;
        }
    }

    static async getByEvmAddress(evmAddress: string, options: GetOptions<CompatBridgeTransferProps>): Promise<BridgeTransfer[]> {
        // Inputs must be cast as the store interface has not been updated to support alternative ID types
        const records = await store.getByField<CompatBridgeTransferProps>('BridgeTransfer', 'evmAddress', evmAddress, options);
        return records.map(record => this.create(record as unknown as BridgeTransferProps));
    }
    

    static async getByAddress(address: string, options: GetOptions<CompatBridgeTransferProps>): Promise<BridgeTransfer[]> {
        // Inputs must be cast as the store interface has not been updated to support alternative ID types
        const records = await store.getByField<CompatBridgeTransferProps>('BridgeTransfer', 'address', address, options);
        return records.map(record => this.create(record as unknown as BridgeTransferProps));
    }
    

    static async getByIntermediaryAddress(intermediaryAddress: string, options: GetOptions<CompatBridgeTransferProps>): Promise<BridgeTransfer[]> {
        // Inputs must be cast as the store interface has not been updated to support alternative ID types
        const records = await store.getByField<CompatBridgeTransferProps>('BridgeTransfer', 'intermediaryAddress', intermediaryAddress, options);
        return records.map(record => this.create(record as unknown as BridgeTransferProps));
    }
    

    static async getByAmountBridged(amountBridged: bigint, options: GetOptions<CompatBridgeTransferProps>): Promise<BridgeTransfer[]> {
        // Inputs must be cast as the store interface has not been updated to support alternative ID types
        const records = await store.getByField<CompatBridgeTransferProps>('BridgeTransfer', 'amountBridged', amountBridged, options);
        return records.map(record => this.create(record as unknown as BridgeTransferProps));
    }
    

    static async getByToBase(toBase: boolean, options: GetOptions<CompatBridgeTransferProps>): Promise<BridgeTransfer[]> {
        // Inputs must be cast as the store interface has not been updated to support alternative ID types
        const records = await store.getByField<CompatBridgeTransferProps>('BridgeTransfer', 'toBase', toBase, options);
        return records.map(record => this.create(record as unknown as BridgeTransferProps));
    }
    


    /**
     * Gets entities matching the specified filters and options.
     *
     * ⚠️ This function will first search cache data followed by DB data. Please consider this when using order and offset options.⚠️
     * */
    static async getByFields(filter: FieldsExpression<BridgeTransferProps>[], options: GetOptions<BridgeTransferProps>): Promise<BridgeTransfer[]> {
        const records = await store.getByFields<CompatBridgeTransferProps>('BridgeTransfer', filter  as unknown as FieldsExpression<CompatBridgeTransferProps>[], options as unknown as GetOptions<CompatBridgeTransferProps>);
        return records.map(record => this.create(record as unknown as BridgeTransferProps));
    }

    static create(record: BridgeTransferProps): BridgeTransfer {
        assert(record.id !== undefined && record.id !== null, "id must be provided");
        const entity = new this(
            record.id,
            record.evmAddress,
            record.address,
            record.intermediaryAddress,
            record.amountBridged,
            record.toBase,
        );
        Object.assign(entity,record);
        return entity;
    }
}
