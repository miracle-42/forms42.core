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

import { KeyMap } from "./KeyMap.js";
import { MouseMap } from "./MouseMap.js";
import { EventType } from "./EventType.js";
import { Form } from "../../public/Form.js";
import { Block } from "../../public/Block.js";
import { Field } from "../../public/Field.js";
import { EventFilter } from "./EventFilter.js";
import { Alert } from "../../application/Alert.js";
import { EventListener } from "./EventListener.js";
import { Form as ModelForm } from "../../model/Form.js";
import { Logger, Type } from "../../application/Logger.js";
import { FieldInstance as ViewFieldInstance } from "../../view/fields/FieldInstance.js";

export class KeyEventSource
{
	constructor(public key:KeyMap, public field:string, public block:string, public record:number, public form:Form) {}
}

export class FormEvent
{
	public static FormEvent(type:EventType, form:Form) : FormEvent
	{
		return(new FormEvent(type,form));
	}

	public static BlockEvent(type:EventType, form:Form, block:string, inst?:ViewFieldInstance) : FormEvent
	{
		return(new FormEvent(type,form,inst,inst != null ? inst.block : block));
	}

	public static FieldEvent(type:EventType, inst:ViewFieldInstance) : FormEvent
	{
		return(new FormEvent(type,inst.field.block.form.parent,inst));
	}

	public static KeyEvent(form:Form, inst:ViewFieldInstance, key:KeyMap) : FormEvent
	{
		return(new FormEvent(EventType.Key,form,inst,inst?.block,key));
	}

	public static MouseEvent(form:Form, event:MouseMap, inst?:ViewFieldInstance, block?:string) : FormEvent
	{
		return(new FormEvent(EventType.Mouse,form,inst,inst != null ? inst.block : block,null,event));
	}

	private block$:Block = null;
	private field$:Field = null;

	private bevaluated:boolean = false;
	private fevaluated:boolean = false;

	private constructor
		(
			private type$:EventType,
			private form$:Form, private inst?:ViewFieldInstance,
			private blockname$?:string, private key$?:KeyMap,private mevent$?:MouseMap
		)
	{
		if (inst != null)
			this.blockname$ = inst.block;
	}

	public get type() : EventType
	{
		return(this.type$);
	}

	public get form() : Form
	{
		return(this.form$);
	}

	public get field() : Field
	{
		if (this.fevaluated) return(this.field$);

		if (this.inst != null)
			this.field$ = new Field(this.inst);

		this.fevaluated = true;
		return(this.field$);
	}

	public get block() : Block
	{
		if (this.bevaluated) return(this.block$);

		this.bevaluated = true;
		this.block$ = ModelForm.getForm(this.form$)?.getBlock(this.blockname$)?.interface;

		return(this.block$);
	}

	public get blockname() : string
	{
		return(this.blockname$);
	}

	public get key() : KeyMap
	{
		return(this.key$);
	}

	public get fieldname() : string
	{
		return(this.inst?.name);
	}

	public get mouse() : MouseMap
	{
		return(this.mevent$);
	}

	public toString() : string
	{
		let str:string = "";

		str += "form: "+this.form$?.constructor.name;
		if (this.type != null) str += ", type: " + EventType[this.type];

		if (this.blockname != null) str += ", block: "+this.blockname;
		if (this.fieldname != null) str += ", field: "+this.fieldname;

		if (this.key != null) str += ", key: "+this.key.toString();
		if (this.mouse != null) str += ", mouse: "+MouseMap[this.mouse];

		return(str);
	}
}


export class FormEvents
{
	private static listeners:EventListener[] = [];
	private static applisteners:Map<EventType|number,EventListener[]> = new Map<EventType|number,EventListener[]>();
	private static frmlisteners:Map<EventType|number,EventListener[]> = new Map<EventType|number,EventListener[]>();
	private static blklisteners:Map<EventType|number,EventListener[]> = new Map<EventType|number,EventListener[]>();
	private static fldlisteners:Map<EventType|number,EventListener[]> = new Map<EventType|number,EventListener[]>();

