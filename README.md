# OpenSprint

OpenSprint is an internal developer automation engine built as a deterministic workflow system.

It is designed to orchestrate developer tasks (issue creation, PR lifecycle, review loops, deployment, etc.) using a structured finite state machine (FSM) instead of ad-hoc scripts or fragile agent chains.

---

## 🚀 Current Status — Phase 1 Complete

Phase 1 implements a hardened, production-safe FSM engine using:

- Next.js (App Router, Node runtime)
- TypeScript
- LangGraph (JavaScript)
- Zod for schema validation

The engine currently simulates a full development workflow:

msg_received → issue_created → pr_created → in_review → change_requested → pr_updated → merged → deployed → issue_closed → completed

With:

- Structured logging
- Explicit transition validation
- Review retry control
- Recursion safety guard
- Workflow identity tracking

---

## 🧠 Architecture Overview

OpenScript separates concerns cleanly:

- **State Layer** → Defines workflow data structure
- **Transition Layer** → Defines allowed state changes
- **Node Layer** → Encapsulates execution logic
- **Engine Layer** → Orchestrates control flow
- **API Layer** → Triggers workflow execution

This ensures deterministic execution and predictable behavior.

---

## 🛡 Safety Mechanisms

The engine includes:

- Explicit FSM transition validation
- Business-level retry limits (review cycles)
- Engine-level recursion guard
- Structured execution logging
- Workflow ID tracing

This prevents infinite loops and corrupted transitions.

---
