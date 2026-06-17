# Database Learning Path

Progressive approach to learning different types of databases, starting from SQL fundamentals and branching into NoSQL and specialized types.

---

## Phase 1: Learn SQL (The Mental Model)

Before any specific database - learn SQL as a *language of thought*. The concepts of tables, rows, columns, relationships, primary/foreign keys - these are the vocabulary everything else is built on or compared to.

**What to internalize:**
- SELECT, WHERE, ORDER BY
- JOINs (INNER, LEFT)
- GROUP BY and aggregates
- Subqueries
- Schema concept - pre-defined structure
- ACID properties (why transactions exist)

**Tool:** SQLBolt in browser, 2-3 hours. Or "Select Star SQL" - the interactive tutorial that's actually well-designed. You want the syntax in your fingers before you forget it.

**Why this first:** SQL gives you the vocabulary to describe what other databases are doing differently. Every comparison article uses "vs SQL" because it's the baseline.

---

## Phase 2: Go Deep with PostgreSQL

Actual database, actual setup, real data. This is where "SQL" stops being abstract.

**What to internalize:**
- Installing and running locally
- Creating schemas and tables for a real project
- Indexing and query planning (why slow queries are slow)
- JSON in PostgreSQL (first taste of "SQL can do more than tables")
- User permissions, backups, connection management
- Stored procedures/functions

**Tool:** Install PostgreSQL locally, do the PostgreSQL tutorial on projectguithub.com or the one on selek.com. Use DBeaver as your GUI if you want one.

**Why PostgreSQL specifically:** It's the most full-featured open-source relational DB. It also has extensions for JSON, full-text search, and now vector search - so it's the best "I've outgrown basic SQL, time to see what a serious relational DB can do" database.

---

## Phase 3: Branch into NoSQL

Now you understand why someone would leave the relational model.

### 3A: Key-Value with Redis

Smallest mental shift. Still just "store this, get this back."

**What to internalize:**
- Strings, hashes, lists, sets
- TTLs (why expiration matters)
- Pub/sub and streaming
- Why it's fast (in-memory, not disk-based)

**Why Redis first in NoSQL:** Lowest conceptual overhead. You already get the "choose your data structure based on access pattern" idea. Plus everyone uses Redis in front of their slow database - understanding it makes you a better developer.

---

### 3B: Document with MongoDB

Medium shift. Flexible schema. Each record can have different fields.

**What to internalize:**
- Collections instead of tables
- Documents instead of rows
- Embedding vs referencing
- Aggregation pipeline
- Why flexible schema is useful for user profiles, content, products

**Why MongoDB:** The most widely used document DB. Huge ecosystem. Companies use it for real products so you'll encounter it.

---

### 3C: Graph with Neo4j

Biggest mental shift. The data model is relationships, not tables.

**What to internalize:**
- Nodes and edges
- Cypher query language
- Traversal vs JOIN (fundamentally different operation)
- When "how are these things connected" is more important than "what data do these things have"

**Why Neo4j:** Best documented, most accessible graph DB. Has a free sandbox you can use in browser without installing anything.

---

### 3D: Vector (Optional But AI-Relevant)

You know all the concepts above. Vector DBs are a new thing built for AI.

**What to internalize:**
- Embeddings (mathematical representations of meaning)
- Similarity search (find things most like this thing)
- ANN (approximate nearest neighbor) indexing
- Why this didn't exist as a category before LLMs

**Tool:** Weaviate or Qdrant - both have free tiers you can use in browser.

---

## The Progression in Order

| Phase | Type | Tool | Time Investment |
|---|---|---|---|
| 1 | SQL concepts | SQLBolt / Select Star SQL | 5-10 hours |
| 2 | Relational DB | PostgreSQL + real project | 20-40 hours |
| 3A | Key-Value | Redis (online sandbox) | 5-10 hours |
| 3B | Document | MongoDB (Atlas free tier) | 10-20 hours |
| 3C | Graph | Neo4j (browser sandbox) | 10-20 hours |
| 3D | Vector | Weaviate or Qdrant | 5-10 hours |

**Total:** 55-110 hours if you go deep. But you don't have to finish one before starting the next - once you know relational fundamentals, you can skim the surface of all the NoSQL types while going deep on one.

---

## Learning Pattern

**Learn the concept, then learn the brand that exemplifies it, then understand why someone would choose it over the alternatives.**

---

_Last updated: 2026-06-07_