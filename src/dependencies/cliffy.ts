import { Input, InputOptions } from 'https://deno.land/x/cliffy@v0.25.7/prompt/input.ts';
import { Select, SelectOptions } from 'https://deno.land/x/cliffy@v0.25.7/prompt/select.ts';
import { Number, NumberOptions } from 'https://deno.land/x/cliffy@v0.25.7/prompt/number.ts';
import { List, ListOptions } from 'https://deno.land/x/cliffy@v0.25.7/prompt/list.ts';

export async function promptString (options: InputOptions) {
  return await Input.prompt(options);
}

export async function promptSelect (options: SelectOptions) {
  return await Select.prompt(options);
}

export function promptNumber (options: NumberOptions) {
  return Number.prompt(options);
}

export function promptList (options: ListOptions) {
  return List.prompt(options);
}
