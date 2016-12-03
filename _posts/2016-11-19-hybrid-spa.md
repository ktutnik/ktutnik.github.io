---
layout: post
title: Hybrid SPA with ASP.net MVC
tags:
- asp.net-mvc
---

Almost all apps developed here in VetVision have an embedded chat application. The 
problem of having embedded chat is your app need to be an SPA (Single Page Application) 
because the browser shouldn't do a full refresh when navigating between pages to maintain 
the state of the chat. Imagine after full refresh all the javascript and html is 
refreshed and the chat apps need to reload its last state (Chat conversations, 
Login friend list etc). From an MVC developer perspective its a big-big problem, 
because every single navigation in MVC apps require a full refresh.

DETAIL OF THE PROBLEM
---------------------
There are several problems we face when adding the chat functionalities on our current
ASP.net MVC web apps.

1. The apps itself is half-finished. Developed using ASP.net MVC, so its a bad idea to recreate the apps 
from scratch to make it SPA.
2. All team member is best at ASP.NET MVC, with some jquery scripting. To create SPA
it is required to use javascript ui framework such as Angular or ReactJs. 
Required to understand Reactive programming, or Data Binding technique, which required
another learning curve.
3. Different Codding style server side vs client side. When creating SPA website, 
the server side part only provided a JSON web service, we lost all the happiness 
of Razor syntax and its simple server side process.

IDEA, CONCEPT AND REQUIREMENTS
------------------------------
The idea of Hybrid SPA is reuse the current apps, without having to change the codding style. 
And without having to make the team member to learn other framework/technology.

In a non SPA web page apps, the html element which cause full refresh page are hyperlinks 
and forms. Both element force the browser to do a full refresh.

> The main idea is intercept the `click` event of hyperlinks 
> and the `post` event of the forms. Then load the requested page in background using ajax or iframe.
> When the content received, it replace the current content.

The basic idea is easy, further more we need to add some detail to make it
work efficiently. Here are the requirements:

1. Hyperlink click should not do a full refresh in the apps.
2. Open In New Tab on browser context menu for hyperlinks should keep working.
3. Form post should not do a full refresh, should also working for multipart from (file upload)
4. Browser history back/next button should working properly.
5. Browser refresh should refresh the whole page, but the page should stay on the last visited url.
6. The loaded page should be efficient. Its mean only the content needed should be loaded, 
redundant html such as header, footer, sidebar should be ignored.
7. Should showing appropriate loading indicator when loading page on the background.

INTERCEPT HYPERLINKS AND FORM SUBMIT
------------------------------------
Let start with the most important part. To prevent the hyperlinks and form to do a full refresh. 
We use jquery to intercept its click event and do the page load in the background.

```javascript
$(document).on('click', 'a', function(){
    var url = $(this).attr('href');
    //load the page using url above
    //refer to the EFFICIENT PAGE LOAD section below 
    return false;
});
```

Notice that we listen to the click event of the document and provide a selector in the second parameter.
With this trick every added hyperlinks will automatically bind its click event to this callback. We do 
this because later the page content is appended to the html hierarchy and we don't want to re-assigned 
all the hyperlinks in the new page.

We also need to intercept the submit event of every form, before the form submitted to the server
we need to process the submission in the background. 

```javascript
$(document).on('submit', 'form', function(){
    //process the form submission 
    //refer to the HANDLING POST AND FILE UPLOAD section below     
});
```

Just keep reading, on the next section you will understand how do we load the form and url 
in the background.


EFFICIENT PAGE LOAD
-------------------
The idea to make the page loaded efficiently is 
by providing an extra parameter when requesting the page. 
For example `/home/about?nolayout=true` will return the page without header, footer
sidebar etc that provided by `_Layout.cshtml`.

By default when we not specify the layout in a cshtml view, it will be automatically assigned 
with `Shared/_Layout.cshtml`. So The trick is whenever the request contains `nolayout=true` parameter, 
we need to empty the `Layout` property of the page, that simple!. 

But, we already have 100+ views, and we don't want to change it one by one, because its error prone, 
and we are too lazy to do such repetitive task. 

