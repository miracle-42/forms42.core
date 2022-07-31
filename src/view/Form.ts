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

import { Block } from './Block.js';
import { Field } from './fields/Field.js';
import { Hook } from '../control/hooks/Hook.js';
import { BrowserEvent } from './BrowserEvent.js';
import { Form as ModelForm } from '../model/Form.js';
import { Logger, Type } from '../application/Logger.js';
import { Form as InterfaceForm } from '../public/Form.js';
import { FieldInstance } from './fields/FieldInstance.js';
import { EventType } from '../control/events/EventType.js';
import { FormsModule } from '../application/FormsModule.js';
import { HookEvents } from '../control/hooks/HookEvents.js';
import { Indicator } from '../application/tags/Indicator.js';
import { KeyMap, KeyMapping } from '../control/events/KeyMap.js';
import { FormEvent, FormEvents } from '../control/events/FormEvents.js';
import { MouseMap, MouseMapParser } from '../control/events/MouseMap.js';

export class Form implements EventListenerObject
{
	private static views:Map<InterfaceForm,Form> =
		new Map<InterfaceForm,Form>();

	public static drop(parent:InterfaceForm) : void
	{
		Form.views.delete(parent);
		Form.getForm(parent);
	}

	public static current() : Form
	{
		return(Form.curform$);
	}

	public static getForm(parent:InterfaceForm) : Form
	{
		let frm:Form = Form.views.get(parent);

		if (frm == null)
			frm = new Form(parent);

		return(frm);
	}

	public static finalize(parent:InterfaceForm) : void
	{
		let form:Form = Form.views.get(parent);
		form.blocks.forEach((blk) => {blk.finalize();});
		form.addEvents(parent.getView());
		form.indicators.clear();
		form.linkModels();
	}

	private static curform$:Form = null;
	private parent$:InterfaceForm = null;
	private curinst$:FieldInstance = null;
	private blocks:Map<string,Block> = new Map<string,Block>();
	private indicators:Map<string,Indicator[]> = new Map<string,Indicator[]>();

	private constructor(parent:InterfaceForm)
	{
		this.parent$ = parent;
		Form.views.set(parent,this);
		Logger.log(Type.formbinding,"Create viewform: "+this.parent$.constructor.name);
	}

	public get parent() : InterfaceForm
	{
		return(this.parent$);
	}

	public get block() : Block
	{
		return(this.curinst$?.field.block);
	}

	public get instance() : FieldInstance
	{
		return(this.curinst$);
	}

	public getBlock(name:string) : Block
	{
		return(this.blocks.get(name));
	}

	public getBlocks() : Block[]
	{
		let blocks:Block[] = [];

		this.blocks.forEach((block) =>
			{blocks.push(block)})

		return(blocks);
	}

	public addBlock(block:Block) : void
	{
		this.blocks.set(block.name,block);
		Logger.log(Type.formbinding,"Add block '"+block.name+"' to viewform: "+this.parent$.constructor.name);
	}

	public getIndicators(block:string) : Indicator[]
	{
		let indicators:Indicator[] = this.indicators.get(block);
		if (indicators == null) return([]);
		return(indicators);
	}

	public addIndicator(ind:Indicator) : void
	{
		let block:string = ind.block.toLowerCase();
		let indicators:Indicator[] = this.indicators.get(block);

		if (indicators == null)
		{
			indicators = [];
			this.indicators.set(block,indicators);
		}

		indicators.push(ind);
	}

	public getField(block:string, field:string) : Field
	{
		return(this.getBlock(block)?.getField(field));
	}

	public focus() : void
	{
		if (this.curinst$)
		{
			this.curinst$?.focus();
			return;
		}
		else if (this.blocks.size > 0)
		{
			this.blocks.values().next().value.focus();
			return;
		}
	}

	public validated() : boolean
	{
		let valid:boolean = true;

		this.blocks.forEach((blk) =>
		{
			if (!blk.validated)
				valid = false;
		})

		if (!valid)
		{
			this.focus();
			return(false);
		}

		return(true);
	}

