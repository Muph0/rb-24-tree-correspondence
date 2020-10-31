import { nowMs, sleepUntilNextFrame } from "../timing";
import { Color, colorof, RBNode, RBTree } from "./RBTree";

type __keytype = number;
type Node = RBNode<number>

interface NodeInfo
{
    key: __keytype | null;
    meta: RBNode<__keytype>['meta'],
    depth: number;
    posx: number;
    posy: number;

    cell: NodeInfo[];
    left?: NodeInfo;
    right?: NodeInfo;
    parent?: NodeInfo;
}

type NodePlacement = { [key: string]: NodeInfo };
function placementRoot(p: NodePlacement): NodeInfo
{
    var node = p[Object.keys(p)[0]];
    while (node.parent)
        node = node.parent;

    return node;
}

function tagNodeInfo(node: NodeInfo)
{
    return node.parent
        ? (node === node.parent.left ? 'left' : 'right') + '_of_' + node.parent.key
        : 'root';
}

const nodeRadius = 20;
const boxSize = nodeRadius * 2 * 1.5;
const nullWidth = nodeRadius * 1.9;

export class VisualTree extends RBTree<__keytype>
{
    public constructor(
        private canvas: HTMLCanvasElement,
        animationDuration?: number
    )
    {
        super();
        if (animationDuration) this.animationDuration = animationDuration;
    }

    private get context(): CanvasRenderingContext2D
    {
        return this.canvas.getContext('2d') as CanvasRenderingContext2D;
    }

    public animationDuration: number = 1000.0;
    private oldPlacement: NodePlacement;
    private currentAnimation: number = 0;

    private placeNodes(): NodePlacement
    {
        const redOffset = 0.1;

        var layers: NodeInfo[][][] = [];
        function clone(node: Node | null, parent: NodeInfo | undefined, depth: number): NodeInfo
        {
            if (!layers[depth])
                layers[depth] = [];

            var nodeinfo = {
                posx: 0,
                posy: 0,
                depth: depth,
                key: node?.key,
                meta: node?.meta,
                parent: parent,
                cell: [],
            } as NodeInfo;

            if (colorof(node) === Color.RED && parent)
                nodeinfo.cell = parent.cell;
            else
                layers[depth].push(nodeinfo.cell);

            if (node)
            {
                nodeinfo.left = clone(node.left, nodeinfo, colorof(node.left) === Color.RED ? depth : depth + 1);
                nodeinfo.cell.push(nodeinfo);
                nodeinfo.right = clone(node.right, nodeinfo, colorof(node.right) === Color.RED ? depth : depth + 1);
            }
            else
            {
                nodeinfo.cell.push(nodeinfo);
            }

            return nodeinfo;
        }

        clone(this.root, undefined, 0);

        const width = this.context.canvas.width;
        const height = this.context.canvas.height;

        const layerSpacing = height / layers.length;
        const layerPad = 60;

        var placement: NodePlacement = {};
        let nilCount = 0;

        for (let l = 0; l < layers.length; l++)
        {
            const layer = layers[l];
            const cellSpacing = width / layer.length;
            const cellPad = cellSpacing / 2;

            for (let c = 0; c < layer.length; c++)
            {
                const cell = layer[c];
                for (let n = 0; n < cell.length; n++)
                {
                    const node = cell[n];
                    node.posx = cellPad + c * cellSpacing + n * boxSize;
                    node.posy = layerPad + l * layerSpacing;

                    if (node.key)
                    {
                        // if node not NIL, offset the posx according to the boxes
                        node.posx -= boxSize;
                        // and add it to the placement hashmap
                        placement[node.key] = node;
                    }
                    else
                    {
                        // tag the NIL so it moves with its parent
                        placement[`nil_${tagNodeInfo(node)}`] = node;
                    }
                }
            }
        }

        return placement;
    }

    async render()
    {
        const newPlacement = this.placeNodes();

        if (this.oldPlacement)
        {
            const tStart = nowMs();
            const currentAnimation_ = ++this.currentAnimation;

            while (true)
            {
                let t = nowMs() - tStart;
                let interpolatedPlacement = this.interpolatePlacements(
                    t / this.animationDuration,
                    this.oldPlacement,
                    newPlacement
                );

                this.drawPlacement(interpolatedPlacement);

                if (this.currentAnimation !== currentAnimation_)
                {
                    this.oldPlacement = interpolatedPlacement;
                    break;
                }

                if (t >= this.animationDuration)
                {
                    this.oldPlacement = newPlacement;
                    break;
                }

                await sleepUntilNextFrame();
            }
        }
        else
        {
            this.drawPlacement(this.placeNodes());
            this.oldPlacement = newPlacement;
        }
    }

