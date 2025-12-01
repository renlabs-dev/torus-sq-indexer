// Auto-generated , DO NOT EDIT
import {Entity, FunctionPropertyNames, FieldsExpression, GetOptions } from "@subql/types-core";
import assert from 'assert';



export type AgentProps = Omit<Agent, NonNullable<FunctionPropertyNames<Agent>> | '_name'>;

/*
 * Compat types allows for support of alternative `id` types without refactoring the node
 */
type CompatAgentProps = Omit<AgentProps, 'id'> & { id: string; };
type CompatEntity = Omit<Entity, 'id'> & { id: string; };

export class Agent implements CompatEntity {

    constructor(
        
        id: string,
        registeredAt: number,
        timestamp: Date,
        extrinsicId: number,
        metadata: string,
        url: string,
        stakingFee: string,
        weightControlFee: string,
        weightPenaltyFactor: string,
        name: string,
    ) {
        this.id = id;
        this.registeredAt = registeredAt;
        this.timestamp = timestamp;
        this.extrinsicId = extrinsicId;
        this.metadata = metadata;
        this.url = url;
        this.stakingFee = stakingFee;
        this.weightControlFee = weightControlFee;
        this.weightPenaltyFactor = weightPenaltyFactor;
        this.name = name;
        
    }

    public id: string;
    public registeredAt: number;
    public timestamp: Date;
    public extrinsicId: number;
    public metadata: string;
    public url: string;
    public stakingFee: string;
    public weightControlFee: string;
    public weightPenaltyFactor: string;
    public name: string;
    

    get _name(): string {
        return 'Agent';
    }

    async save(): Promise<void> {
        const id = this.id;
        assert(id !== null, "Cannot save Agent entity without an ID");
        await store.set('Agent', id.toString(), this as unknown as CompatAgentProps);
    }

    static async remove(id: string): Promise<void> {
        assert(id !== null, "Cannot remove Agent entity without an ID");
        await store.remove('Agent', id.toString());
    }

    static async get(id: string): Promise<Agent | undefined> {
        assert((id !== null && id !== undefined), "Cannot get Agent entity without an ID");
        const record = await store.get('Agent', id.toString());
        if (record) {
            return this.create(record as unknown as AgentProps);
        } else {
            return;
        }
    }

    static async getByRegisteredAt(registeredAt: number, options: GetOptions<CompatAgentProps>): Promise<Agent[]> {
        // Inputs must be cast as the store interface has not been updated to support alternative ID types
        const records = await store.getByField<CompatAgentProps>('Agent', 'registeredAt', registeredAt, options);
        return records.map(record => this.create(record as unknown as AgentProps));
    }
    

    static async getByTimestamp(timestamp: Date, options: GetOptions<CompatAgentProps>): Promise<Agent[]> {
        // Inputs must be cast as the store interface has not been updated to support alternative ID types
        const records = await store.getByField<CompatAgentProps>('Agent', 'timestamp', timestamp, options);
        return records.map(record => this.create(record as unknown as AgentProps));
    }
    

    static async getByName(name: string, options: GetOptions<CompatAgentProps>): Promise<Agent[]> {
        // Inputs must be cast as the store interface has not been updated to support alternative ID types
        const records = await store.getByField<CompatAgentProps>('Agent', 'name', name, options);
        return records.map(record => this.create(record as unknown as AgentProps));
    }
    


    /**
     * Gets entities matching the specified filters and options.
     *
     * ⚠️ This function will first search cache data followed by DB data. Please consider this when using order and offset options.⚠️
     * */
    static async getByFields(filter: FieldsExpression<AgentProps>[], options: GetOptions<AgentProps>): Promise<Agent[]> {
        const records = await store.getByFields<CompatAgentProps>('Agent', filter  as unknown as FieldsExpression<CompatAgentProps>[], options as unknown as GetOptions<CompatAgentProps>);
        return records.map(record => this.create(record as unknown as AgentProps));
    }

    static create(record: AgentProps): Agent {
        assert(record.id !== undefined && record.id !== null, "id must be provided");
        const entity = new this(
            record.id,
            record.registeredAt,
            record.timestamp,
            record.extrinsicId,
            record.metadata,
            record.url,
            record.stakingFee,
            record.weightControlFee,
            record.weightPenaltyFactor,
            record.name,
        );
        Object.assign(entity,record);
        return entity;
    }
}
