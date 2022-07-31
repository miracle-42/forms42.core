import { Form } from '../../public/Form.js';
import { Class } from '../../types/Class.js';
import { HTMLFragment } from '../HTMLFragment.js';

export interface ComponentFactory
{
    createBean(bean:Class<any>) : any;
    createForm(form:Class<Form>) : Promise<Form>;
    createFragment(frag:Class<any>) : HTMLFragment;
}