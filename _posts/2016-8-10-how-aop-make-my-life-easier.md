---
layout: post
title: How AOP makes my life easier
tags:
- c#
- pattern
---

Here at VetVision, we build a complex web app with a massive database call 
in a single request. Yes its by design! the idea was serving an aggregate 
view for user, so it makes user life easier - yet us as the developer.

The good thing when working with ASP.Net MVC is you are free to create [child 
action](http://stackoverflow.com/a/12530055/212706) as many as you like to 
prevent duplication. Its great! but it also introduce another problem. 
Imagine you have a RocketScienceController like below

```csharp
public class RocketScienceController : Controller 
{
    public ActionResult Index()
    {
        var userDetail = db.GetUserDetail();
        //other process
        return View();
    }

    [ChildOnly]
    public ActionResult MyPopup()
    {
        var userDetail = db.GetUserDetail();
        //other process
        return PartialView();
    }
}
```

User info is required in the `Index` action and also `MyPopup` action.
so it called separately in each action.

Notice any problem yet? No? no problem because the real problem occurs
in the cshtml. Imagine if the RocketScienceController/Index view hosting 
the popup like below

```html
<div class="body">
    <!-- other html elemets -->

    @Html.Action("MyPopup")
</div>
```

Now you notice the problem. On every request of RocketScienceController/Index
will call `db.GetUserDetail()` twice, with non modular approach (without Child Action)
it only need to call once. Is there a way to avoid it? Yes there 
are many ways, but the path will be difficult.

GLOBAL CACHING
-------------
I found than the easiest way to solve the problem is by adding global caching 
on each method call. Lets asume that i have created a Global Cache provider
that use Asp.Net Cache Provider, with timeout set to 5 seconds. Why 5 seconds?
its depends on how often the data will be changed, in our apps the data change 
is quite fast, so I set the cache timeout equals with how fast my server 
will provide a single request. I put average estimation time to 5 seconds. 
So when a user commit a data change, on the next request the cache is already timeout,
and user provided with the new data not the cache.
My RocketScienceController then changed like below:

```csharp
public class RocketScienceController : Controller 
{
    const string UserDetailCache = "GetUserDetail";
    public ActionResult Index()
    {
        var userDetail = cacheProvider.Get<UserDetailModel>(UserDetailCache);
        if(userDetail == null)
        {
            userDetail = db.GetUserDetail();
            cacheProvider.Set(UserDetailCache, userDetail);
        }
        //other process
        return View();
    }

    [ChildOnly]
    public ActionResult MyPopup()
    {
        var userDetail = cacheProvider.Get<UserDetailModel>(UserDetailCache);
        if(userDetail == null)
        {
            userDetail = db.GetUserDetail();
            cacheProvider.Set(UserDetailCache, userDetail);
        }
        //other process
        return PartialView();
    }
}
```

From performance perspective, the page will be run efficiently, because  
`db.GetUserDetail()` only called once, the next call (on the same request)
will be provided from the cache. Neat! but from programmer perspective 
it introduce more problem. Imagine if you have 5 method calls in one action
it will make the overal code hard to read.

ENTER THE AOP
-------------
Almost all projects here at VetVision developed using
[Dependency Injection](https://en.wikipedia.org/wiki/Dependency_injection) 
framework, using Castle Windsor. Best thing about Castle Windsor is its API clairity
and its support to [Interception](https://github.com/castleproject/Windsor/blob/master/docs/interceptors.md)
by using Interception we can do a simple AOP by providing an [Advice](http://stackoverflow.com/a/25779864/212706) 
in the interceptor.

By reviewing the last RocketScienceController code, we can use Interception 
and remove all if - else brace and just leave the `db.GetUserDetail()` call. The 
interceptor is like below.

```csharp
public class CoolCacheInterceptor : IInterceptor
{
    public void Intercept(IInvocation invocation)
    {
        var cacheId = CreateId(invocation)
        var cache = cacheProvider.Get<object>(cacheId);
        if(cache == null)
        {
            cache = invocation.Proceed();
            cacheProvider.Set(cacheId, cache);
        }
        invocation.ReturnValue = cache;
    }

    private string CreateId(IInvocation invocation)
    {
        var methodName = invocation.Method.ToString();
        var arguments = invocation.Arguments.Select(a => a.ToString()).ToArray();
        var argsString = string.Join(",", arguments);
        var cacheKey = methodName + "-" + argsString;
        return cacheKey;
    }
}
```

The RocketScienceController then get a little modification, with Constructor Injection.

```csharp
public class RocketScienceController : Controller 
{
    IDataContext db;
    public RocketScienceController(IDataContext db)
    {
        this.db = db;
    }

    public ActionResult Index()
    {
        var userDetail = db.GetUserDetail();
        //other process
        return View();
    }

    [ChildOnly]
    public ActionResult MyPopup()
    {
        var userDetail = db.GetUserDetail();
        //other process
        return PartialView();
    }
}
```

See the difference with previous code? yes its call to `db.GetUserDetail()` 
seems like it doesn't use cache at all, but it does! Here is how the 
interception registered.

```csharp
container.Register(           
    Component.For<IDataContext>()
        .ImplementedBy<MyDataContext>()
        .Interceptors<CoolCacheInterceptor>()
        .LifestyleTransient());
```

Thats it! 

With AOP all codding style remain the same, thats make all team happy,
with a bonus in performance which make my Boss happy! :)