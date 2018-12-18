/* eslint-env node */
'use strict';

module.exports = function (app) {
  const express = require('express');
  let usersRouter = express.Router();


  var data = [];
  for (var i = 0; i < 25; i++) {
    data.push({first_name: 'Person\'s name ' + (i + 1)});
  }

  usersRouter.get('/', function (req, res) {
    var delay = req.query.delay || 0; //in seconds
    var page = req.query.page;
    var pageSize = req.query.pageSize;
    var query = req.query.query || '';


    var dataToSend = data.filter((d) => d.first_name.includes(query));
    var dataToSendAllLength = data.length;
    dataToSend = dataToSend.splice((page - 1) * pageSize, pageSize);
    let hasNextPage = (page * pageSize < dataToSendAllLength);

    setTimeout(function () {
      res.send({
        'data': dataToSend,
        hasNextPage: hasNextPage
      });
    }, delay * 1000);


  });
  /*
    usersRouter.post('/', function(req, res) {
      res.status(201).end();
    });

    usersRouter.get('/:id', function(req, res) {
      res.send({
        'users': {
          id: req.params.id
        }
      });
    });

    usersRouter.put('/:id', function(req, res) {
      res.send({
        'users': {
          id: req.params.id
        }
      });
    });

    usersRouter.delete('/:id', function(req, res) {
      res.status(204).end();
    });*/

  // The POST and PUT call will not contain a request body
  // because the body-parser is not included by default.
  // To use req.body, run:

  //    npm install --save-dev body-parser

  // After installing, you need to `use` the body-parser for
  // this mock uncommenting the following line:
  //
  //app.use('/api/users', require('body-parser').json());
  app.use('/api/users', usersRouter);
};
