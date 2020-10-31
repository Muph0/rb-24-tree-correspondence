
export class TreeNode<TKey, TMeta>
{
    parent: TreeNode<TKey, TMeta> | null;
    left: TreeNode<TKey, TMeta> | null;
    right: TreeNode<TKey, TMeta> | null;

    meta: TMeta;
    key: TKey;

    constructor(key: TKey)
    {
        this.left = null;
        this.right = null;
        this.key = key;
    }

    root(): TreeNode<TKey, TMeta>
    {
        var root = this as TreeNode<TKey, TMeta>;
        while (root.parent)
            root = root.parent;
        return root;
    }

    get sibling()
    {
        if (!this.parent) return null;
        return (this.parent.left === this) ? this.parent.right : this.parent.left;
    }

    rotateLeft()
    {
        const newNode = this.right;
        const parent = this.parent;

        if (newNode === null) throw new Error('Implementation error.');

        // rotate this node with right node
        this.right = newNode.left;
        newNode.left = this;
        this.parent = newNode;
        if (this.right)
            this.right.parent = this;


        // in case this node had a parent
        // make the new node the parent's child
        if (parent)
        {
            if (this === parent.left)
                parent.left = newNode;
            else if (this == parent.right)
                parent.right = newNode;
        }

        newNode.parent = parent;
        return newNode.root();
    }

    rotateRight()
    {
        const newNode = this.left;
        const parent = this.parent;

        if (newNode === null) throw new Error('Implementation error.');

        // rotate this node with left node
        this.left = newNode.right;
        newNode.right = this;
        this.parent = newNode;
        if (this.left)
            this.left.parent = this;

        // in case this node had a parent
        // make the newNode the parent's child
        if (parent)
        {
            if (this == parent.left)
                parent.left = newNode;
            else if (this == parent.right)
                parent.right = newNode;
        }

        newNode.parent = parent;
        return newNode.root();
    }
}