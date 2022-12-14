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

import { Alert } from './Alert.js';
import { Form } from '../public/Form.js';
import { Class } from '../types/Class.js';
import { Framework } from './Framework.js';
import { Properties } from './Properties.js';
import { Components } from './Components.js';
import { FormBacking } from './FormBacking.js';
import { dates } from '../model/dates/dates.js';
import { Canvas } from './interfaces/Canvas.js';
import { Form as ViewForm } from '../view/Form.js';
import { Form as ModelForm } from '../model/Form.js';
import { Loading } from '../internal/forms/Loading.js';
import { Form as InternalForm } from '../internal/Form.js';
import { EventType } from '../control/events/EventType.js';
import { TriggerFunction } from '../public/TriggerFunction.js';
import { EventFilter } from '../control/events/EventFilter.js';
import { KeyMap, KeyMapping } from '../control/events/KeyMap.js';
import { ComponentFactory } from './interfaces/ComponentFactory.js';
import { FormEvent, FormEvents } from '../control/events/FormEvents.js';
import { ApplicationHandler } from '../control/events/ApplicationHandler.js';

export class FormsModule
{
	private root$:HTMLElement;
	private static instance:FormsModule;

	public static get() : FormsModule
	{
		if (FormsModule.instance == null)
			FormsModule.instance = new FormsModule();
		return(FormsModule.instance);
	}

	constructor()
	{
		dates.validate();
		KeyMapping.init();
		ApplicationHandler.init();
		FormsModule.instance = this;
	}

	public getRootElement() : HTMLElement
	{
		return(this.root$);
	}

	public setRootElement(root:HTMLElement) : void
	{
		this.root$ = root;
	}

	public mapComponent(clazz:Class<any>, path?:string) : void
	{
		if (clazz == null)
			return;

		if (path == null)
			path = clazz.name;

		path = path.toLowerCase();
		Components.classmap.set(path,clazz);
		Components.classurl.set(clazz.name,path);
	}

	public static getFormPath(clazz:Class<any>|string) : string
	{
		if (clazz == null)
			return(null);

		if (typeof clazz != "string")
			clazz = clazz.name;

		return(Components.classurl.get(clazz.toLowerCase()));
	}

	public getComponent(path:string) : Class<any>
	{
		return(Components.classmap.get(path.toLowerCase()));
	}

	public parse(doc?:Element) : void
	{
		if (doc == null) doc = document.body;
		let frmwrk:Framework = Framework.parse(this,doc);

		let root:HTMLElement = frmwrk.getRoot();
		if (this.root$ == null) this.root$ = root;
		if (this.root$ == null) this.root$ = document.body;
	}

	public updateKeyMap(map:Class<KeyMap>) : void
	{
		KeyMapping.update(map);
	}

	public OpenURLForm() : boolean
	{
		let location:Location = window.location;
		let params:URLSearchParams = new URLSearchParams(location.search);

		if (params.get("form") != null)
		{
			let form:string = params.get("form");
			let clazz:Class<any> = this.getComponent(form);

			if (clazz != null && clazz.prototype instanceof Form)
			{
				this.showform(clazz);
				return(true);
			}
		}
		return(false);
	}

	public getCurrentForm() : Form
	{
		return(FormBacking.getCurrentForm());
	}

	public async sendkey(key:KeyMap|string) : Promise<boolean>
	{
		if (typeof key === "string") key = KeyMap.from(key);
		let form:ViewForm = FormBacking.getCurrentViewForm();

		if (form != null) return(form.keyhandler(key));
		return(ApplicationHandler.instance.keyhandler(key));
	}

	public async save() : Promise<boolean>
	{
		return(FormBacking.save());
	}

	public async undo() : Promise<boolean>
	{
		return(FormBacking.undo());
	}

	public message(msg:string, title?:string) : void
	{
		Alert.message(msg,title);
	}

	public warning(msg:string, title?:string) : void
	{
		Alert.warning(msg,title);
	}

	public getRunningForms() : Form[]
	{
		return(FormBacking.getRunningForms());
	}

	public async showform(form:Class<Form|InternalForm>|string, parameters?:Map<any,any>, container?:HTMLElement) : Promise<Form>
	{
		if (typeof form === "string")
		{
			let path:string = form;
			form = form.toLowerCase();
			form = this.getComponent(form);
			if (form == null) throw "@Application: No components mapped to path '"+path+"'";
		}

		if (container == null)
			container = this.getRootElement();

		if (!(form.prototype instanceof Form) && !(form.prototype instanceof InternalForm))
			throw "@Application: Component mapped to '"+form+"' is not a form";

		let factory:ComponentFactory = Properties.FactoryImplementation;
		let canvasimpl:Class<Canvas> = Properties.CanvasImplementationClass;

		let canvas:Canvas = new canvasimpl();
		let instance:Form = await factory.createForm(form,parameters);

		instance.canvas = canvas;
		canvas.setComponent(instance);
		container.appendChild(canvas.getView());

		let mform:ModelForm = FormBacking.getModelForm(instance);
		await mform.wait4EventTransaction(EventType.PostViewInit,null);

		if (await FormEvents.raise(FormEvent.FormEvent(EventType.PostViewInit,instance)))
			instance.focus();

		return(instance);
	}

	public hideLoading(thread:number) : void
	{
		Loading.hide(thread);
	}

	public showLoading(message:string) : number
	{
		return(Loading.show(message));
	}

	public removeEventListener(id:object) : void
	{
		FormEvents.removeListener(id);
	}

	public addEventListener(method:TriggerFunction, filter?:EventFilter|EventFilter[]) : object
	{
		return(FormEvents.addListener(null,this,method,filter));
	}

	public addFormEventListener(form:Form|InternalForm, method:TriggerFunction, filter?:EventFilter|EventFilter[]) : object
	{
		return(FormEvents.addListener(form,this,method,filter));
	}
}