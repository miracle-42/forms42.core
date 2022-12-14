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

import { Status } from './Row.js';
import { Block } from './Block.js';
import { Record } from '../model/Record.js';
import { Alert } from '../application/Alert.js';
import { DataType } from './fields/DataType.js';
import { BrowserEvent } from './BrowserEvent.js';
import { Classes } from '../internal/Classes.js';
import { Form as ModelForm } from '../model/Form.js';
import { Logger, Type } from '../application/Logger.js';
import { Block as ModelBlock } from '../model/Block.js';
import { ListOfValues } from '../public/ListOfValues.js';
import { Form as InterfaceForm } from '../public/Form.js';
import { FieldInstance } from './fields/FieldInstance.js';
import { EventType } from '../control/events/EventType.js';
import { FormBacking } from '../application/FormBacking.js';
import { FormsModule } from '../application/FormsModule.js';
import { DateConstraint } from '../public/DateConstraint.js';
import { FieldProperties } from '../public/FieldProperties.js';
import { KeyMap, KeyMapping } from '../control/events/KeyMap.js';
import { FlightRecorder } from '../application/FlightRecorder.js';
import { RowIndicator } from '../application/tags/RowIndicator.js';
import { FormEvent, FormEvents } from '../control/events/FormEvents.js';
import { MouseMap, MouseMapParser } from '../control/events/MouseMap.js';
import { FilterIndicator } from '../application/tags/FilterIndicator.js';
import { ApplicationHandler } from '../control/events/ApplicationHandler.js';

export class Form implements EventListenerObject
{
	public static current() : Form
	{
		return(FormBacking.getCurrentViewForm());
	}

	private modfrm$:ModelForm = null;
	private parent$:InterfaceForm = null;
	private curinst$:FieldInstance = null;
	private blocks$:Map<string,Block> = new Map<string,Block>();
	private indicators:Map<string,RowIndicator[]> = new Map<string,RowIndicator[]>();
	private fltindicators:Map<string,FilterIndicator[]> = new Map<string,FilterIndicator[]>();

	constructor(parent:InterfaceForm)
	{
		this.parent$ = parent;
		FormBacking.setViewForm(parent,this);
		this.modfrm$ = FormBacking.getModelForm(this.parent,true);
		Logger.log(Type.formbinding,"Create viewform: "+this.parent.name);
	}

	public get name() : string
	{
		return(this.parent.name);
	}

	public get parent() : InterfaceForm
	{
		return(this.parent$);
	}

	public get model() : ModelForm
	{
		return(this.modfrm$);
	}

	public get block() : Block
	{
		return(this.curinst$?.field.block);
	}

	public get instance() : FieldInstance
	{
		return(this.curinst$);
	}

	public async clear() : Promise<boolean>
	{
		if (!await this.model.flush())
			return(false);

		this.blocks$.forEach((block) =>
		{block.clear(true,true,true)})

		return(true);
	}

	public getBlock(name:string) : Block
	{
		return(this.blocks$.get(name));
	}

	public getBlocks() : Block[]
	{
		let blocks:Block[] = [];

		this.blocks$.forEach((block) =>
			{blocks.push(block)})

		return(blocks);
	}

	public addBlock(block:Block) : void
	{
		this.blocks$.set(block.name,block);
		Logger.log(Type.formbinding,"Add block '"+block.name+"' to viewform: "+this.parent.name);
	}

	public getIndicators(block:string) : RowIndicator[]
	{
		let indicators:RowIndicator[] = this.indicators.get(block);
		if (indicators == null) return([]);
		return(indicators);
	}

	public addIndicator(ind:RowIndicator) : void
	{
		let block:string = ind.binding.toLowerCase();
		let indicators:RowIndicator[] = this.indicators.get(block);

		if (indicators == null)
		{
			indicators = [];
			this.indicators.set(block,indicators);
		}

		indicators.push(ind);
	}

	public setFilterIndicator(block:ModelBlock,flag:boolean)
	{
		block.view.setFilterIndicators(this.fltindicators.get(block.name),flag);
	}

