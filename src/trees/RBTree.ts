import { TreeNode } from "./TreeNode";

export const enum Color { RED = 'red', BLACK = 'black' }
export const enum Animation
{
    Rotate = 'rotate', Color = 'color', Insert = 'insert',
    Replace = 'replace', Delete = 'delete', Highlight = 'highlight',
}

type RBMeta = { color: Color };

export class RBNode<T> extends TreeNode<T, RBMeta>
{
    constructor(key: T)
    {
        super(key);
        this.meta = { color: Color.RED };
    }
}

function undefinedAsNull<T>(value: T | undefined): T | null
{
    if (value === undefined) return null;
    return value;
}

function isRed<T>(node: RBNode<T> | null | undefined): node is RBNode<T>
{
    return colorof(node) === Color.RED;
}
function isBlack<T>(node: RBNode<T> | null | undefined)
{
    return colorof(node) === Color.BLACK;
}

export function colorof<T>(node: RBNode<T> | null | undefined)
{
    if (!node || !node.meta) return Color.BLACK;
    return node.meta.color;
}

export class RBTree<T>
{
    private _root: RBNode<T> | null;
    private _size: number;

    protected get root() { return this._root; }
    protected animate: (...args: any) => Promise<any>;

    constructor()
    {
        this.clear();
        this.animate = () => new Promise(resolve => resolve());
    }

    public async addRange(values: T[])
    {
        for (let val of values)
            await this.add(val);
        return this;
    }
    public async add(value: T)
    {
        const self = this;
        function insert(parent: RBNode<T> | null, node: RBNode<T>): void
        {
            if (parent !== null)
            {
                if (node.key < parent.key)
                {
                    if (parent.left !== null)
                        return insert(parent.left, node);
                    else
                        parent.left = node;
                }
                else
                {
                    if (parent.right !== null)
                        return insert(parent.right, node);
                    else
                        parent.right = node;
                }
            }

            node.parent = parent;
        }

        async function repair(node: RBNode<T>)
        {
            if (node.parent === null)
            {
                node.meta.color = Color.BLACK;
                await self.animate();
            }
            else if (colorof(node.parent) === Color.BLACK)
            {
                // do nothing
            }
            else if (node.parent.parent !== null && node.parent.sibling !== null && colorof(node.parent.sibling) == Color.RED)
            {
                const gparent = node.parent.parent;
                node.parent.meta.color = Color.BLACK;
                node.parent.sibling.meta.color = Color.BLACK;
                gparent.meta.color = Color.RED;

                await self.animate();

                repair(gparent);
            }
            else
            {
                let parent = node.parent;
                let gparent = node.parent.parent;

                if (node === parent.right && parent == gparent?.left)
                {
                    self._root = parent.rotateLeft();
                    node = node.left as RBNode<T>;
                    await self.animate();
                }
                else if (node === parent.left && parent == gparent?.right)
                {
                    self._root = parent.rotateRight();
                    node = node.right as RBNode<T>;
                    await self.animate();
                }

                parent = node.parent as RBNode<T>;
                gparent = node.parent?.parent as RBNode<T>;

                if (node === parent.left)
                {
                    self._root = gparent.rotateRight();
                    await self.animate();
                }
                else
                {
                    self._root = gparent.rotateLeft();
                    await self.animate();
                }

                parent.meta.color = Color.BLACK;
                gparent.meta.color = Color.RED;
                await self.animate();
            }
        }

        let node = new RBNode(value);
        insert(this._root, node);
        await repair(node);

        var root = node;
        while (root.parent !== null)
            root = root.parent;

        this._size++;

        this._root = root;
        await self.animate();
    }
    public clear(): void
    {
        this._root = null;
        this._size = 0;
    }

    protected findNode(value: T): RBNode<T> | null
    {
        const self = this;
        function find(value: T, node: RBNode<T> | null): RBNode<T> | null
        {
            if (!node)
                return null;
            else
            {
                if (value === node.key)
                    return node;
                else if (value < node.key)
                    return find(value, node.left);
                else
                    return find(value, node.right);
            }
        }

        return find(value, this._root);
    }

