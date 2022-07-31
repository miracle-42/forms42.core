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

import { Tag } from "./Tag.js";
import { Class } from "../../types/Class.js";
import { Properties } from "../Properties.js";
import { FormsModule } from "../FormsModule.js";
import { HTMLFragment } from "../HTMLFragment.js";
import { ComponentFactory } from "../ComponentFactory.js";


export class Include implements Tag
{
    public parse(_component:any, tag:HTMLElement, _attr:string) : HTMLElement
    {
        let module:FormsModule = FormsModule.get();

        let src:string = tag.getAttribute("src");
        let impl:Class<any> = module.getComponent(src);
        let factory:ComponentFactory = Properties.FactoryImplementationClass;

        if (impl == null)
            throw "@Include: No class mapped tp "+src;

        let incl:HTMLFragment = factory.createFragment(impl);
        return(incl.content as HTMLElement);
    }
}