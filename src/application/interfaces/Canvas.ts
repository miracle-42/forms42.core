import { CanvasComponent } from '../CanvasComponent.js';

export interface View
{
    x       : string|number;
    y       : string|number;
    width   : string|number;
    height  : string|number;
}

export interface Canvas
{
	zindex:number;
    moveable:boolean;
    resizable:boolean;

    close() : void;

    block() : void;
    unblock() : void;

	remove() : void;
    restore() : void;
	refresh() : void;

    getElement() : HTMLElement;
    getContent() : HTMLElement;

    getView() : View;
    getParentView() : View;
    setView(view:View) : void;

    getComponent() : CanvasComponent;
    setComponent(component:CanvasComponent) : void;

    getElementById(id:string) : HTMLElement;
    getElementByName(name:string) : HTMLElement[];
}