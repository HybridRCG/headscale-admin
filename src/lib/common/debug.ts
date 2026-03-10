import { App } from "$lib/States.svelte";
import { version as pkgVersion } from '../../../package.json';
export const version = pkgVersion;
export function debug(...data: unknown[]) {
        // output if console debugging is enabled
        if (App.debug.value) {
                console.log(new Date().toLocaleTimeString('en-US', { hour12: false }), ...data);
        }
}