    private interpolatePlacements(amount: number, p1: NodePlacement, p2: NodePlacement): NodePlacement
    {
        const amtClamp = Math.max(0, Math.min(1, amount));

        // smoothness exponent
        const exp = 2.5;
        const smooth = (x: number) => Math.pow(2 * x, exp);

        function lerp(a: number, b: number)
        {
            if (amtClamp < 0.5)
                return smooth(amtClamp) * (b - a) / 2 + a;
            else
                return smooth(1 - amtClamp) * (a - b) / 2 + b;
        }

        var result: NodePlacement = {};
        var nilCount = 0;
        const p1Root = placementRoot(p1);
        const p2Root = placementRoot(p2);

        function clone(n: NodeInfo, parent?: NodeInfo)
        {
            const k = n.key == null ? `nil_${tagNodeInfo(n)}` : n.key;
            var newNode = Object.assign({}, n);

            if (p1.hasOwnProperty(k) && p2.hasOwnProperty(k))
            {
                newNode.posx = lerp(p1[k].posx, p2[k].posx);
                newNode.posy = lerp(p1[k].posy, p2[k].posy);
            }
            else if (p2.hasOwnProperty(k) && parent)
            {
                newNode.posx = lerp(parent.posx, p2[k].posx);
                newNode.posy = lerp(parent.posy, p2[k].posy);
            }

            if (n.left) newNode.left = clone(n.left, newNode);
            if (n.right) newNode.right = clone(n.right, newNode);

            result[k] = newNode;
            return newNode;
        }

        const root = clone(p2Root);

        return result;
    }

    private drawPlacement(placement: NodePlacement)
    {
        const ctx = this.context;
        const W = ctx.canvas.width;
        const H = ctx.canvas.height;

        ctx.clearRect(0, 0, W, H);
        ctx.lineWidth = 3;

        // draw lines first
        for (let k in placement)
        {
            if (!placement.hasOwnProperty(k)) continue;
            let n = placement[k];

            if (n.left && n.right) for (let child of [n.left, n.right])
            {
                switch (child.meta?.color)
                {
                    case Color.RED:
                        break;
                    default:
                        break;
                }

                ctx.beginPath();
                ctx.moveTo(n.posx, n.posy);

                if (child.meta?.color === Color.RED)
                {
                    ctx.strokeStyle = '#F00';
                }
                else
                {
                    ctx.strokeStyle = '#000';
                    if (child === n.left)
                        ctx.lineTo(n.posx - boxSize / 2, n.posy + boxSize / 2);
                    else
                        ctx.lineTo(n.posx + boxSize / 2, n.posy + boxSize / 2);
                }

                ctx.lineTo(child.posx, child.posy);
                ctx.stroke();
            }
        }

        // then draw the boxes
        for (let k in placement)
        {
            if (!placement.hasOwnProperty(k)) continue;
            let n = placement[k];

            const boxY = -boxSize / 2;

            if (n.key && n.meta && n.meta.color === Color.BLACK)
            {
                var boxX = -boxSize / 2;
                if (n.left?.meta?.color === Color.RED)
                    boxX -= boxSize;

                ctx.translate(n.posx, n.posy);
                ctx.beginPath();
                ctx.fillStyle = '#FFF';
                ctx.strokeStyle = '#000';
                for (let i = 0; i < 3; i++)
                    ctx.rect(boxX + i * boxSize, boxY, boxSize, boxSize);
                ctx.stroke();
                ctx.translate(-n.posx, -n.posy);
            }
        }

        // then draw the nodes over the lines and boxes
        for (let k in placement)
        {
            if (!placement.hasOwnProperty(k)) continue;
            let n = placement[k];

            ctx.translate(n.posx, n.posy);
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';

            if (n.key)
            {
                ctx.beginPath();
                ctx.fillStyle = '#FFF';
                ctx.strokeStyle = '#000';
                if (n.meta.color === Color.RED)
                    ctx.strokeStyle = '#F00';
                ctx.lineWidth = 3;
                ctx.ellipse(0, 0, nodeRadius, nodeRadius, 0, 0, 2 * Math.PI);
                ctx.fill();
                ctx.stroke();

                ctx.beginPath();
                ctx.fillStyle = ctx.strokeStyle;
                ctx.font = `${nodeRadius * 1}px Times new roman`;
                ctx.fillText(n.key.toString(), 0, 0);
            }
            else
            {
                ctx.beginPath();
                ctx.fillStyle = '#000';
                ctx.fillRect(-nullWidth / 2, -nodeRadius / 2, nullWidth, nodeRadius);

                ctx.beginPath();
                ctx.fillStyle = '#FFF';
                ctx.font = `${nodeRadius * 0.75}px Times new roman`;
                ctx.fillText('NIL', 0, 0);
            }

            ctx.translate(-n.posx, -n.posy);
        }
    }
}
