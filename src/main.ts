import { VisualTree } from "./trees/VisualTree";
import { RBTree } from "./trees/RBTree";

(_ =>
{
    var canvas = document.getElementById('canvas') as HTMLCanvasElement;
    canvas.width = window.innerWidth - 0;
    canvas.height = window.innerHeight - 0;


    var ctx = canvas.getContext('2d');
    if (!ctx)
    {
        console.error("Canvas not available");
        return;
    }

    const W = canvas.width;
    const H = canvas.height;
    ctx.fillStyle = '#F0F';
    ctx.fillRect(0, 0, W, H);

    var tree = new VisualTree(canvas);
    (window as any).tree = tree;
    (window as any).RBTree = RBTree;

    tree.render();


    const valuebox = document.getElementById('value') as HTMLInputElement;
    const btn_add = document.getElementById('add') as HTMLInputElement;
    const btn_remove = document.getElementById('remove') as HTMLInputElement;

    const update_buttons = () =>
    {

        const value = valuebox.value;
        btn_add.disabled = true;
        btn_remove.disabled = true;

        if (/[0-9]+/.test(value) && !tree.has(Number(value)))
        {
            btn_add.disabled = false;
        }
        if (tree.has(Number(value)))
        {
            btn_remove.disabled = false;
        }
    };

    const add_value = () =>
    {
        const value = Number(valuebox.value);
        tree.add(value).then(_ =>
        {
            tree.render();
            update_buttons();
        });

    };

    const delete_value = () =>
    {
        const value = Number(valuebox.value);
        tree.delete(value);
        tree.render();
        update_buttons();
    }

    valuebox.onkeypress = (ev: KeyboardEvent) =>
    {
        if (ev.key === 'Enter' && !btn_add.disabled)
            btn_add.click();
    }
    btn_add.onclick = add_value;
    btn_remove.onclick = delete_value;
    valuebox.onkeyup = update_buttons;
    valuebox.onclick = update_buttons;

    update_buttons();

})();