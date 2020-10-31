var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
define("timing", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.nowMs = exports.sleepUntilNextFrame = exports.sleep = void 0;
    exports.sleep = (ms) => new Promise(resolve => window.setTimeout(() => resolve(), ms));
    exports.sleepUntilNextFrame = () => new Promise(resolve => window.requestAnimationFrame(() => resolve()));
    exports.nowMs = () => new Date().getTime();
});
define("trees/TreeNode", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TreeNode = void 0;
    class TreeNode {
        constructor(key) {
            this.left = null;
            this.right = null;
            this.key = key;
        }
        root() {
            var root = this;
            while (root.parent)
                root = root.parent;
            return root;
        }
        get sibling() {
            if (!this.parent)
                return null;
            return (this.parent.left === this) ? this.parent.right : this.parent.left;
        }
        rotateLeft() {
            const newNode = this.right;
            const parent = this.parent;
            if (newNode === null)
                throw new Error('Implementation error.');
            // rotate this node with right node
            this.right = newNode.left;
            newNode.left = this;
            this.parent = newNode;
            if (this.right)
                this.right.parent = this;
            // in case this node had a parent
            // make the new node the parent's child
            if (parent) {
                if (this === parent.left)
                    parent.left = newNode;
                else if (this == parent.right)
                    parent.right = newNode;
            }
            newNode.parent = parent;
            return newNode.root();
        }
        rotateRight() {
            const newNode = this.left;
            const parent = this.parent;
            if (newNode === null)
                throw new Error('Implementation error.');
            // rotate this node with left node
            this.left = newNode.right;
            newNode.right = this;
            this.parent = newNode;
            if (this.left)
                this.left.parent = this;
            // in case this node had a parent
            // make the newNode the parent's child
            if (parent) {
                if (this == parent.left)
                    parent.left = newNode;
                else if (this == parent.right)
                    parent.right = newNode;
            }
            newNode.parent = parent;
            return newNode.root();
        }
    }
    exports.TreeNode = TreeNode;
});
define("trees/RBTree", ["require", "exports", "trees/TreeNode"], function (require, exports, TreeNode_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.RBTree = exports.colorof = exports.RBNode = exports.Animation = exports.Color = void 0;
    var Color;
    (function (Color) {
        Color["RED"] = "red";
        Color["BLACK"] = "black";
    })(Color = exports.Color || (exports.Color = {}));
    var Animation;
    (function (Animation) {
        Animation["Rotate"] = "rotate";
        Animation["Color"] = "color";
        Animation["Insert"] = "insert";
        Animation["Replace"] = "replace";
        Animation["Delete"] = "delete";
        Animation["Highlight"] = "highlight";
    })(Animation = exports.Animation || (exports.Animation = {}));
    class RBNode extends TreeNode_1.TreeNode {
        constructor(key) {
            super(key);
            this.meta = { color: "red" /* RED */ };
        }
    }
    exports.RBNode = RBNode;
    function undefinedAsNull(value) {
        if (value === undefined)
            return null;
        return value;
    }
    function isRed(node) {
        return colorof(node) === "red" /* RED */;
    }
    function isBlack(node) {
        return colorof(node) === "black" /* BLACK */;
    }
    function colorof(node) {
        if (!node || !node.meta)
            return "black" /* BLACK */;
        return node.meta.color;
    }
    exports.colorof = colorof;
    class RBTree {
        constructor() {
            this[Symbol.toStringTag] = '[ RBTree object ]';
            this.keys = this[Symbol.iterator];
            this.values = this[Symbol.iterator];
            this.clear();
            this.animate = () => new Promise(resolve => resolve());
        }
        get root() { return this._root; }
        addRange(values) {
            return __awaiter(this, void 0, void 0, function* () {
                for (let val of values)
                    yield this.add(val);
                return this;
            });
        }
        add(value) {
            return __awaiter(this, void 0, void 0, function* () {
                const self = this;
                function insert(parent, node) {
                    if (parent !== null) {
                        if (node.key < parent.key) {
                            if (parent.left !== null)
                                return insert(parent.left, node);
                            else
                                parent.left = node;
                        }
                        else {
                            if (parent.right !== null)
                                return insert(parent.right, node);
                            else
                                parent.right = node;
                        }
                    }
                    node.parent = parent;
                }
                function repair(node) {
                    var _a;
                    return __awaiter(this, void 0, void 0, function* () {
                        if (node.parent === null) {
                            node.meta.color = "black" /* BLACK */;
                            yield self.animate();
                        }
                        else if (colorof(node.parent) === "black" /* BLACK */) {
                            // do nothing
                        }
                        else if (node.parent.parent !== null && node.parent.sibling !== null && colorof(node.parent.sibling) == "red" /* RED */) {
                            const gparent = node.parent.parent;
                            node.parent.meta.color = "black" /* BLACK */;
                            node.parent.sibling.meta.color = "black" /* BLACK */;
                            gparent.meta.color = "red" /* RED */;
                            yield self.animate();
                            repair(gparent);
                        }
                        else {
                            let parent = node.parent;
                            let gparent = node.parent.parent;
                            if (node === parent.right && parent == (gparent === null || gparent === void 0 ? void 0 : gparent.left)) {
                                self._root = parent.rotateLeft();
                                node = node.left;
                                yield self.animate();
                            }
                            else if (node === parent.left && parent == (gparent === null || gparent === void 0 ? void 0 : gparent.right)) {
                                self._root = parent.rotateRight();
                                node = node.right;
                                yield self.animate();
                            }
                            parent = node.parent;
                            gparent = (_a = node.parent) === null || _a === void 0 ? void 0 : _a.parent;
                            if (node === parent.left) {
                                self._root = gparent.rotateRight();
                                yield self.animate();
                            }
                            else {
                                self._root = gparent.rotateLeft();
                                yield self.animate();
                            }
                            parent.meta.color = "black" /* BLACK */;
                            gparent.meta.color = "red" /* RED */;
                            yield self.animate();
                        }
                    });
                }
                let node = new RBNode(value);
                insert(this._root, node);
                yield repair(node);
                var root = node;
                while (root.parent !== null)
                    root = root.parent;
                this._size++;
                this._root = root;
                yield self.animate();
            });
        }
        clear() {
            this._root = null;
            this._size = 0;
        }
        findNode(value) {
            const self = this;
            function find(value, node) {
                if (!node)
                    return null;
                else {
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
        delete(value) {
            const self = this;
            function replace(node, child) {
                if (child)
                    child.parent = node.parent;
                if (node.parent) {
                    if (node === node.parent.left)
                        node.parent.left = child;
                    else
                        node.parent.right = child;
                }
                else {
                    self._root = child;
                }
            }
            function deleteOneChild(node) {
                // node must have one child only
                let child = (node.right === null) ? node.left : node.right;
                //if (!child) throw new Error();
                replace(node, child);
                if (colorof(node) === "black" /* BLACK */) {
                    if (isRed(child))
                        child.meta.color = "black" /* BLACK */;
                    else
                        case1(child, node.parent);
                }
            }
            function case1(node, parent) {
                if (parent) {
                    case2(node, parent);
                }
            }
            function case2(node, parent) {
                const sibling = node === parent.left ? parent.right : parent.left;
                if (isRed(sibling)) {
                    parent.meta.color = "red" /* RED */;
                    sibling.meta.color = "black" /* BLACK */;
                    if (node === parent.left)
                        self._root = parent.rotateLeft();
                    else
                        self._root = parent.rotateRight();
                }
                case3(node, parent, (node === parent.left ? parent.right : parent.left));
            }
            function case3(node, parent, sibling) {
                const s = sibling;
                if (isBlack(parent) && isBlack(s) &&
                    isBlack(s.left) && isBlack(s.right)) {
                    s.meta.color = "red" /* RED */;
                    case1(parent, parent.parent);
                }
                else {
                    case4(node, parent, sibling);
                }
            }
            function case4(node, parent, sibling) {
                const s = sibling;
                if (isRed(parent) && isBlack(s) &&
                    isBlack(s.left) && isBlack(s.right)) {
                    s.meta.color = "red" /* RED */;
                    parent.meta.color = "black" /* BLACK */;
                }
                else
                    case5(node, parent, sibling);
            }
            function case5(node, parent, sibling) {
                if (sibling.meta.color === "black" /* BLACK */) {
                    if (node === parent.left && isBlack(sibling.right) &&
                        isRed(sibling.left)) {
                        sibling.meta.color = "red" /* RED */;
                        sibling.left.meta.color = "black" /* BLACK */;
                        self._root = sibling.rotateRight();
                    }
                    else if (node === parent.right && isBlack(sibling.left) &&
                        isRed(sibling.right)) {
                        sibling.meta.color = "red" /* RED */;
                        sibling.right.meta.color = "black" /* BLACK */;
                        self._root = sibling.rotateLeft();
                    }
                }
                case6(node, parent, sibling);
            }
            function case6(node, parent, sibling) {
                sibling.meta.color = parent.meta.color;
                parent.meta.color = "black" /* BLACK */;
                if (node === parent.left) {
                    if (sibling.right)
                        sibling.right.meta.color = "black" /* BLACK */;
                    self._root = parent.rotateLeft();
                }
                else {
                    sibling.left.meta.color = "black" /* BLACK */;
                    self._root = parent.rotateRight();
                }
            }
            var deletedNode = this.findNode(value);
            if (!deletedNode)
                return false;
            if (deletedNode.left && deletedNode.right) {
                var min = deletedNode.right;
                while (min.left) {
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
        has(value) {
            return this.findNode(value) !== null;
        }
        forEach(callbackfn, thisArg) {
            for (let value of this) {
                callbackfn(value, value, this);
            }
        }
        get size() {
            return this._size;
        }
        *[Symbol.iterator]() {
            if (this._root) {
                let stack = [];
                stack.push(['left', this._root]);
                var top;
                while (top = stack.pop()) {
                    if (top[0] === 'left') {
                        stack.push(['right', top[1]]);
                        if (top[1].left)
                            stack.push(['left', top[1].left]);
                    }
                    else {
                        yield top[1].key;
                        if (top[1].right)
                            stack.push(['left', top[1].right]);
                    }
                }
            }
        }
        *entries() {
            for (let v of this) {
                yield [v, v];
            }
        }
    }
    exports.RBTree = RBTree;
});
define("trees/VisualTree", ["require", "exports", "timing", "trees/RBTree"], function (require, exports, timing_1, RBTree_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.VisualTree = void 0;
    function placementRoot(p) {
        var node = p[Object.keys(p)[0]];
        while (node.parent)
            node = node.parent;
        return node;
    }
    class VisualTree extends RBTree_1.RBTree {
        constructor(canvas, animationDuration) {
            super();
            this.canvas = canvas;
            this.animationDuration = 1000.0;
            if (animationDuration)
                this.animationDuration = animationDuration;
        }
        get context() {
            return this.canvas.getContext('2d');
        }
        placeNodes() {
            var _a;
            const redOffset = 0.1;
            const layers = [];
            function clone(node, parent, depth) {
                if (!layers[depth])
                    layers[depth] = [];
                var nodeinfo = {
                    depth: 0,
                    key: node === null || node === void 0 ? void 0 : node.key,
                    meta: node === null || node === void 0 ? void 0 : node.meta,
                };
                nodeinfo.depth = depth;
                nodeinfo.parent = parent;
                if (node && RBTree_1.colorof(node.left) === "red" /* RED */)
                    nodeinfo.left = clone(node.left, nodeinfo, depth);
                layers[depth].push(nodeinfo);
                if (node) {
                    if (RBTree_1.colorof(node.left) === "black" /* BLACK */)
                        nodeinfo.left = clone(node.left, nodeinfo, depth + 1);
                    nodeinfo.right = clone(node.right, nodeinfo, RBTree_1.colorof(node.right) === "red" /* RED */ ? depth : depth + 1);
                }
                return nodeinfo;
            }
            clone(this.root, undefined, 0);
            const width = this.context.canvas.width;
            const height = this.context.canvas.height;
            const layerSpacing = height / layers.length;
            const layerPad = 60;
            for (let l = 0; l < layers.length; l++) {
                const layer = layers[l];
                const nodeSpacing = width / layer.length;
                const nodePad = nodeSpacing / 2;
                for (let n = 0; n < layer.length; n++) {
                    const node = layer[n];
                    node.posx = nodePad + n * nodeSpacing;
                    node.posy = layerPad + l * layerSpacing;
                    if (((_a = node.meta) === null || _a === void 0 ? void 0 : _a.color) === "red" /* RED */)
                        node.posy += redOffset * layerSpacing;
                }
            }
            var placement = {};
            let nilCount = 0;
            for (let nodeInfo of layers.reduce((a, v) => a.concat(v), [])) {
                if (nodeInfo.key)
                    placement[nodeInfo.key] = nodeInfo;
                else
                    placement['nil' + (nilCount++)] = nodeInfo;
            }
            return placement;
        }
        render() {
            const newPlacement = this.placeNodes();
            if (this.oldPlacement) {
                const tStart = timing_1.nowMs();
                const self = this;
                function frame() {
                    let t = timing_1.nowMs() - tStart;
                    let interpolatedPlacement = self.interpolatePlacements(t / self.animationDuration, self.oldPlacement, newPlacement);
                    console.log(t);
                    self.drawPlacement(interpolatedPlacement);
                    if (t < self.animationDuration)
                        requestAnimationFrame(frame);
                    else {
                        self.drawPlacement(newPlacement);
                        self.oldPlacement = newPlacement;
                    }
                }
                frame();
            }
            else {
                this.drawPlacement(this.placeNodes());
                this.oldPlacement = newPlacement;
            }
        }
        interpolatePlacements(amount, p1, p2) {
            const amtClamp = Math.max(0, Math.min(1, amount));
            // smoothness exponent
            const exp = 2.5;
            const smooth = (x) => Math.pow(2 * x, exp);
            function lerp(a, b) {
                if (amtClamp < 0.5)
                    return smooth(amtClamp) * (b - a) / 2 + a;
                else
                    return smooth(1 - amtClamp) * (a - b) / 2 + b;
            }
            var result = {};
            var nilCount = 0;
            const p1Root = placementRoot(p1);
            const p2Root = placementRoot(p2);
            function clone(n, parent) {
                const k = n.key == null ? `nil${nilCount++}` : n.key;
                var newNode = Object.assign({}, n);
                if (p1.hasOwnProperty(k) && p2.hasOwnProperty(k)) {
                    newNode.posx = lerp(p1[k].posx, p2[k].posx);
                    newNode.posy = lerp(p1[k].posy, p2[k].posy);
                }
                else if (p2.hasOwnProperty(k) && parent) {
                    newNode.posx = lerp(parent.posx, p2[k].posx);
                    newNode.posy = lerp(parent.posy, p2[k].posy);
                }
                if (n.left)
                    newNode.left = clone(n.left, newNode);
                if (n.right)
                    newNode.right = clone(n.right, newNode);
                result[k] = newNode;
                return newNode;
            }
            const root = clone(p2Root);
            return result;
        }
        drawPlacement(placement) {
            var _a;
            const ctx = this.context;
            const W = ctx.canvas.width;
            const H = ctx.canvas.height;
            ctx.clearRect(0, 0, W, H);
            ctx.lineWidth = 3;
            // draw lines first
            for (let k in placement) {
                if (!placement.hasOwnProperty(k))
                    continue;
                let n = placement[k];
                if (n.left && n.right)
                    for (let child of [n.left, n.right]) {
                        switch ((_a = child.meta) === null || _a === void 0 ? void 0 : _a.color) {
                            case "red" /* RED */:
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
            for (let k in placement) {
                if (!placement.hasOwnProperty(k))
                    continue;
                let n = placement[k];
                ctx.translate(n.posx, n.posy);
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                if (n.key) {
                    ctx.beginPath();
                    ctx.fillStyle = '#FFF';
                    ctx.strokeStyle = '#000';
                    if (n.meta.color === "red" /* RED */)
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
                else {
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
    exports.VisualTree = VisualTree;
});
define("main", ["require", "exports", "trees/VisualTree", "trees/RBTree"], function (require, exports, VisualTree_1, RBTree_2) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    (_ => {
        var canvas = document.getElementById('canvas');
        canvas.width = window.innerWidth - 0;
        canvas.height = window.innerHeight - 0;
        var ctx = canvas.getContext('2d');
        if (!ctx) {
            console.error("Canvas not available");
            return;
        }
        const W = canvas.width;
        const H = canvas.height;
        ctx.fillStyle = '#F0F';
        ctx.fillRect(0, 0, W, H);
        var tree = new VisualTree_1.VisualTree(canvas);
        window.tree = tree;
        window.RBTree = RBTree_2.RBTree;
        tree.render();
        const valuebox = document.getElementById('value');
        const btn_add = document.getElementById('add');
        const btn_remove = document.getElementById('remove');
        const update_buttons = () => {
            const value = valuebox.value;
            btn_add.disabled = true;
            btn_remove.disabled = true;
            if (/[0-9]+/.test(value) && !tree.has(Number(value))) {
                btn_add.disabled = false;
            }
            if (tree.has(Number(value))) {
                btn_remove.disabled = false;
            }
        };
        const add_value = () => {
            const value = Number(valuebox.value);
            tree.add(value).then(_ => {
                tree.render();
                update_buttons();
            });
        };
        const delete_value = () => {
            const value = Number(valuebox.value);
            tree.delete(value);
            tree.render();
            update_buttons();
        };
        valuebox.onkeypress = (ev) => {
            if (ev.key === 'Enter' && !btn_add.disabled)
                btn_add.click();
        };
        btn_add.onclick = add_value;
        btn_remove.onclick = delete_value;
        valuebox.onkeyup = update_buttons;
        valuebox.onclick = update_buttons;
        update_buttons();
    })();
});
//# sourceMappingURL=main.js.map