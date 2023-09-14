type EdgeShape = { __typename: any; node: any };
type EdgesShape = EdgeShape[];
type ConnectionShape = {
  __typename: any;
  edges: EdgesShape;
};

const connectionHelper: <
  ConnectionType extends ConnectionShape,
  EdgeType extends EdgeShape = ConnectionType['edges'][number],
  NodeType = EdgeType['node']
>(
  connectionTypeName: ConnectionType['__typename'],
  edgeTypeName: EdgeType['__typename'],
  nodeValues: NodeType[]
) => {
  __typename: ConnectionType['__typename'];
  edges: { __typename: EdgeType['__typename']; node: NodeType }[];
} = (connectionTypeName, edgeTypeName, nodeValues) => {
  return {
    __typename: connectionTypeName,
    edges: nodeValues.map((nodeValue) => ({
      __typename: edgeTypeName,
      node: nodeValue,
    })),
  };
};

export default connectionHelper;