    delete(value: T): boolean
    {
        const self = this;
        function replace(node: RBNode<T>, child: RBNode<T> | null)
        {
            if (child)
                child.parent = node.parent;

            if (node.parent)
            {
                if (node === node.parent.left)
                    node.parent.left = child;
                else
                    node.parent.right = child;
            }
            else
            {
                self._root = child;
            }
        }
        function deleteOneChild(node: RBNode<T>)
        {
            // node must have one child only
            let child = (node.right === null) ? node.left : node.right;
            //if (!child) throw new Error();

            replace(node, child);
            if (colorof(node) === Color.BLACK)
            {
                if (isRed(child))
                    child.meta.color = Color.BLACK;
                else
                    case1(child, node.parent);
            }
        }
        function case1(node: RBNode<T> | null, parent: RBNode<T> | null)
        {
            if (parent)
            {
                case2(node, parent);
            }
        }
        function case2(node: RBNode<T> | null, parent: RBNode<T>)
        {
            const sibling = node === parent.left ? parent.right : parent.left;

            if (isRed(sibling))
            {
                parent.meta.color = Color.RED;
                sibling.meta.color = Color.BLACK;
                if (node === parent.left)
                    self._root = parent.rotateLeft();
                else
                    self._root = parent.rotateRight();
            }

            case3(node, parent,
                (node === parent.left ? parent.right : parent.left) as RBNode<T>);
        }
        function case3(node: RBNode<T> | null, parent: RBNode<T>, sibling: RBNode<T>)
        {
            const s = sibling;

            if (isBlack(parent) && isBlack(s) &&
                isBlack(s.left) && isBlack(s.right))
            {
                s.meta.color = Color.RED;
                case1(parent, parent.parent);
            }
            else
            {
                case4(node, parent, sibling);
            }
        }
        function case4(node: RBNode<T> | null, parent: RBNode<T>, sibling: RBNode<T>)
        {
            const s = sibling;

            if (isRed(parent) && isBlack(s) &&
                isBlack(s.left) && isBlack(s.right))
            {
                s.meta.color = Color.RED;
                parent.meta.color = Color.BLACK;
            }
            else
                case5(node, parent, sibling);
        }
        function case5(node: RBNode<T> | null, parent: RBNode<T>, sibling: RBNode<T>)
        {
            if (sibling.meta.color === Color.BLACK)
            {
                if (node === parent.left && isBlack(sibling.right) &&
                    isRed(sibling.left))
                {
                    sibling.meta.color = Color.RED;
                    sibling.left.meta.color = Color.BLACK;
                    self._root = sibling.rotateRight();
                }
                else if (node === parent.right && isBlack(sibling.left) &&
                    isRed(sibling.right))
                {
                    sibling.meta.color = Color.RED;
                    sibling.right.meta.color = Color.BLACK;
                    self._root = sibling.rotateLeft();
                }
            }

            case6(node, parent, sibling);
        }
        function case6(node: RBNode<T> | null, parent: RBNode<T>, sibling: RBNode<T>)
        {
            sibling.meta.color = parent.meta.color;
            parent.meta.color = Color.BLACK;

            if (node === parent.left)
            {
                if (sibling.right)
                    sibling.right.meta.color = Color.BLACK;

                self._root = parent.rotateLeft();
            }
            else
            {
                (sibling.left as RBNode<T>).meta.color = Color.BLACK;
                self._root = parent.rotateRight();
            }
        }

        var deletedNode = this.findNode(value);
        if (!deletedNode) return false;

        if (deletedNode.left && deletedNode.right)
        {
            var min = deletedNode.right;
            while (min.left)
            {
                min = min.left;
            }
            deletedNode.key = min.key;
            deleteOneChild(min);
        }
        else // if (deletedNode.left || deletedNode.right)
        {
            deleteOneChild(deletedNode);
        }

        return true;
    }

    has(value: T): boolean
    {
        return this.findNode(value) !== null;
    }

    forEach(callbackfn: (value: T, value2: T, set: RBTree<T>) => void, thisArg?: any): void
    {
        for (let value of this)
        {
            callbackfn(value, value, this);
        }
    }
    get size()
    {
        return this._size;
    }


    [Symbol.toStringTag] = '[ RBTree object ]';
    *[Symbol.iterator](): IterableIterator<T>
    {
        if (this._root)
        {
            let stack: ['left' | 'right', RBNode<T>][] = [];
            stack.push(['left', this._root]);

            var top;
            while (top = stack.pop())
            {
                if (top[0] === 'left')
                {
                    stack.push(['right', top[1]]);
                    if (top[1].left)
                        stack.push(['left', top[1].left])
                }
                else
                {
                    yield top[1].key;
                    if (top[1].right)
                        stack.push(['left', top[1].right]);
                }
            }
        }
    }
    *entries(): IterableIterator<[T, T]>
    {
        for (let v of this)
        {
            yield [v, v];
        }
    }
    keys = this[Symbol.iterator];
    values = this[Symbol.iterator];
}