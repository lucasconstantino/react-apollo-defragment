import { DocumentNode, VariableDefinitionNode } from 'graphql';
export declare enum DocumentType {
    Query = 0,
    Mutation = 1,
    Subscription = 2,
}
export interface IDocumentDefinition {
    type: DocumentType;
    name: string;
    variables: VariableDefinitionNode[];
}
export declare function parser(document: DocumentNode): IDocumentDefinition;
