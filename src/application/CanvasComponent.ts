/*
 * This code is free software; you can redistribute it and/or modify it
 * under the terms of the GNU General Public License version 3 only, as
 * published by the Free Software Foundation.

 * This code is distributed in the hope that it will be useful, but WITHOUT
 * ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or
 * FITNESS FOR A PARTICULAR PURPOSE.  See the GNU General Public License
 * version 2 for more details (a copy is included in the LICENSE file that
 * accompanied this code).
 */

import { Canvas } from './interfaces/Canvas.js';

export interface CanvasComponent
{
	canvas:Canvas;

	moveable:boolean;
	navigable:boolean;
	resizable:boolean;

	getView() : HTMLElement;
	close() : Promise<boolean>;
}