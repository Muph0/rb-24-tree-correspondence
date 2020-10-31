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

    private placeNodes(): NodePlacement
    {
        const redOffset = 0.1;

        const layers: NodeInfo[][] = [];
        function clone(node: Node | null, parent: NodeInfo | undefined, depth: number): NodeInfo
        {
            if (!layers[depth])
                layers[depth] = [];

            var nodeinfo = {
                depth: 0,
                key: node?.key,
                meta: node?.meta,
            } as NodeInfo;
            nodeinfo.depth = depth;
            nodeinfo.parent = parent;

            if (node && colorof(node.left) === Color.RED)
                nodeinfo.left = clone(node.left, nodeinfo, depth);

            layers[depth].push(nodeinfo);

            if (node)
            {
                if (colorof(node.left) === Color.BLACK)
                    nodeinfo.left = clone(node.left, nodeinfo, depth + 1);
                nodeinfo.right = clone(node.right, nodeinfo, colorof(node.right) === Color.RED ? depth : depth + 1);
            }

            return nodeinfo;
        }

        clone(this.root, undefined, 0);

        const width = this.context.canvas.width;
        const height = this.context.canvas.height;

        const layerSpacing = height / layers.length;
        const layerPad = 60;

        for (let l = 0; l < layers.length; l++)
        {
            const layer = layers[l];
            const nodeSpacing = width / layer.length;
            const nodePad = nodeSpacing / 2;

            for (let n = 0; n < layer.length; n++)
            {
                const node = layer[n];
                node.posx = nodePad + n * nodeSpacing;
                node.posy = layerPad + l * layerSpacing;

                if (node.meta?.color === Color.RED)
                    node.posy += redOffset * layerSpacing;
            }
        }

        var placement: NodePlacement = {};
        let nilCount = 0;

        for (let nodeInfo of layers.reduce((a, v) => a.concat(v), []))
        {
            if (nodeInfo.key)
                placement[nodeInfo.key] = nodeInfo;
            else
                placement['nil' + (nilCount++)] = nodeInfo;
        }

        return placement;
    }

    render()
    {
        const newPlacement = this.placeNodes();

        if (this.oldPlacement)
        {
            const tStart = nowMs();
            const self = this;

            function frame()
            {
                let t = nowMs() - tStart;
                let interpolatedPlacement = self.interpolatePlacements(
                    t / self.animationDuration,
                    self.oldPlacement,
                    newPlacement
                );

                console.log(t);

                self.drawPlacement(interpolatedPlacement);

                if (t < self.animationDuration)
                    requestAnimationFrame(frame);
                else
                {
                    self.drawPlacement(newPlacement);
                    self.oldPlacement = newPlacement;
                }
            }

            frame();
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
            const k = n.key == null ? `nil${nilCount++}` : n.key;
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
                        ctx.strokeStyle = '#F00';
                        break;
                    default:
                        ctx.strokeStyle = '#000';
                        break;
                }

                ctx.beginPath();
                ctx.moveTo(n.posx, n.posy);
                ctx.lineTo(child.posx, child.posy);
                ctx.stroke();
            }
        }

        const nodeSize = 30;
        const nullWidth = nodeSize * 1.9;

        // then draw the nodes over the lines
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
                ctx.ellipse(0, 0, nodeSize, nodeSize, 0, 0, 2 * Math.PI);
                ctx.fill();
                ctx.stroke();

                ctx.beginPath();
                ctx.fillStyle = ctx.strokeStyle;
                ctx.font = `${nodeSize * 1}px Times new roman`;
                ctx.fillText(n.key.toString(), 0, 0);
            }
            else
            {
                ctx.beginPath();
                ctx.fillStyle = '#000';
                ctx.fillRect(-nullWidth / 2, -nodeSize / 2, nullWidth, nodeSize);

                ctx.beginPath();
                ctx.fillStyle = '#FFF';
                ctx.font = `${nodeSize * 0.75}px Times new roman`;
                ctx.fillText('NIL', 0, 0);
            }

            ctx.translate(-n.posx, -n.posy);
        }
    }
}