	public addFilterIndicator(ind:FilterIndicator) : void
	{
		let block:string = ind.binding.toLowerCase();
		let fltindicators:FilterIndicator[] = this.fltindicators.get(block);

		if (fltindicators == null)
		{
			fltindicators = [];
			this.fltindicators.set(block,fltindicators);
		}

		fltindicators.push(ind);
	}

	public focus() : void
	{
		if (this.curinst$)
		{
			this.curinst$?.focus();
			return;
		}
		else if (this.blocks$.size > 0)
		{
			this.blocks$.values().next().value.focus();
			return;
		}
	}

	public async validate() : Promise<boolean>
	{
		let inst:FieldInstance = this.curinst$;

		if (inst == null)
			return(true);

		if (!await inst.field.block.validate())
			return(false);

		return(this.model.flush());
	}

	public validated() : boolean
	{
		let valid:boolean = true;

		this.blocks$.forEach((blk) =>
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

		if (this != Form.current())
		{
			// When modal call, allow leaving former form in any state

			let backing:FormBacking = FormBacking.getBacking(this.parent);

			if (backing == null)
			{
				Alert.fatal("Cannot find backing bean for '"+this.name+"'. Current form '"+Form.current?.name+"'","Enter Form");
				return(false);
			}

			if (!backing.wasCalled)
			{
				preform = this;

				if (Form.current() != null)
				{
					preform = Form.current();

					if (!await preform.validate())
					{
						FlightRecorder.debug("Form '"+preform.name+"' not validated");
						preform.focus();
						return(false);
					}

					if (!await this.leaveForm(preform))
					{
						preform.focus();
						return(false);
					}
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
					FlightRecorder.debug("Block '"+preblock.name+"' not validated");
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
				if (!await nxtblock.validateRow())
				{
					FlightRecorder.debug("Row in '"+nxtblock.name+"' not validated");
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

		this.curinst$ = inst;
		inst.field.block.current = inst;
		FormBacking.setCurrentForm(this);
		nxtblock.setCurrentRow(inst.row,true);

		if (preform)
		{
			// Successfully navigated from preform to this form
			if (!this.model.wait4EventTransaction(EventType.PostFormFocus,null)) return(false);
			let success:boolean = await this.fireFormEvent(EventType.PostFormFocus,this.parent);
			return(success);
		}

		return(true);
	}

	public async leave(inst:FieldInstance) : Promise<boolean>
	{
		if (!await this.LeaveField(inst))
		{
			Form.current().focus();
			return(false);
		}
		return(true);
	}

	public async enterForm(form:Form) : Promise<boolean>
	{
		if (!await this.setEventTransaction(EventType.PreForm)) return(false);
		let success:boolean = await this.fireFormEvent(EventType.PreForm,form.parent);
		this.model.endEventTransaction(EventType.PreForm,null,success);
		if (success && form.parent.navigable) this.setURL();
		return(success);
	}

	public async enterBlock(block:Block, offset:number) : Promise<boolean>
	{
		if (!await this.setEventTransaction(EventType.PreForm,block,offset)) return(false);
		let success:boolean = await this.fireBlockEvent(EventType.PreBlock,block.name);
		block.model.endEventTransaction(EventType.PreBlock,success);
		return(success);
	}

	public async enterRecord(block:Block, offset:number) : Promise<boolean>
	{
		if (!await this.setEventTransaction(EventType.PreRecord,block,offset)) return(false);
		let success:boolean = await this.fireBlockEvent(EventType.PreRecord,block.name);
		block.model.endEventTransaction(EventType.PreRecord,success);
		return(success);
	}

	public async enterField(inst:FieldInstance, offset:number) : Promise<boolean>
	{
		if (!await this.setEventTransaction(EventType.PreField,inst.field.block,offset)) return(false);
		let success:boolean = await this.fireFieldEvent(EventType.PreField,inst);
		inst.field.block.model.endEventTransaction(EventType.PreField,success);
		return(success);
	}

	public async leaveForm(form:Form) : Promise<boolean>
	{
		if (!await this.model.wait4EventTransaction(EventType.PostForm,null)) return(false);
		let success:boolean = await this.fireFormEvent(EventType.PostForm,form.parent);
		return(success);
	}

	public async leaveBlock(block:Block) : Promise<boolean>
	{
		if (!await block.model.wait4EventTransaction(EventType.PostBlock)) return(false);
		let success:boolean = await this.fireBlockEvent(EventType.PostBlock,block.name);
		if (success) success = await block.model.flush();
		return(success);
	}

	public async leaveRecord(block:Block) : Promise<boolean>
	{
		if (!await block.model.wait4EventTransaction(EventType.PostRecord)) return(false);
		let success:boolean = await this.fireBlockEvent(EventType.PostRecord,block.name);
		return(success);
	}

	public async LeaveField(inst:FieldInstance) : Promise<boolean>
	{
		if (!await inst.field.block.model.wait4EventTransaction(EventType.PostField)) return(false);
		let success:boolean = await this.fireFieldEvent(EventType.PostField,inst);
		return(success);
	}

	public async sendkey(key:KeyMap, block?:string, field?:string, clazz?:string) : Promise<boolean>
	{
		block = block?.toLowerCase();
		field = field?.toLowerCase();

		if (this.curinst$)
		{
			if (!field) field = this.curinst$.field.name;
			if (!block) block = this.curinst$.field.block.name;
		}

		if (!block || !field)
		{
			Alert.warning("field or block undefined","Send Key");
			return(false);
		}

		if (this.curinst$)
		{
			if (field == this.curinst$.field.name && block == this.curinst$.field.block.name)
			{
				if (!clazz || (clazz && !this.curinst$.properties.hasClass(clazz)))
				{
					this.curinst$.focus();
					return(this.keyhandler(key,this.curinst$));
				}
			}
		}

		let blk:Block = this.getBlock(block.toLowerCase());
		let match:FieldInstance[] = blk?.getFieldsByClass(field,clazz);

		if (!match || match.length == 0)
		{
			Alert.warning("unable to locate field '"+field+"' or block '"+block+"'","Send Key");
			return(false);
		}

		match[0].focus();
		return(this.keyhandler(key,match[0]));
	}

	public async keyhandler(key:KeyMap, inst?:FieldInstance) : Promise<boolean>
	{
		let success:boolean = false;
		if (key == null) return(true);

		let block:Block = inst?.field.block;
		let mblock:ModelBlock = inst?.field.block.model;

		if (key == KeyMap.enter)
		{
			if (mblock && mblock.querymode) key = KeyMap.executequery;
			else if (this.curinst$?.field.block.model.querymode) key = KeyMap.executequery;
		}

		let frmevent:FormEvent = FormEvent.KeyEvent(this.parent,inst,key);

		if (key == KeyMap.dump)
		{
			FlightRecorder.dump();
			return(true);
		}

		if (!await FormEvents.raise(frmevent))
			return(false);

		if (inst == null)
		{
			if (key == KeyMap.lov)
				inst = this.curinst$;

			if (key == KeyMap.calendar)
				inst = this.curinst$;

			if (key == KeyMap.delete)
				inst = this.curinst$;

			if (key == KeyMap.refresh)
				inst = this.curinst$;

			if (key == KeyMap.lastquery)
				inst = this.curinst$;

			if (key == KeyMap.enterquery)
				inst = this.curinst$;

			if (key == KeyMap.executequery)
				inst = this.curinst$;

			if (key == KeyMap.insert || KeyMap.insertAbove)
				inst = this.curinst$;

			block = inst?.field.block;
			mblock =	inst?.field.block.model;
		}

		if (inst != null)
		{
			let qmode:boolean = mblock?.querymode;

			if (key == KeyMap.clearblock)
				return(inst.field.block.model.clear());

			if (KeyMapping.isRowNav(key))
			{
				success = await block.navigateRow(key,inst);
				return(success);
			}

			if (KeyMapping.isBlockNav(key))
			{
				success = await block.navigateBlock(key,inst);
				return(success);
			}

			if (KeyMapping.isFormNav(key))
			{
				success = await this.navigateForm(key,inst);;
				return(success);
			}

			if (key == KeyMap.escape)
			{
				if (inst.field.row.status == Status.qbe)
				{
					this.model.cancelQueryMode(inst.field.block.model);
					return(success);
				}

				if (inst.field.row.status == Status.new || inst.field.row.status == Status.insert)
					key = KeyMap.delete;
			}

			if (key == KeyMap.enter)
			{
				if (inst.field.block.empty())
					return(true);

				success = await block.validateRow();
				return(success);
			}

			if (key == KeyMap.refresh)
			{
				if (qmode)
					return(false);

				if (inst.field.block.empty())
					return(true);

				await mblock.refresh();
				return(true);
			}

			if (key == KeyMap.lastquery)
			{
				if (qmode) mblock.showLastQuery();
				return(true);
			}

			if (key == KeyMap.enterquery)
			{
				if (qmode) return(true);
				success = await this.model.enterQuery(inst.field.block.model);
				if (success) block.findFirstEditable(block.model.qberec)?.focus();
				return(success);
			}

			if (key == KeyMap.executequery)
			{
				inst.ignore = "blur"; inst.blur();
				success = await this.model.executeQuery(inst.field.block.model);
				this.model.getQueryMaster()?.view.focus(false);
				return(success);
			}

			if (key == KeyMap.queryeditor)
			{
				if (!qmode) return(false);

				if (!inst.qbeProperties.advquery)
					return(true);

				let params:Map<string,any> = new Map<string,any>();

				params.set("form",this.parent);
				params.set("field",inst.name);
				params.set("block",inst.block);
				params.set("value",inst.getValue());
				params.set("type",DataType[block.fieldinfo.get(inst.name).type]);
				params.set("properties",new FieldProperties(inst.defaultProperties));

				await this.parent.callform(Classes.QueryEditorClass,params);
				return(true);
			}

			if (key == KeyMap.insert)
			{
				if (qmode) return(false);

				if (!await inst.field.validate(inst))
					return(false);

				if (!mblock.ctrlblk && mblock.insertallowed)
					mblock.insert(false);

				return(true);
			}

			if (key == KeyMap.insertAbove)
			{
				if (qmode) return(false);

				if (!await inst.field.validate(inst))
					return(false);

				if (!mblock.ctrlblk && mblock.insertallowed)
					mblock.insert(true);

				return(true);
			}

			if (key == KeyMap.delete)
			{
				if (qmode) return(false);

				if (inst.field.row.status == Status.na)
					return(false);

				let ok:boolean = mblock.deleteallowed;

				if (inst.field.row.status == Status.new)
					ok = true;

				if (inst.field.row.status == Status.insert)
					ok = true;

				if (!mblock.ctrlblk && ok)
					mblock.delete();

				return(true);
			}

			// Allow Lov and Calendar to map to same key
			if (key?.signature == KeyMap.lov.signature)
			{
				if (mblock.empty && !qmode)
					return(true);

				let backing:FormBacking = FormBacking.getBacking(this.parent);
				let lov:ListOfValues = backing.getListOfValues(inst.block,inst.name);

				if (lov != null)
				{
					if (qmode && lov.inQueryMode == false)
						return(true);

					if (!qmode && inst.properties.readonly && !lov.inReadOnlyMode)
						return(true);

					if (await this.showListOfValues(inst.block,inst.name))
						return(true);
				}
			}

			// As with Lov
			if (key?.signature == KeyMap.calendar.signature)
			{
				if (mblock.empty && !qmode)
					return(true);

				if (inst.properties.readonly)
					return(true);

				if (await this.showDatePicker(inst.block,inst.name))
					return(true);
			}
		}

		if (!await ApplicationHandler.instance.keyhandler(key))
			return(false);

		return(true);
	}

	public async mousehandler(mevent:MouseMap, inst?:FieldInstance) : Promise<boolean>
	{
		let frmevent:FormEvent = FormEvent.MouseEvent(this.parent,mevent,inst);

		if (!await FormEvents.raise(frmevent))
			return(false);

		if (!await ApplicationHandler.instance.mousehandler(mevent))
			return(false);

		return(true);
	}

	public async showDatePicker(block:string, field:string) : Promise<boolean>
	{
		let blk:Block = this.getBlock(block);
		let type:DataType = blk.fieldinfo.get(field)?.type;

		if (type == DataType.date || type == DataType.datetime)
		{
			let value:Date = blk.model.getValue(field);
			let params:Map<string,any> = new Map<string,any>();
			let backing:FormBacking = FormBacking.getBacking(this.parent);
			let datecstr:DateConstraint = backing.getDateConstraint(block,field)

			params.set("field",field);
			params.set("block",block);
			params.set("value",value);
			params.set("form",this.parent);
			params.set("constraint",datecstr);
			this.parent.callform(Classes.DatePickerClass,params);

			return(true);
		}

		return(false);
	}

	public async showListOfValues(block:string, field:string) : Promise<boolean>
	{
		let params:Map<string,any> = new Map<string,any>();
		let backing:FormBacking = FormBacking.getBacking(this.parent);
		let lov:ListOfValues = backing.getListOfValues(block,field);

		if (lov != null)
		{
			params.set("field",field);
			params.set("block",block);
			params.set("properties",lov);
			params.set("form",this.parent);
			this.parent.callform(Classes.ListOfValuesClass,params);
			return(true);
		}

		return(false);
	}

	public async navigateForm(key:KeyMap, inst:FieldInstance) : Promise<boolean>
	{
		let next:Block = null;

		switch(key)
		{
			case KeyMap.nextblock :
			{
				let blks:Block[] = [...this.blocks$.values()];

				let nxt:boolean = false;
				next = blks[blks.length-1];

				for (let i = 0; i < blks.length; i++)
				{
					if (nxt)
					{
						next = blks[i];
						break;
					}

					if (blks[i] == inst.field.block)
						nxt = true;
				}

				break;
			}

			case KeyMap.prevblock :
			{
				let blks:Block[] = [...this.blocks$.values()];

				next = blks[0];
				let nxt:boolean = false;

				for (let i = blks.length-1; i >= 0; i--)
				{
					if (nxt)
					{
						next = blks[i];
						break;
					}

					if (blks[i] == inst.field.block)
						nxt = true;
				}

				break;
			}
		}

		if (next) next.focus();
		return(next != null);
	}

	private async setEventTransaction(event:EventType, block?:Block, offset?:number) : Promise<boolean>
	{
		let record:Record = null;

		if (block != null)
		{
			if (offset == null) offset = 0;
			record = block.model.getRecord(offset);
		}

		return(this.model.setEventTransaction(event,block?.model,record));
	}

	private event:BrowserEvent = BrowserEvent.get();
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
				let key:KeyMap = KeyMapping.parseBrowserEvent(this.event);
				await this.keyhandler(key);
			}
			else
			{
				let mevent:MouseMap = MouseMapParser.parseBrowserEvent(this.event);
				await this.mousehandler(mevent);
			}
		}
	}

	private setURL() : void
	{
		let location:Location = window.location;
		let params:URLSearchParams = new URLSearchParams(location.search);
		let path:string = location.protocol + '//' + location.host + location.pathname;

		let map:string = FormsModule.getFormPath(this.parent.name);

		if (map != null && this.parent.navigable)
		{
			params.set("form",map)
			window.history.replaceState('', '',path+"?"+params);
		}
	}

	public async finalize() : Promise<void>
	{
		this.blocks$.forEach((blk) => {blk.finalize();});
		this.addEvents(this.parent.getView());
		this.indicators.clear();
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