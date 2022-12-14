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

export class Canvas
{
	public static page:string =
	`
	<div name="canvas">
		<div name="modal"></div>
		<div name="content"></div>
	</div>
	`;

	public static ModalStyle:string =
	`
		top: 0;
		left: 0;
		width: 0;
		height: 0;
		position: absolute;
	`

	public static CanvasStyle:string =
	`
		overflow: hidden;
		position: absolute;
		width: fit-content;
		height: fit-content;
	`

	public static ContentStyle:string =
	`
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		position: relative;
	`

	public static ModalClasses:string = "modal";
	public static CanvasClasses:string = "canvas";
	public static ContentClasses:string = "canvas-content";
	public static CanvasHandleClass:string = "canvas-handle";
}