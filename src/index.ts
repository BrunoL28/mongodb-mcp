#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
    CallToolRequestSchema,
    ListToolsRequestSchema,
    ListResourcesRequestSchema,
    ReadResourceRequestSchema,
    ListPromptsRequestSchema,
    GetPromptRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { connectToMongoDB, closeMongoDB, db } from "./mongodb/client.js";
import { ToolRegistry } from "./tools/registry.js";
import { buildCollectionSchema } from "./mongodb/schema.js";

const args = process.argv.slice( 2 );
if ( args.length === 0 ) {
    console.error( "Please provide a MongoDB connection URL" );
    process.exit( 1 );
}
const databaseUrl = args[0];

const toolRegistry = new ToolRegistry();

const server = new Server(
    {
        name: "mongodb-mcp",
        version: "1.0.0",
    },
    {
        capabilities: {
            resources: {},
            prompts: {},
            tools: {
                listChanged: true,
            },
        },
    }
);

server.setRequestHandler( ListToolsRequestSchema, async () => ( {
    tools: toolRegistry.getToolSchemas(),
    _meta: {},
} ) );

server.setRequestHandler( ListResourcesRequestSchema, async () => {
    const collections = await db.listCollections().toArray();
    return {
        resources: collections.map( ( c ) => ( {
            uri: `mongodb://schema/${c.name}`,
            name: `Schema of ${c.name} collection`,
            mimeType: "application/json",
            description: `Auto-generated schema from sampling documents in ${c.name}`
        } ) )
    };
} );

server.setRequestHandler( ReadResourceRequestSchema, async ( request ) => {
    const uri = request.params.uri;
    if ( uri.startsWith( "mongodb://schema/" ) ) {
        const collectionName = uri.split( "/" ).pop();
        if ( !collectionName ) {
            throw new Error( "Invalid URI: missing collection name" );
        }
        
        const coll = db.collection( collectionName );
        const schema = await buildCollectionSchema( coll, 50 ); // Sample size 50
        
        return {
            contents: [
                {
                    uri: request.params.uri,
                    mimeType: "application/json",
                    text: JSON.stringify( schema, null, 2 ),
                }
            ]
        };
    }
    throw new Error( `Unknown resource: ${uri}` );
} );

server.setRequestHandler( ListPromptsRequestSchema, async () => {
    return {
        prompts: [
            {
                name: "generate-types",
                description: "Generate TypeScript types for a specific collection",
                arguments: [
                    {
                        name: "collection",
                        description: "The name of the collection to generate types for",
                        required: true,
                    }
                ]
            },
            {
                name: "optimize-query",
                description: "Help optimize a MongoDB query based on the schema",
                arguments: [
                    {
                        name: "collection",
                        description: "The name of the collection being queried",
                        required: true,
                    },
                    {
                        name: "query",
                        description: "The query string to optimize",
                        required: true,
                    }
                ]
            }
        ]
    };
} );

server.setRequestHandler( GetPromptRequestSchema, async ( request ) => {
    const name = request.params.name;
    
    if ( name === "generate-types" ) {
        const collection = request.params.arguments?.collection;
        return {
            description: "Generate TypeScript interfaces for a MongoDB collection",
            messages: [
                {
                    role: "user",
                    content: {
                        type: "text",
                        text: `Please generate comprehensive TypeScript interfaces for the MongoDB collection '${collection}'. \n\nI can provide the schema definition by reading the resource 'mongodb://schema/${collection}' or using the analyze-schema tool. Please wrap the final output in a markdown code block.`,
                    }
                }
            ]
        };
    }
    
    if ( name === "optimize-query" ) {
        const collection = request.params.arguments?.collection;
        const query = request.params.arguments?.query;
        return {
            description: "Optimize MongoDB query",
            messages: [
                {
                    role: "user",
                    content: {
                        type: "text",
                        text: `I have a MongoDB query on the '${collection}' collection that I want to optimize: \n\n${query}\n\nPlease read the schema for this collection (using 'mongodb://schema/${collection}') and suggest any indexes I should create, or rewrites to the query pipeline/filter to make it faster.`,
                    }
                }
            ]
        };
    }
    
    throw new Error( `Unknown prompt: ${name}` );
} );

server.setRequestHandler( CallToolRequestSchema, async ( request ) => {
    const name = request.params.name;
    const args = request.params.arguments ?? {};

    try {
        console.error( `Executing tool: ${name}` );
        console.error( `Arguments: ${JSON.stringify( args, null, 2 )}` );

        const tool = toolRegistry.getTool( name );
        if ( !tool ) {
            throw new Error( `Unknown tool: ${name}` );
        }

        const result = await tool.execute( args );
        return { toolResult: result };
    } catch ( error ) {
        console.error( "Operation failed:", error );
        return {
            toolResult: {
                content: [
                    {
                        type: "text",
                        text: error.message,
                    },
                ],
                isError: true,
            },
        };
    }
} );

async function runServer() {
    try {
        await connectToMongoDB( databaseUrl );
        const transport = new StdioServerTransport();
        await server.connect( transport );
        console.error( "MongoDB MCP server running on stdio" );
    } catch ( error ) {
        console.error( "Failed to start server:", error );
        process.exit( 1 );
    }
}

process.on( "SIGINT", async () => {
    try {
        await closeMongoDB();
    } finally {
        process.exit( 0 );
    }
} );

process.on( "unhandledRejection", ( error ) => {
    console.error( "Unhandled promise rejection:", error );
    process.exit( 1 );
} );

runServer().catch( console.error );