	public static addListener(form:Form, clazz:any, method:Function|string, filter?:EventFilter|EventFilter[]) : object
	{
		let id:object = new Object();
		let listeners:EventListener[] = [];

		if (filter == null)
		{
			listeners.push(new EventListener(id,form,clazz,method,null));
		}
		else if (!Array.isArray(filter))
		{
			listeners.push(new EventListener(id,form,clazz,method,filter as EventFilter));
		}
		else
		{
			filter.forEach((f) => {listeners.push(new EventListener(id,form,clazz,method,f));})
		}

		listeners.forEach((lsnr) =>
		{
			let ltype:number = 0;
			if (lsnr.form != null) ltype = 1;

			if (lsnr.filter != null)
			{
				if (lsnr.filter.type == null)
				{
					if (lsnr.filter.key != null) lsnr.filter.type = EventType.Key;
					if (lsnr.filter.mouse != null) lsnr.filter.type = EventType.Mouse;
				}

				if (lsnr.filter.field != null) lsnr.filter.field = lsnr.filter.field.toLowerCase();
				if (lsnr.filter.block != null) lsnr.filter.block = lsnr.filter.block.toLowerCase();

				if (lsnr.filter.block != null) ltype = 2;
				if (lsnr.filter.field != null) ltype = 3;

				switch(ltype)
				{
					case 0: FormEvents.add(lsnr.filter.type,lsnr,FormEvents.applisteners); break;
					case 1: FormEvents.add(lsnr.filter.type,lsnr,FormEvents.frmlisteners); break;
					case 2: FormEvents.add(lsnr.filter.type,lsnr,FormEvents.blklisteners); break;
					case 3: FormEvents.add(lsnr.filter.type,lsnr,FormEvents.fldlisteners); break;
				}
			}
			else
			{
				FormEvents.listeners.push(lsnr);
			}
		});

		return(id);
	}


	public static removeListener(id:object) : void
	{
		let map:Map<EventType,EventListener[]> = null;

		for (let i = 0; i < FormEvents.listeners.length; i++)
		{
			let lsnr:EventListener = FormEvents.listeners[i];

			if (lsnr.id == id)
			{
				FormEvents.listeners = FormEvents.listeners.splice(i,1)
				break;
			}
		}

		for (let m = 0; m < 4; m++)
		{
			switch(m)
			{
				case 0: map = FormEvents.fldlisteners; break;
				case 1: map = FormEvents.blklisteners; break;
				case 2: map = FormEvents.frmlisteners; break;
				case 3: map = FormEvents.applisteners; break;
			}

			for(let key of map.keys())
			{
				let listeners:EventListener[] = map.get(key);

				for (let i = 0; listeners != null &&  i < listeners.length; i++)
				{
					if (listeners[i].id == id)
					{
						listeners = listeners.splice(i,1);
						map.set(key,listeners);

						if (listeners.length == 0)
							map.delete(key);

						break;
					}
				}
			}
		}
	}


	public static async raise(event:FormEvent) : Promise<boolean>
	{
		let listeners:EventListener[] = null;
		let done:Set<object> = new Set<object>();

		// Field Listeners
		listeners = FormEvents.merge(FormEvents.fldlisteners,event.type);
		Logger.log(Type.eventlisteners,"raise event: "+event.toString());

		for (let i = 0; i < listeners.length; i++)
		{
			let lsnr:EventListener = listeners[i];

			if (done.has(lsnr.id))
				continue;

			if (FormEvents.match(event,lsnr))
			{
				done.add(lsnr.id);

				Logger.log(Type.eventlisteners,"fieldlevel lsnr: "+lsnr);
				if (!(await FormEvents.execute(event.type,lsnr,event)))
				{
					Logger.log(Type.eventlisteners,"fieldlevel "+lsnr+" returned false");
					return(false);
				}
			}
		}

		// Block Listeners
		listeners = FormEvents.merge(FormEvents.blklisteners,event.type);

		for (let i = 0; i < listeners.length; i++)
		{
			let lsnr:EventListener = listeners[i];

			if (done.has(lsnr.id))
				continue;

			if (FormEvents.match(event,lsnr))
			{
				done.add(lsnr.id);

				Logger.log(Type.eventlisteners,"blocklevel "+lsnr);
				if (!(await FormEvents.execute(event.type,lsnr,event)))
				{
					Logger.log(Type.eventlisteners,"blocklevel "+lsnr+" returned false");
					return(false);
				}
			}
		}

		// Form Listeners
		listeners = FormEvents.merge(FormEvents.frmlisteners,event.type);

		for (let i = 0; i < listeners.length; i++)
		{
			let lsnr:EventListener = listeners[i];

			if (done.has(lsnr.id))
				continue;

			if (FormEvents.match(event,lsnr))
			{
				done.add(lsnr.id);

				Logger.log(Type.eventlisteners,"formlevel "+lsnr);
				if (!(await FormEvents.execute(event.type,lsnr,event)))
				{
					Logger.log(Type.eventlisteners,"formlevel "+lsnr+" returned false");
					return(false);
				}
			}
		}

		// App Listeners
		listeners = FormEvents.merge(FormEvents.applisteners,event.type);

		for (let i = 0; i < listeners.length; i++)
		{
			let lsnr:EventListener = listeners[i];

			if (done.has(lsnr.id))
				continue;

			if (FormEvents.match(event,lsnr))
			{
				done.add(lsnr.id);

				Logger.log(Type.eventlisteners,"applevel "+lsnr);
				if (!(await FormEvents.execute(event.type,lsnr,event)))
				{
					Logger.log(Type.eventlisteners," applevel "+lsnr+" returned false");
					return(false);
				}
			}
		}

		for (let i = 0; i < FormEvents.listeners.length; i++)
		{
			let lsnr:EventListener = FormEvents.listeners[i];

			if (done.has(lsnr.id))
				continue;

			if (FormEvents.match(event,lsnr))
			{
				done.add(lsnr.id);

				Logger.log(Type.eventlisteners,"alltypes "+lsnr);
				if (!(await FormEvents.execute(event.type,lsnr,event)))
				{
					Logger.log(Type.eventlisteners," alltypes "+lsnr+" returned false");
					return(false);
				}
			}
		}

		return(true);
	}