	public async enter(inst:FieldInstance) : Promise<boolean>
	{
		let preform:Form = null;
		let nxtblock:Block = inst.field.block;
		let recoffset:number = nxtblock.offset(inst);
		let preblock:Block = this.curinst$?.field.block;

		/**********************************************************************
			Go to form
		 **********************************************************************/

		if (this != Form.curform$)
		{
			preform = this;

			if (Form.curform$ != null)
			{
				preform = Form.curform$;

				if (!preform.validated)
				{
					preform.focus();
					return(false);
				}

				if (!await this.leaveForm(preform))
				{
					preform.focus();
					return(false);
				}
			}

			if (!await this.enterForm(this))
			{
				preform.focus();
				return(false);
			}
		}

		/**********************************************************************
			Leave this forms current record and block
		 **********************************************************************/

		if (preblock != null)
		{
			// PostField already fired on blur

			if (preblock != nxtblock)
			{
				if (!await preblock.validate())
				{
					this.focus();
					return(false);
				}

				if (!await this.leaveRecord(preblock))
				{
					this.focus();
					return(false);
				}

				if (!await this.leaveBlock(preblock))
				{
					this.focus();
					return(false);
				}
			}
			else if (recoffset != 0)
			{
				if (!await nxtblock.validate())
				{
					this.focus();
					return(false);
				}

				if (!await this.leaveRecord(preblock))
				{
					this.focus();
					return(false);
				}
			}
		}

		/**********************************************************************
			Enter this forms current block and record
		 **********************************************************************/

		if (nxtblock != preblock)
		{
			if (!await this.enterBlock(nxtblock,recoffset))
			{
				this.focus();
				return(false);
			}

			if (!await this.enterRecord(nxtblock,recoffset))
			{
				this.focus();
				return(false);
			}
		}
		else if (recoffset != 0)
		{
			if (!await this.enterRecord(nxtblock,recoffset))
			{
				this.focus();
				return(false);
			}
		}

		// Prefield

		if (!await this.enterField(inst,recoffset))
		{
			this.focus();
			return(false);
		}

		Form.curform$ = this;
		this.curinst$ = inst;
		nxtblock.setCurrentRow(inst.row);

		if (preform)
		{
			// Successfully navigated from preform to this form
			await ModelForm.getForm(this.parent).waitForEventTransaction(EventType.PostFormFocus);
			let success:boolean = await this.fireFormEvent(EventType.PostFormFocus,this.parent);
			return(success);
		}

		return(true);
	}

	public async leave(inst:FieldInstance) : Promise<boolean>
	{
		if (!await this.LeaveField(inst))
		{
			Form.curform$.focus();
			return(false);
		}
		return(true);
	}

	public async enterForm(form:Form) : Promise<boolean>
	{
		await ModelForm.getForm(this.parent).setEventTransaction(EventType.PreForm);
		let success:boolean = await this.fireFormEvent(EventType.PreForm,form.parent);
		ModelForm.getForm(this.parent).endEventTransaction(EventType.PreForm,success);
		if (success && form.parent.navigable) this.setURL();
		return(success);
	}

	public async enterBlock(block:Block, offset:number) : Promise<boolean>
	{
		await block.model.setEventTransaction(EventType.PreBlock,offset);
		let success:boolean = await this.fireBlockEvent(EventType.PreBlock,block.name);
		block.model.endEventTransaction(EventType.PreBlock,success);
		return(success);
	}

	public async enterRecord(block:Block, offset:number) : Promise<boolean>
	{
		await block.model.setEventTransaction(EventType.PreRecord,offset);
		let success:boolean = await this.fireBlockEvent(EventType.PreRecord,block.name);
		block.model.endEventTransaction(EventType.PreRecord,success);
		return(success);
	}

	public async enterField(inst:FieldInstance, offset:number) : Promise<boolean>
	{
		await inst.field.block.model.setEventTransaction(EventType.PreField,offset);
		let success:boolean = await this.fireFieldEvent(EventType.PreField,inst);
		inst.field.block.model.endEventTransaction(EventType.PreField,success);
		return(success);
	}

