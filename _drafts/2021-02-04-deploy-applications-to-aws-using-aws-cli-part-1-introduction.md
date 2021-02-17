---
title: Deploying an application to AWS using AWS CLI, Part 1 - Introduction
---

## Introduction to Deploying an Application to AWS using AWS CLI Tutorial Series

- this tutorial series aims to replicate the architecture recommendations as described in the [Scaling Up to Your First 10 million Users](https://www.youtube.com/watch?v=vg5onp8TU6Q) video as presented at Re:invent 2015.
- decided to develop a series of tutorials to provision infrastructure to support an increasing number of users.


## Example Application

- I wanted to get working on writing the deployment scripts
- So used an already available application
- Picked application from Miguel Grinberg's Flask Mega-Tutorial

## Why Flask Mega-Tutorial

- I have "studied" the tutorial several times, it is one of the best tutorials for web application that I have seen.

## Application Technology Stack

Application uses:
- Python-based Flask application framework
- nginx as web server
- PostgreSQL database

## Tools Used for Deployment
- AWS CLI
- bash
- jq
