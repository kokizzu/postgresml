# Vector Search

The Korvus SDK is specifically designed to provide powerful, flexible vector search. `Pipeline`s are required to perform search. See [Pipelines ](https://postgresml.org/docs/api/client-sdk/pipelines) for more information about using `Pipeline`s.

This section will assume we have previously ran the following code:

{% tabs %}
{% tab title="JavaScript" %}
```javascript
const pipeline = korvus.newPipeline("test_pipeline", {
  abstract: {
    semantic_search: {
      model: "Alibaba-NLP/gte-base-en-v1.5",
    },
    full_text_search: { configuration: "english" },
  },
  body: {
    splitter: { model: "recursive_character" },
    semantic_search: {
      model: "mixedbread-ai/mxbai-embed-large-v1",
    },
  },
});
const collection = korvus.newCollection("test_collection");
await collection.add_pipeline(pipeline);
```
{% endtab %}

{% tab title="Python" %}
```python
pipeline = Pipeline(
    "test_pipeline",
    {
        "abstract": {
            "semantic_search": {
                "model": "Alibaba-NLP/gte-base-en-v1.5",
            },
            "full_text_search": {"configuration": "english"},
        },
        "body": {
            "splitter": {"model": "recursive_character"},
            "semantic_search": {
                "model": "mixedbread-ai/mxbai-embed-large-v1",
            },
        },
    },
)
collection = Collection("test_collection")
await collection.add_pipeline(pipeline);
```
{% endtab %}

{% tab title="Rust" %}
```rust
let mut pipeline = Pipeline::new(
    "test_pipeline",
    Some(
        serde_json::json!(
            {
                "abstract": {
                    "semantic_search": {
                        "model": "Alibaba-NLP/gte-base-en-v1.5",
                    },
                    "full_text_search": {"configuration": "english"},
                },
                "body": {
                    "splitter": {"model": "recursive_character"},
                    "semantic_search": {
                        "model": "mixedbread-ai/mxbai-embed-large-v1",
                    },
                },
            }
        )
        .into(),
    ),
)?;
let mut collection = Collection::new("test_collection", None)?;
collection.add_pipeline(&mut pipeline).await?;
```
{% endtab %}

{% tab title="C" %}
```cpp
PipelineC *pipeline = korvus_pipelinec_new("test_pipeline", "{\
    \"abstract\": {\
        \"semantic_search\": {\
            \"model\": \"Alibaba-NLP/gte-base-en-v1.5\"\
        },\
        \"full_text_search\": {\"configuration\": \"english\"}\
    },\
    \"body\": {\
        \"splitter\": {\"model\": \"recursive_character\"},\
        \"semantic_search\": {\
            \"model\": \"mixedbread-ai/mxbai-embed-large-v1\"\
        }\
    }\
}");
CollectionC * collection = korvus_collectionc_new("test_collection", NULL);
korvus_collectionc_add_pipeline(collection, pipeline);
```
{% endtab %}
{% endtabs %}

This creates a `Pipeline` that is capable of full text search and semantic search on the `abstract` and semantic search on the `body` of documents.

## Doing vector search

{% tabs %}
{% tab title="JavaScript" %}
```javascript
const results = await collection.vector_search(
  {
    query: {
      fields: {
        body: {
          query: "What is the best database?", 
          parameters: {
          prompt:
              "Represent this sentence for searching relevant passages: ",
          }
        },
      },
    },
    document: {
        keys: [
            "id",
            "abstract"
        ]
    },
    limit: 5,
  },
  pipeline,
);
```
{% endtab %}

{% tab title="Python" %}
```python
results = await collection.vector_search(
    {
        "query": {
            "fields": {
                "body": {
                    "query": "What is the best database?",
                    "parameters": {
                        "prompt": "Represent this sentence for searching relevant passages: ",
                    },
                },
            },
        },
        "document": {
            "keys": [
                "id",
                "abstract"
            ]
        },
        "limit": 5,
    },
    pipeline,
)
```
{% endtab %}

{% tab title="Rust" %}
```rust
let results = collection
    .vector_search(
        serde_json::json!({
            "query": {
                "fields": {
                    "body": {
                        "query": "What is the best database?",
                        "parameters": {
                            "prompt": "Represent this sentence for searching relevant passages: ",
                        },
                    },
                },
            },
            "document": {
                "keys": [
                    "id",
                    "abstract"
                ]
            },
            "limit": 5,
        })
        .into(),
        &mut pipeline,
    )
    .await?;
```
{% endtab %}

{% tab title="C" %}
```cpp
r_size = 0;
char **results = korvus_collectionc_vector_search(collection, "{\
  \"query\": {\
    \"fields\": {\
      \"body\": {\
        \"query\": \"What is the best database?\",\
        \"parameters\": {\
          \"prompt\": \"Represent this sentence for searching relevant passages: \"\
        }\
      }\
    }\
  },\
  \"document\": {\
    \"keys\": [\
      \"id\",\
      \"abstract\"\
    ]\
  },\
  \"limit\": 5\
}",
pipeline, &r_size);
```
{% endtab %}
{% endtabs %}

Let's break this down. The `vector_search` function takes in a `JSON` object and a `Pipeline`. The `JSON` object currently supports four keys: 
- `query` 
- `document`
- `rerank`
- `limit`

The `query` object specifies the actual query to perform. Each key specified in the `Pipeline` can be searched or filtered over according to the specification in the `Pipeline`.

The `limit` key limits how many chunks should be returned.

The `document` object can restrict which fields to return from the document. If left out, the whole document is returned. In this case we are specifying we only want the `id` and `abstract` returned.

the `rerank` object specifies what type of re-ranking to perform. If left out, no re-ranking is done. See the [Re-ranking section](/docs/open-source/korvus/guides/vector-search#re-ranking) for more information.

Note that `mixedbread-ai/mxbai-embed-large-v1` takes in a prompt when creating embeddings for searching against a corpus which we provide in the `parameters`.

Let's see another more complicated example:

{% tabs %}
{% tab title="JavaScript" %}
```javascript
const query = "What is the best database?";
const results = await collection.vector_search(
  {
    query: {
      fields: {
        abstract: {
          query: query,
          full_text_filter: "database"
        },
        body: {
          query: query, 
          parameters: {
            instruction:
              "Represent this sentence for searching relevant passages: ",
          }
        },
      },
    },
    limit: 5,
  },
  pipeline,
);
```
{% endtab %}

{% tab title="Python" %}
```python
query = "What is the best database?"
results = await collection.vector_search(
    {
        "query": {
            "fields": {
                "abastract": {
                    "query": query,
                    "full_text_filter": "database",
                },
                "body": {
                    "query": query,
                    "parameters": {
                        "instruction": "Represent this sentence for searching relevant passages: ",
                    },
                },
            },
        },
        "limit": 5,
    },
    pipeline,
)

```
{% endtab %}

{% tab title="Rust" %}
```rust
let query = "What is the best database?";
let results = collection
    .vector_search(
        serde_json::json!({
            "query": {
                "fields": {
                    "abastract": {
                        "query": query,
                        "full_text_filter": "database",
                    },
                    "body": {
                        "query": query,
                        "parameters": {
                            "instruction": "Represent this sentence for searching relevant passages: ",
                        },
                    },
                },
            },
            "limit": 5,
        })
        .into(),
        &mut pipeline,
    )
    .await?;
```
{% endtab %}

{% tab title="C" %}
```cpp
r_size = 0;
char **results = korvus_collectionc_vector_search(collection, "{\
 \"query\": {\
      \"fields\": {\
          \"abastract\": {\
              \"query\": \"What is the best database?\",\
              \"full_text_filter\": \"database\"\
          },\
          \"body\": {\
              \"query\": \"What is the best database?\",\
              \"parameters\": {\
                  \"instruction\": \"Represent this sentence for searching relevant passages: \"\
              }\
          }\
      }\
  },\
  \"limit\": 5,\
}", pipeline, &r_size);
```
{% endtab %}
{% endtabs %}

The `query` in this example is slightly more intricate. We are doing vector search over both the `abstract` and `body` keys of our documents. This means our search may return chunks from both the `abstract` and `body` of our documents.  We are also filtering out all `abstract` chunks that do not contain the text `"database"` we can do this because we enabled `full_text_search` on the `abstract` key in the `Pipeline` schema. Also note that the model used for embedding the `body` takes parameters, but not the model used for embedding the `abstract`.

## Filtering

We provide powerful and flexible arbitrarly nested filtering based off of [MongoDB Comparison Operators](https://www.mongodb.com/docs/manual/reference/operator/query-comparison/). We support each operator mentioned in Mongo's docs except the `$nin`.

**Vector search with $eq filtering**

{% tabs %}
{% tab title="JavaScript" %}
```javascript
const results = await collection.vector_search(
  {
    query: {
      fields: {
        body: {
          query: "What is the best database?", 
          parameters: {
            instruction:
              "Represent this sentence for searching relevant passages: ",
          }
        },
      },
      filter: {
        user_id: {
          $eq: 1
        }
      }
    },
    limit: 5,
  },
  pipeline,
);
```
{% endtab %}

{% tab title="Python" %}
```python
results = await collection.vector_search(
    {
        "query": {
            "fields": {
                "body": {
                    "query": "What is the best database?",
                    "parameters": {
                        "instruction": "Represent this sentence for searching relevant passages: ",
                    },
                },
            },
            "filter": {"user_id": {"$eq": 1}},
        },
        "limit": 5,
    },
    pipeline,
)
```
{% endtab %}

{% tab title="Rust" %}
```rust
let results = collection
    .vector_search(
        serde_json::json!({
            "query": {
                "fields": {
                    "body": {
                        "query": "What is the best database?",
                        "parameters": {
                            "instruction": "Represent this sentence for searching relevant passages: ",
                        },
                    },
                },
                "filter": {"user_id": {"$eq": 1}},
            },
            "limit": 5,
        })
        .into(),
        &mut pipeline,
    )
    .await?;
```
{% endtab %}

{% tab title="C" %}
```cpp
r_size = 0;
char **results = korvus_collectionc_vector_search(collection, "{\
    \"query\": {\
        \"fields\": {\
            \"body\": {\
                \"query\": \"What is the best database?\",\
                \"parameters\": {\
                    \"instruction\": \"Represent this sentence for searching relevant passages: \"\
                }\
            }\
        },\
        \"filter\": {\"user_id\": {\"$eq\": 1}}\
    },\
    \"limit\": 5\
}", pipeline, &r_size);
```
{% endtab %}
{% endtabs %}

The above query would filter out all chunks from documents that do not contain a key `user_id` equal to `1`.

**Vector search with $gte filtering**

{% tabs %}
{% tab title="JavaScript" %}
```javascript
const results = await collection.vector_search(
  {
    query: {
      fields: {
        body: {
          query: "What is the best database?", 
          parameters: {
            instruction:
              "Represent this sentence for searching relevant passages: ",
          }
        },
      },
      filter: {
        user_id: {
          $gte: 1
        }
      }
    },
    limit: 5,
  },
  pipeline,
);
```
{% endtab %}

{% tab title="Python" %}
```python
results = await collection.vector_search(
    {
        "query": {
            "fields": {
                "body": {
                    "query": "What is the best database?",
                    "parameters": {
                        "instruction": "Represent this sentence for searching relevant passages: ",
                    },
                },
            },
            "filter": {"user_id": {"$gte": 1}},
        },
        "limit": 5,
    },
    pipeline,
)
```
{% endtab %}

{% tab title="Rust" %}
```rust
let results = collection
    .vector_search(
        serde_json::json!({
            "query": {
                "fields": {
                    "body": {
                        "query": "What is the best database?",
                        "parameters": {
                            "instruction": "Represent this sentence for searching relevant passages: ",
                        },
                    },
                },
                "filter": {"user_id": {"$gte": 1}},
            },
            "limit": 5,
        })
        .into(),
        &mut pipeline,
    )
    .await?;
```
{% endtab %}

{% tab title="C" %}
```cpp
r_size = 0;
char **results = korvus_collectionc_vector_search(collection, "{\
    \"query\": {\
        \"fields\": {\
            \"body\": {\
                \"query\": \"What is the best database?\",\
                \"parameters\": {\
                    \"instruction\": \"Represent this sentence for searching relevant passages: \"\
                }\
            }\
        },\
        \"filter\": {\"user_id\": {\"$eq\": 1}}\
    },\
    \"limit\": 5\
}", pipeline, &r_size);
```
{% endtab %}
{% endtabs %}

The above query would filter out all documents that do not contain a key `user_id` with a value greater than or equal to `1`.

**Vector search with $or and $and filtering**

{% tabs %}
{% tab title="JavaScript" %}
```javascript
const results = await collection.vector_search(
  {
    query: {
      fields: {
        body: {
          query: "What is the best database?", 
          parameters: {
            instruction:
              "Represent this sentence for searching relevant passages: ",
          }
        },
      },
      filter: {
        $or: [
          {
            $and: [
              {
                $eq: {
                  user_id: 1
                }
              },
              {
                $lt: {
                  user_score: 100
                }
              }
            ]
          },
          {
            special: {
              $ne: true
            }
          }
        ]
      }
    },
    limit: 5,
  },
  pipeline,
);
```
{% endtab %}

{% tab title="Python" %}
```python
results = await collection.vector_search(
    {
        "query": {
            "fields": {
                "body": {
                    "query": "What is the best database?",
                    "parameters": {
                        "instruction": "Represent this sentence for searching relevant passages: ",
                    },
                },
            },
            "filter": {
                "$or": [
                    {"$and": [{"$eq": {"user_id": 1}}, {"$lt": {"user_score": 100}}]},
                    {"special": {"$ne": True}},
                ],
            },
        },
        "limit": 5,
    },
    pipeline,
)
```
{% endtab %}

{% tab title="Rust" %}
```rust
let results = collection
    .vector_search(
        serde_json::json!({
            "query": {
                "fields": {
                    "body": {
                        "query": "What is the best database?",
                        "parameters": {
                            "instruction": "Represent this sentence for searching relevant passages: ",
                        },
                    },
                },
                "filter": {
                    "$or": [
                        {"$and": [{"$eq": {"user_id": 1}}, {"$lt": {"user_score": 100}}]},
                        {"special": {"$ne": True}},
                    ],
                },
            },
            "limit": 5,
        })
        .into(),
        &mut pipeline,
    )
    .await?;
```
{% endtab %}

{% tab title="C" %}
```cpp
r_size = 0;
char **results = korvus_collectionc_vector_search(collection, "{\
  \"query\": {\
      \"fields\": {\
          \"body\": {\
              \"query\": \"What is the best database?\",\
              \"parameters\": {\
                  \"instruction\": \"Represent this sentence for searching relevant passages: \"\
              }\
          }\
      },\
      \"filter\": {\
          \"$or\": [\
              {\"$and\": [{\"$eq\": {\"user_id\": 1}}, {\"$lt\": {\"user_score\": 100}}]},\
              {\"special\": {\"$ne\": True}}\
          ]\
      }\
  },\
  \"limit\": 5\
}", pipeline, &r_size);
```
{% endtab %}
{% endtabs %}

The above query would filter out all documents that do not have a key `special` with a value `True` or (have a key `user_id` equal to 1 and a key `user_score` less than 100).

## Re-ranking

Vector search results can be reranked in the same query they are retrieved in. To enable this, provide the `rerank` key.

{% tabs %}
{% tab title="JavaScript" %}
```javascript
const results = await collection.vector_search(
  {
    query: {
      fields: {
        body: {
          query: "What is the best database?", parameters: {
          prompt:
              "Represent this sentence for searching relevant passages: ",
          }
        },
      },
    },
    rerank: {
        model: "mixedbread-ai/mxbai-rerank-base-v1",
        query: "What is the best database?",
        num_documents_to_rerank: 100,
    },
    limit: 5,
  },
  pipeline,
);
```
{% endtab %}

{% tab title="Python" %}
```python
results = await collection.vector_search(
    {
        "query": {
            "fields": {
                "body": {
                    "query": "What is the best database?",
                    "parameters": {
                        "prompt": "Represent this sentence for searching relevant passages: ",
                    },
                },
            },
        },
        "rerank": {
            "model": "mixedbread-ai/mxbai-rerank-base-v1",
            "query": "What is the best database",
            "num_documents_to_rerank": 100,
        },
        "limit": 5,
    },
    pipeline,
)
```
{% endtab %}

{% tab title="Rust" %}
```rust
let results = collection
    .vector_search(
        serde_json::json!({
            "query": {
                "fields": {
                    "body": {
                        "query": "What is the best database?",
                        "parameters": {
                            "prompt": "Represent this sentence for searching relevant passages: ",
                        },
                    },
                },
            },
            "rerank": {
                "model": "mixedbread-ai/mxbai-rerank-base-v1",
                "query": "What is the best database",
                "num_documents_to_rerank": 100,
            },
            "limit": 5,
        })
        .into(),
        &mut pipeline,
    )
    .await?;
```
{% endtab %}

{% tab title="C" %}
```cpp
r_size = 0;
char **results = korvus_collectionc_vector_search(collection, "{\
  \"query\": {\
    \"fields\": {\
      \"body\": {\
        \"query\": \"What is the best database?\",\
        \"parameters\": {\
          \"prompt\": \"Represent this sentence for searching relevant passages: \"\
        }\
      }\
    }\
  },\
  \"rerank\": {\
    \"model\": \"mixedbread-ai/mxbai-rerank-base-v1\",\
    \"query\": \"What is the best database\",\
    \"num_documents_to_rerank\": 100\
  },\
  \"limit\": 5\
}",
pipeline, &r_size);
```
{% endtab %}
{% endtabs %}

This query will first get the top 100 documents from the initial vector search and then rerank them using the `mixedbread-ai/mxbai-rerank-base-v1` cross-encoder.

You can specify the number of documents to rerank with the `num_documents_to_rerank` parameter. The query returns the top `limit` results after re-ranking.
