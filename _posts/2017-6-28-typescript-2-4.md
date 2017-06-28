---
layout: post
title: "TypeScript 2.4: Return Type as Type Inference Target"
tags:
- TypeScript
---

TypeScript 2.4 is out today, it comes with refined type inference which now process return value as type inference target. 

## Return Value as Type Inference Target

If you ever use TypeScript to return `Promise` you will notice something odd with the type check, for example on below code

```typescript
function myFunc(): Promise<string> {
    return new Promise(resolve => {
        resolve(250)
    })
}
```

Prior to version 2.4 above code will compile properly. Above code showing a function `myFunc` which should return a `Promise<string>`. `Promise<string>` constructor receive a `resolve(value:string)` callback. Lets extract the promise on above code to get more clarity

```typescript
let myPromise = new Promise(resolve => {
    resolve(250)
})
```

Above code `myPromise` will inferred as a `Promise<number>` type because we provide number parameter `resolve(250)` on its resolve callback. Without type inference we can rewrite our first code  explicitly like below

```typescript
function myFunc(): Promise<string> {
    return new Promise<number>(resolve => {
        resolve(250)
    })
}
```

Now we notice that our first code is clearly flaw because we returned a `Promise<number>` instead of `Promise<string>` required by `myFunc()` function.

## Inheritance Issue

With this feature TypeScript now can identify issue on inheritance when using Promise as a return value. 

```typescript
interface MyInterface {
    myFunc(): Promise<string>
}

class MyClass implements MyInterface {
    myFunc() {
        return new Promise(x => {
            x(250)
        })
    }
}
```

Above code showing we implement `myFunc()` on `MyClass` but doesn't specify a return type, logically TypeScript should understand that it should return `Promise<string>` defined in its interface.

Prior to version 2.4 above code will compile properly, but version 2.4 the compiler notice the issue correctly, but it still can't compile below code.

```typescript
interface MyInterface {
    myFunc(): Promise<string>
}

class MyClass implements MyInterface {
    myFunc() {
        return new Promise(x => {
            x("Hello World")
        })
    }
}
```

Logically above code should compile properly because we provide `Promise<string>` implicitly. But et least TypeScript can identify the issue correctly. Above code can be fixed by define promise explicitly like below:

```typescript
interface MyInterface {
    myFunc(): Promise<string>
}

class MyClass implements MyInterface {
    myFunc() {
        return new Promise<string>(x => {
            x("Hello World")
        })
    }
}
```

As a last word, I think this fix will help me a lot because recently i love to have a lot of Promises in [KambojaJS](http://kambojajs.com/) ;)