	public async leaveForm(form:Form) : Promise<boolean>
	{
		await ModelForm.getForm(this.parent).waitForEventTransaction(EventType.PostForm);
		let success:boolean = await this.fireFormEvent(EventType.PostForm,form.parent);
		return(success);
	}

	public async leaveBlock(block:Block) : Promise<boolean>
	{
		await block.model.waitForEventTransaction(EventType.PostBlock);
		let success:boolean = await this.fireBlockEvent(EventType.PostBlock,block.name);
		return(success);
	}

	public async leaveRecord(block:Block) : Promise<boolean>
	{
		await block.model.waitForEventTransaction(EventType.PostRecord);
		let success:boolean = await this.fireBlockEvent(EventType.PostRecord,block.name);
		return(success);
	}

	public async LeaveField(inst:FieldInstance) : Promise<boolean>
	{
		await inst.field.block.model.waitForEventTransaction(EventType.PostField);
		let success:boolean = await this.fireFieldEvent(EventType.PostField,inst);
		return(success);
	}

	private event:BrowserEvent = new BrowserEvent();
	public async handleEvent(event:any) : Promise<void>
	{
        let bubble:boolean = false;
		this.event.setEvent(event);

		if (this.event.type == "wait")
			await this.event.wait();

		if (this.event.waiting)
			return;

		if (this.event.accept || this.event.cancel)
			bubble = true;

		if (this.event.bubbleMouseEvent)
			bubble = true;

		if (this.event.onScrollUp)
			bubble = true;

        if (this.event.onScrollDown)
			bubble = true;

        if (this.event.onCtrlKeyDown)
			bubble = true;

        if (this.event.onFuncKey)
			bubble = true;

		this.event.preventDefault();

		if (bubble)
		{
			if (this.event.type.startsWith("key"))
			{
				let key:KeyMap = KeyMapping.parseBrowserEvent(event);
				let keyevent:FormEvent = FormEvent.KeyEvent(this.parent,null,key);

				if (await ModelForm.getForm(this.parent).waitForEventTransaction(EventType.Key))
					await FormEvents.raise(keyevent);
			}
			else
			{
				let mevent:MouseMap = MouseMapParser.parseBrowserEvent(event);
				let mouseevent:FormEvent = FormEvent.MouseEvent(this.parent,mevent);

				if (ModelForm.getForm(this.parent).waitForEventTransaction(EventType.Mouse))
					await FormEvents.raise(mouseevent);
			}
		}
	}

	private linkModels() : void
	{
		this.blocks.forEach((blk) => {blk.linkModel();});
	}

	private setURL() : void
	{
		let location:Location = window.location;
		let params:URLSearchParams = new URLSearchParams(location.search);
		let path:string = location.protocol + '//' + location.host + location.pathname;

		let map:string = FormsModule.getFormPath(this.parent.constructor.name);

		if (map != null && this.parent.navigable)
		{
			params.set("form",map)
			window.history.replaceState('', '',path+"?"+params);
		}
	}

	private async fireFormEvent(type:EventType, form:InterfaceForm) : Promise<boolean>
	{
		let frmevent:FormEvent = FormEvent.FormEvent(type,form);
		return(FormEvents.raise(frmevent));
	}

	private async fireBlockEvent(type:EventType, block:string) : Promise<boolean>
	{
		let frmevent:FormEvent = FormEvent.BlockEvent(type,this.parent,block);
		return(FormEvents.raise(frmevent));
	}

	private async fireFieldEvent(type:EventType, inst:FieldInstance) : Promise<boolean>
	{
		let frmevent:FormEvent = FormEvent.FieldEvent(type,inst);
		return(FormEvents.raise(frmevent));
	}

    private addEvents(element:HTMLElement) : void
    {
        element.addEventListener("keyup",this);
        element.addEventListener("keydown",this);
        element.addEventListener("keypress",this);

        element.addEventListener("click",this);
        element.addEventListener("dblclick",this);
        element.addEventListener("contextmenu",this);
    }
}