	private static merge(lsnrs:Map<EventType|number,EventListener[]>, type:EventType) : EventListener[]
	{
		let all:EventListener[] = [];

		let typed:EventListener[] = lsnrs.get(type);
		let untyped:EventListener[] = lsnrs.get(-1);

		if (typed != null) all.push(...typed);
		if (untyped != null) all.push(...untyped);

		return(all);
	}


	private static async execute(type:EventType,lsnr:EventListener, event:FormEvent) : Promise<boolean>
	{
		let cont:boolean = true;
		Logger.log(Type.eventlisteners,EventType[type]+" Invoking eventhandler: "+lsnr);

		let ekey:KeyMap = event.key;
		let lkey:KeyMap = lsnr.filter?.key;
		let swap:boolean = lkey != null && ekey != null;
		// Make sure event.key not only matches, but is identical

		if (swap) event["key$"] = lkey;
		let response:Promise<boolean> = lsnr.clazz[lsnr.method](event);

		if (response instanceof Promise)
		{
			await response.then((value) =>
			{
				if (typeof value !== "boolean")
				{
					Alert.fatal("@FormEvents: EventListner '"+lsnr+"' did not return Promise<boolean>, but '"+value+"'","EventListener");
					value = true;
				}

				cont = value;
			});
		}
		else
		{
			if (response != null && typeof response !== "boolean")
			{
				Alert.fatal("@FormEvents: EventListner '"+lsnr+"' did not return boolean, but '"+response+"'","EventListener");
				cont = true;
			}

			if (typeof response === "boolean")
				cont = response;
		}

		if (swap) event["key$"] = ekey;
		return(cont);
	}


	private static match(event:FormEvent, lsnr:EventListener) : boolean
	{
		if (lsnr.form != null && lsnr.form != event.form)
			return(false);

		Logger.log(Type.eventlisteners," match: "+EventType[event.type]+" "+lsnr.form.constructor.name+" event: "+event.form.constructor.name);

		if (lsnr.filter != null)
		{
			if (lsnr.filter.mouse != null && lsnr.filter.mouse != event.mouse) return(false);
			if (lsnr.filter.block != null && lsnr.filter.block != event.blockname) return(false);
			if (lsnr.filter.field != null && lsnr.filter.field != event.fieldname) return(false);
			if (lsnr.filter.key != null && lsnr.filter.key.signature != event.key?.signature) return(false);
		}

		return(true);
	}


	private static add(type:EventType, lsnr:EventListener, map:Map<EventType|number,EventListener[]>) : void
	{
		let listeners:EventListener[];

		if (type == null) listeners = map.get(-1);
		else			  listeners = map.get(type);

		if (listeners == null)
		{
			listeners = [];

			if (type == null) map.set(-1,listeners);
			else			  map.set(type,listeners);
		}

		listeners.push(lsnr);
	}
}
