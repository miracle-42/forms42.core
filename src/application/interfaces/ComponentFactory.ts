import { Form } from '../../public/Form.js';
import { Class } from '../../types/Class.js';
import { HTMLFragment } from '../HTMLFragment.js';

export interface ComponentFactory
{
    createBean(bean:Class<any>) : any;
    createFragment(frag:Class<any>) : HTMLFragment;
    createForm(form:Class<Form>, parameters?:Map<any,any>) : Promise<Form>;
}