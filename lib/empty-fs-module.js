// Empty module to replace @nodelib/fs modules on client-side
const emptyFunction = () => Promise.resolve([]);
const emptyAsyncFunction = () => Promise.resolve();

export const scandir = emptyFunction;
export const scandirSync = () => [];

export const stat = emptyAsyncFunction;
export const statSync = () => ({});

export const walk = emptyFunction;
export const walkSync = () => [];

export const readdir = emptyFunction;
export const readdirSync = () => [];
export const lstat = emptyAsyncFunction;
export const lstatSync = () => ({});

export default {
    scandir,
    scandirSync,
    stat,
    statSync,
    walk,
    walkSync,
    readdir,
    readdirSync,
    lstat,
    lstatSync,
};