---
layout: post
title: Destructuring and Async/Await
tags:
- javascript
---

In javascript, when working with asynchronous, its really hard to get a clean code. 
For example to perform 4 functions with completion callback, the easiest way 
is to call one after another in sequence manner.

for example you have 4 functions below:

```javascript
//done -> function(result, err){}
function getUserLastActivity(userId, done)
function getCurrentBalance(userId, done)
function getUserLog(userId, done)
function getUserActiveStatus(userId, done)
```

All those functions is asynchronous which has a completion callback
at the end of its parameter.

Technically all those functions doesn't need to wait each other to complete, so it 
should be run at the same time (in parallel). Easy to say, but the implementation is 
like pain in the a*s. The easiest way is below:

```javascript
getUserLastActivity(userId, function(lastActivity, er){
    if(!er){
        getCurrentBalance(userId, function(currentBalance, er){
            if(!er){
                getUserLog(userId, function(userLog, er){
                    if(!er){
                        getUserActiveStatus(userId, function(activityStatus, er){
                            //here is your code
                        })
                    }
                })
            }
        })
    }
})
```

Welcome to the Pyramid of Doom, the Callback Hell. The code far from clarity, 
and also the performance, because instead of run in parallel it run sequential.

TYPESCRIPT ASYNC/AWAIT 
----------------------
Lets review the code with ES6/ES7 Promise and use TypeScript async/await. All those 
4 functions should be modified and return Promise

```javascript
function getUserLastActivityAsync(userId){
    return new Promise((resolve, reject) => {
        getUserLastActivity(userId, function(lastActivity, er){
        if(!er)
            reject(er);
        else
            resolve(lastActivity);
    });
}
```

Modification needed for all method that using callback to use async/await. 
It is required to return Promise.

By using async/await all those method can be called in parallel manner like below:

```javascript
try{
    var [lastActivity, currentBalance, userLog, activityStatus] = await Promise.all([
        getUserLastActivity(userId),
        getCurrentBalance(userId),
        getUserLog(userId),
        getUserActiveStatus(userId)
    ]);
}
catch(er){
    //do something when error
}
```

Compare the code with our previous Pyramid of Doom, the code even now is single lined.
there are several thing important on the code above:

**Destructuring:** The result of `Promise.all` is an array, notice on the code above
the result is not an array, but automatically assigned to specified variables 
`lastActivity, currentBalance, userLog, activityStatus`. That feature
called Destructuring supported by TypeScript since [version 1.5](https://github.com/Microsoft/TypeScript/wiki/Roadmap#15)

**Error handling:** In some case, error handling is a flow control, its mean when the 
first line produce error, the rest of the code sequence should be terminated. When using 
callback its nearly impossible to use try-catch to control flow because its 
asynchronous. 

LIMITATION
----------
Destructuring and Async/Await only supported by ES7 engine, for lower compatibility 
it is required to use TypeScript, but its also have some limitations. Async/Await in
typescript actually used [yield](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/yield) 
feature of ES6, the TypeScript team still working on to make it available for 
[ES5 and ES3](https://github.com/Microsoft/TypeScript/wiki/Roadmap#21-november-2016). 