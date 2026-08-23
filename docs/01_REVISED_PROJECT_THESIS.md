# Revised Project Thesis

Modern development tools already perform deterministic analysis well. Reimplementing their capabilities would create a large analysis engine with little reason to exist.

## Thesis

> Existing tools produce useful facts independently. A small deterministic correlator may be able to combine those facts into useful change-risk findings without requiring another platform or an LLM.

## Core boundary

> **This project consumes analysis. It does not perform analysis.**

It may discover supported tools, execute configured tools, read existing reports, retain the minimum evidence needed, associate evidence with a change, perform trivial deterministic derivations, evaluate simple rules, and report results.

It should not implement complexity analysis, coverage instrumentation, linting, security scanning, or other mature analysis functions.

## Motivation

This is primarily a research and learning project. A valid outcome is learning how these tools fit together, creating a personally useful utility, and preserving the option for another developer to use it for free.

## Cost philosophy

The prototype should be local-first, account-free, API-key-free, cloud-independent, telemetry-free initially, and dependent only on tools the developer already uses or voluntarily installs.

## Bar for success

Would a developer voluntarily run this small free tool because the combined result is useful and setup is trivial?