Thanks to the flexibility of the ASP.NET MVC. There is a very useful view called `_ViewStart.cshtml`, 
with this view you can change the ability of how the view will be started, refer to the old ScottGu's blog 
[here](http://weblogs.asp.net/scottgu/archive/2010/10/22/asp-net-mvc-3-layouts.aspx) for the complete 
explanation. So here is the `_ViewStart.cshtml` look like

```html
@{
    var query = Context.Request.Query;
    if(query.ContainsKey("nolayout") && query["nolayout"].ToString().ToLower() == "true")
    {
        Layout = "";
    }
    else 
    {
        Layout = "_Layout";
    }
}
```

The idea is simple and straight forward, so we check the request query, whenever it has 
a `nolayout=true` parameter clear the `Layout` of the page, else keep using the default 
`Shared/_Layout.cshtml`

To test if the page code run correctly try to request the page using `nolayout=true` parameter, 
forexample `localhost:5000/Home/About?nolayout=true`. And inspect it in the browser, make 
sure the header, footer and the sidebar is not included.

We need to make a function to add the nolayout parameter on the current url. It is required 
latter in our library.

```javascript
function addNoLayout(url){
    return url + (url.split('?')[1] ? '&':'?') + "nolayout=true";
}
```

With function above we can easily change url `localhost:5000/Home/About` to 
`localhost:5000/Home/About?nolayout=true`

BACKGROUND PAGE LOADING
-----------------------
There are two way to load data (json, xml, html etc) from server is using ajax and iframe. 
the easiest and convenient way is using jquery `$.ajax` function, but you will not get 
the loading indicator on the browser tab.

In the other side, using iframe is a bit weird, but the compatibility of using iframe is 
good, and as a bonus you will get the loading indicator bar on the browser tab. 
this technique also used by Facebook to do their page load. See also
the HANDLING POST AND FILE UPLOAD section on why i rather choose the iframe vs jquery ajax.

To load a page using an iframe is simple, we create an iframe in real time, append it to the 
body and assigned its `src` url with the url of the page. When the iframe finish load 
we retrieve its content and return to the client code. See the code below:

```javascript
function get(url, success){
    $('<iframe/>').appendTo('body')
        .attr('src', url)
        .hide()
        .load(function(){
            if(success){
                success($(this).contents().find('body').children())
            }
            $(this).remove();
        })
}
```

Important part about the code above is we need to remove the iframe after we extract the content. 
To use the function simply 

```javascript 
get('<the url>', function(content){ 
    //this callback will be called 
    //when the iframe finish load
});
```

You can provide more robust implementation by adding an error, its quite easy 
by detecting the content of the iframe wether it showing an error or not, then 
you can provide an appropriate error on the callback.

HANDLING POST AND FILE UPLOAD
-----------------------------
The problem when loading page with jquery ajax is when you need to post a file to the server.
It is possible using FormData and Blob but require some effort todo. And you need a separate 
logic for simple POST and POST with Multipart Form.

With iframe in the other hand is real simple and handy, what you need to do is create an iframe 
in real time, then assigned the [form target attribute](http://www.w3schools.com/tags/att_form_target.asp)
to the created iframe, than after load event of the iframe dispatched we can process the content 
of the iframe like we did before.

Here is the simplified code of what we will do:

```html
<form target="__post_target" method="POST" action="">
    <submit value="Go"/>
</form>

<!-- 
    this frame generated in real time 
    using jquery. Appended at the end of the body
-->
<iframe name="__post_target">
</iframe>
```

Target attribute of the form should be the same with the name of the iframe, to make it work properly.

So before we do the page load, we need to specify the target attribute of all forms in the page.

```javascript
function initForms(target){
    if(!form.is('form')){
        form = form.find('form');
    }
    if(form.length > 0){
        form.attr('target', '__post_target');
        form.attr('action', addNoLayout(form.attr('action')));
    }
}
```

we initialize our forms on document ready like so

```javascript
$(document).ready(function(){
    initForms($(this));
})
```

We need to implement the logic on creating iframe to post the form in the background.
The process a bit like our previous code, but instead of providing an url here we 
provide the name of the iframe.

```javascript
function post(success){
    $('<iframe name="__post_target"/>').appendTo('body')
        .hide()
        .load(function(){
            if(success){
                success($(this).contents().find('body').children())
            }
            $(this).remove();
        });
}
```

We will call this function on submit event of the form, so all form will not perform a full refresh 
when submitted. 

```javascript
$(document).on('submit', 'form', function(){
    post(function(content){
        //process the content 
        //then append to the html hierarchy
    })    
});
```

If you look at the code carefully you might be a bit confused, because when submit event triggered 
the iframe is not yet created, wouldn't it too late to assigned the target iframe? Actually you have 
enough time to create the iframe on submit event, because the submit event occur before the post process 
begin.

REDIRECTION
-----------
Sometime after form submission we need to do a redirection to a page to prevent issue when browser 
back button pressed.

We also need to optimize the redirection url so it will keep the `nolayout=true` parameter, so 
we need to check if the request contains `nolayout=true` parameter, we should keep the 
parameter on the redirection url.

```csharp
public static class ControllerExtension 
{
    public static object GetNoLayoutParams(this Controller controller)
    {
        if(controller.Request.Query.ContainsKey("nolayout"))
        {
            return new { nolayout = true };
        }
        else return new {};
    }
}
```

Code above is an extension method to recreate the nolayout parameter, this extension method
used to provide a nolayout parameter for `RedirectToAction` method. 

```csharp
[HttpPost]
public IActionResult PostExample(ExampleModel model)
{
    //do the post 

    return RedirectToAction("Index", this.GetNoLayoutParams());
}
```

By using the code above when redirection done, our iframe will get efficient page
correctly without header, footer and sidebar.

BROWSER HISTORY
---------------
Good web apps should also support the browser history, user should be able to navigate back to previous page
or navigate forward. The problem of our apps is we don't have the browser history because we intercept 
all the hyperlinks and form. 

HTML 5 provide the ability to modify the browser history using `history` object. There are 2 important 
function we need to provide our apps support to browser history `pushState` and `popstate`. 

`history.pushState` used to save the current url to the browser history we do it like so:

```javascript
$(document).on('click', 'a', function(){
    var url = $(this).attr('href');
    get(addNoLayout(url), function(data){
        processResponse(data);
        //push the current url to the browser history
        history.pushState(null, null, url);
    })
    return false;
});
```

Remember the pushState should be called after the requested page appended to the html hierarchy. 
This will make sure when an error occur on page loaded the url keep stay on its last visited.

`popstate` used to listen to the browser back/next button, the `window.location.href` variable 
will provide the appropriate url in the browser history.

```javascript
$(window).on('popstate', function(e){
    //load the page in background
    get(addNoLayout(window.location.href), function(data){
        processResponse(data);
    })
});
```

Don't forget we have another bonus by using this browser history trick, the refresh button is work perfectly
and load the last visited page instead of the initial page like in a common SPA apps. 

SECURITY WARNING
----------------
Thats it, you now understand the idea of how we reuse our ASP.NET MVC apps into SPA here in VetVision.
The idea is simple and doesn't require you to change your codding style and learn a new framework/technology.

But there is one think you need to re-consider to adopt this technique. The issue is we provide an html 
from server side, and lets the javascript process it. Its kind of a big hole for an XSS attack.

In VetVision we review this possibility carefully, so we found a good solution to prevent the XXS attack.
here are the rule:

1. If possible only static html in cshtml loaded using jquery.
2. Dynamic data provided from database/user input should be loaded using json, the content 
then generated using some template engine.
3. Avoid `@Html.Raw` as much as possible.

SAMPLE CODE 
-----------
The complete code sample about topic above can be found in  [github](https://github.com/ktutnik/hybridspa).
Its a standard ASP.NET MVC 6 Core, generated using YEOMAN generator and use VSCODE IDE. 

Important file you need to take a look:

1. [ControllerExtension.cs](https://github.com/ktutnik/hybridspa/blob/master/Libs/ControllerExtension.cs)
2. [HomeController.cs](https://github.com/ktutnik/hybridspa/blob/master/Controllers/HomeController.cs)
3. [_ViewStart.cshtml](https://github.com/ktutnik/hybridspa/blob/master/Views/_ViewStart.cshtml)
4. [hybrid.spa.js](https://github.com/ktutnik/hybridspa/blob/master/wwwroot/js/hybrid.spa.js)


