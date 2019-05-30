---
title: Jekyll Minima Theme - A Few Settings
---
This post is a follow-up of my earlier
[post]({{ site.baseurl }}{% link _posts/2018-09-12-build-a-blog-using-jekyll-and-deploy-to-github-pages-and-set-custom-domain.md %})
 about building a jekyll site.

In this post, I will describe a few things that I modified on my site. For example,
the footer show site title twice, I add a `_config.yml` setting to show blog author
name instead of one of the site titles.

## Add site description

The blog site that you deployed earlier (as described in the post referenced above)
should look pretty good, but we can make a few quick improvements to make it look
even better.

Add a variable `description` to your `_config.yml` and set its value to a short
description of your site.

**_config.yml**
```
description: This blog includes posts related to topic A, topic B and topic C.
```

Try in browser. The description now displays in footer in a subdued font.

## Modify title above list of posts

On the Home/Index page, the list of posts are preceded by a title "Posts". You can
change it to a different title. Suppose, you want the title to be "Latest Posts".
This is easily achieved by adding a variable to `index.html`'s front matter:

## Add gitbub, twitter and rss links to footer
## Modify footer to show blog author name
