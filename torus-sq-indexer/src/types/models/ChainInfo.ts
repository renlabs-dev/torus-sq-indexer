// Auto-generated , DO NOT EDIT
import {Entity, FunctionPropertyNames, FieldsExpression, GetOptions } from "@subql/types-core";
import assert from 'assert';



export type ChainInfoProps = Omit<ChainInfo, NonNullable<FunctionPropertyNames<ChainInfo>> | '_name'>;

/*
 * Compat types allows for support of alternative `id` types without refactoring the node
 */
type CompatChainInfoProps = Omit<ChainInfoProps, 'id'> & { id: string; };
type CompatEntity = Omit<Entity, 'id'> & { id: string; };

export class ChainInfo implements CompatEntity {

    constructor(
        
        id: string,
        value: string,
        updatedAt: Date,
    ) {
        this.id = id;
        this.value = value;
        this.updatedAt = updatedAt;
        
    }

    public id: string;
    public value: string;
    public updatedAt: Date;
    

    get _name(): string {
        return 'ChainInfo';
    }

    async save(): Promise<void> {
        const id = this.id;
        assert(id !== null, "Cannot save ChainInfo entity without an ID");
        await store.set('ChainInfo', id.toString(), this as unknown as CompatChainInfoProps);
    }

    static async remove(id: string): Promise<void> {
        assert(id !== null, "Cannot remove ChainInfo entity without an ID");
        await store.remove('ChainInfo', id.toString());
    }

    static async get(id: string): Promise<ChainInfo | undefined> {
        assert((id !== null && id !== undefined), "Cannot get ChainInfo entity without an ID");
        const record = await store.get('ChainInfo', id.toString());
        if (record) {
            return this.create(record as unknown as ChainInfoProps);
        } else {
            return;
        }
    }


    /**
     * Gets entities matching the specified filters and options.
     *
     * ⚠️ This function will first search cache data followed by DB data. Please consider this when using order and offset options.⚠️
     * */
    static async getByFields(filter: FieldsExpression<ChainInfoProps>[], options: GetOptions<ChainInfoProps>): Promise<ChainInfo[]> {
        const records = await store.getByFields<CompatChainInfoProps>('ChainInfo', filter  as unknown as FieldsExpression<CompatChainInfoProps>[], options as unknown as GetOptions<CompatChainInfoProps>);
        return records.map(record => this.create(record as unknown as ChainInfoProps));
    }

    static create(record: ChainInfoProps): ChainInfo {
        assert(record.id !== undefined && record.id !== null, "id must be provided");
        const entity = new this(
            record.id,
            record.value,
            record.updatedAt,
        );
        Object.assign(entity,record);
        return entity;
    }
}
