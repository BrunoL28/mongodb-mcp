import { BaseTool } from "./base/tool.js";
import { ListCollectionsTool } from "./collection/list-collections.js";
import { AnalyzeSchemaTool } from "./collection/analyze-schema.js";
import { CreateCollectionTool } from "./collection/create-collection.js";
import { DropCollectionTool } from "./collection/drop-collection.js";
import { DeleteOneTool } from "./documents/delete-one.js";
import { FindTool } from "./documents/find.js";
import { InsertOneTool } from "./documents/insert-one.js";
import { UpdateOneTool } from "./documents/update-one.js";
import { AggregateTool } from "./documents/aggregate.js";
import { BulkWriteTool } from "./documents/bulk-write.js";
import { CreateIndexTool } from "./indexes/create-index.js";
import { DropIndexTool } from "./indexes/drop-index.js";
import { ListIndexesTool } from "./indexes/list-indexes.js";
import { McpError, ErrorCode, Tool } from "@modelcontextprotocol/sdk/types.js";

export class ToolRegistry {
    private tools: Map<string, BaseTool<any>> = new Map();

    constructor() {
        this.registerTool( new ListCollectionsTool() );
        this.registerTool( new AnalyzeSchemaTool() );
        this.registerTool( new CreateCollectionTool() );
        this.registerTool( new DropCollectionTool() );
        this.registerTool( new FindTool() );
        this.registerTool( new InsertOneTool() );
        this.registerTool( new UpdateOneTool() );
        this.registerTool( new DeleteOneTool() );
        this.registerTool( new AggregateTool() );
        this.registerTool( new BulkWriteTool() );
        this.registerTool( new CreateIndexTool() );
        this.registerTool( new DropIndexTool() );
        this.registerTool( new ListIndexesTool() );
    }

    registerTool( tool: BaseTool<any> ) {
        this.tools.set( tool.name, tool );
    }

    getTool( name: string ): BaseTool<any> | undefined {
        const tool = this.tools.get( name );
        if ( !tool ) {
            throw new McpError( ErrorCode.MethodNotFound, `Unknown tool: ${name}` );
        }
        return tool;
    }

    getAllTools(): BaseTool<any>[] {
        return Array.from( this.tools.values() );
    }

    getToolSchemas(): Tool[] {
        return this.getAllTools().map( ( tool ) => {
            const inputSchema = tool.inputSchema as any;
            return {
                name: tool.name,
                description: tool.description,
                inputSchema: {
                    type: "object",
                    properties: inputSchema.properties || {},
                    ...( inputSchema.required && { required: inputSchema.required } ),
                },
            };
        } );
    }
}
