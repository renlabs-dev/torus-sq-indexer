// Auto-generated , DO NOT EDIT
import {Entity, FunctionPropertyNames, FieldsExpression, GetOptions } from "@subql/types-core";
import assert from 'assert';



export type ExtrinsicProps = Omit<Extrinsic, NonNullable<FunctionPropertyNames<Extrinsic>> | '_name'>;

/*
 * Compat types allows for support of alternative `id` types without refactoring the node
 */
type CompatExtrinsicProps = Omit<ExtrinsicProps, 'id'> & { id: string; };
type CompatEntity = Omit<Entity, 'id'> & { id: string; };

export class Extrinsic implements CompatEntity {

    constructor(
        
        id: string,
        module: string,
        method: string,
        blockNumber: number,
        extrinsicId: number,
        tip: bigint,
        version: number,
        signer: string,
        success: boolean,
        hash: string,
        args: string,
    ) {
        this.id = id;
        this.module = module;
        this.method = method;
        this.blockNumber = blockNumber;
        this.extrinsicId = extrinsicId;
        this.tip = tip;
        this.version = version;
        this.signer = signer;
        this.success = success;
        this.hash = hash;
        this.args = args;
        
    }

    public id: string;
    public module: string;
    public method: string;
    public blockNumber: number;
    public extrinsicId: number;
    public tip: bigint;
    public version: number;
    public signer: string;
    public success: boolean;
    public hash: string;
    public args: string;
    

    get _name(): string {
        return 'Extrinsic';
    }

    async save(): Promise<void> {
        const id = this.id;
        assert(id !== null, "Cannot save Extrinsic entity without an ID");
        await store.set('Extrinsic', id.toString(), this as unknown as CompatExtrinsicProps);
    }

    static async remove(id: string): Promise<void> {
        assert(id !== null, "Cannot remove Extrinsic entity without an ID");
        await store.remove('Extrinsic', id.toString());
    }

    static async get(id: string): Promise<Extrinsic | undefined> {
        assert((id !== null && id !== undefined), "Cannot get Extrinsic entity without an ID");
        const record = await store.get('Extrinsic', id.toString());
        if (record) {
            return this.create(record as unknown as ExtrinsicProps);
        } else {
            return;
        }
    }

    static async getByMethod(method: string, options: GetOptions<CompatExtrinsicProps>): Promise<Extrinsic[]> {
        // Inputs must be cast as the store interface has not been updated to support alternative ID types
        const records = await store.getByField<CompatExtrinsicProps>('Extrinsic', 'method', method, options);
        return records.map(record => this.create(record as unknown as ExtrinsicProps));
    }
    

    static async getByBlockNumber(blockNumber: number, options: GetOptions<CompatExtrinsicProps>): Promise<Extrinsic[]> {
        // Inputs must be cast as the store interface has not been updated to support alternative ID types
        const records = await store.getByField<CompatExtrinsicProps>('Extrinsic', 'blockNumber', blockNumber, options);
        return records.map(record => this.create(record as unknown as ExtrinsicProps));
    }
    

    static async getByExtrinsicId(extrinsicId: number, options: GetOptions<CompatExtrinsicProps>): Promise<Extrinsic[]> {
        // Inputs must be cast as the store interface has not been updated to support alternative ID types
        const records = await store.getByField<CompatExtrinsicProps>('Extrinsic', 'extrinsicId', extrinsicId, options);
        return records.map(record => this.create(record as unknown as ExtrinsicProps));
    }
    

    static async getBySigner(signer: string, options: GetOptions<CompatExtrinsicProps>): Promise<Extrinsic[]> {
        // Inputs must be cast as the store interface has not been updated to support alternative ID types
        const records = await store.getByField<CompatExtrinsicProps>('Extrinsic', 'signer', signer, options);
        return records.map(record => this.create(record as unknown as ExtrinsicProps));
    }
    

    static async getByHash(hash: string, options: GetOptions<CompatExtrinsicProps>): Promise<Extrinsic[]> {
        // Inputs must be cast as the store interface has not been updated to support alternative ID types
        const records = await store.getByField<CompatExtrinsicProps>('Extrinsic', 'hash', hash, options);
        return records.map(record => this.create(record as unknown as ExtrinsicProps));
    }
    


    /**
     * Gets entities matching the specified filters and options.
     *
     * ⚠️ This function will first search cache data followed by DB data. Please consider this when using order and offset options.⚠️
     * */
    static async getByFields(filter: FieldsExpression<ExtrinsicProps>[], options: GetOptions<ExtrinsicProps>): Promise<Extrinsic[]> {
        const records = await store.getByFields<CompatExtrinsicProps>('Extrinsic', filter  as unknown as FieldsExpression<CompatExtrinsicProps>[], options as unknown as GetOptions<CompatExtrinsicProps>);
        return records.map(record => this.create(record as unknown as ExtrinsicProps));
    }

    static create(record: ExtrinsicProps): Extrinsic {
        assert(record.id !== undefined && record.id !== null, "id must be provided");
        const entity = new this(
            record.id,
            record.module,
            record.method,
            record.blockNumber,
            record.extrinsicId,
            record.tip,
            record.version,
            record.signer,
            record.success,
            record.hash,
            record.args,
        );
        Object.assign(entity,record);
        return entity;
    }
}
