---
title: Deploying an application to AWS using AWS CLI, Part 1 - Introduction
---

## Introduction to Deploying an Application to AWS using AWS CLI Blog Series

This blog series aims to replicate the architecture recommendations as described in the [Scaling Up to Your First 10 million Users](https://www.youtube.com/watch?v=vg5onp8TU6Q) video presented at Re:invent 2015.


## Example Application

I want this blog series to focus on developing infrastucture deployment scripts. Therefore, I decided to use an already available application. I picked application developed in Miguel Grinberg's Flask Mega-Tutorial. I list the reasons for picking this application below.

## Why Flask Mega-Tutorial

A few reasons why I picked this application:
* Uses python-based web framework - Flask. Flask is a micro framework which can be learned very quickly.
* In my opinion, Grinberg's tutorial is by far the best tutorial to learn Flask application development. In fact, the tutorial is best I have seen for learning web application development - not just python web development, but web development in general.


## Application Technology Stack

Application uses:
* Python-based Flask application framework
* nginx as web server
* PostgreSQL database

The application repository setup is described in more detail in [Part 4]().

## Tools Used for Deployment
* AWS CLI
* bash
* jq
