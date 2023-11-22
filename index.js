const tracer = require('./tracing')('todo-service');
const express = require('express');
const { MongoClient } = require('mongodb');
const { StatusCode } = require('@opentelemetry/api');

const app = express();
app.use(express.json());
const port = 3000;
let db;

const startServer = async () => {
  try {
    const client = await MongoClient.connect('mongodb://localhost:27017/');
    db = client.db('todo');
    await db.collection('todos').insertMany([
      { id: '1', title: 'Buy groceries' },
      { id: '2', title: 'Install Aspecto' },
      { id: '3', title: 'Buy my own name domain' },
    ]);
    app.listen(port, () => {
      console.log(`Example app listening on port ${port}`);
    });
  } catch (error) {
    console.error('Failed to connect to MongoDB:', error);
  }
};

startServer();

app.get('/todo', async (req, res) => {
  const span = tracer.startSpan('Get Todos');
  try {
    const todos = await db.collection('todos').find({}).toArray();
    res.send(todos);
  } catch (error) {
    span.setStatus({ code: StatusCode.ERROR, message: error.message });
    res.status(500).send('error fetching todos');
  } finally {
    span.end();
  }
});

app.get('/todo/:id', async (req, res) => {
  const span = tracer.startSpan('Get Todo By ID');
  try {
    const todo = await db.collection('todos').findOne({ id: req.params.id });
    if (!todo) {
      res.status(404).send('todos not found');
    } else {
      res.send(todo);
    }
  } catch (error) {
    span.setStatus({ code: StatusCode.ERROR, message: error.message });
    res.status(500).send('errror fetching todo');
  } finally {
    span.end();
  }
});
