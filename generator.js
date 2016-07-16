'use strict';

var isValid = require('is-valid-app');
var path = require('path');

module.exports = function(app, base, env, options) {
  if (!isValid(app, 'generate-templates-transform')) return;

  /**
   * Plugins
   */

  app.use(require('generate-defaults'));
  app.use(require('generate-collections'));

  /**
   * Generate an `generator.tasks.js` file to the current working directory.
   *
   * ```sh
   * $ gen tasks
   * $ gen tasks --dest ./docs
   * ```
   * @name tasks
   * @api public
   */

  app.task('default', { silent: true }, ['run-templates-transform']);
  app.task('run-templates-transform', ['ask-template', 'ask-source'], function(callback) {
    app.includes('*', { cwd: path.resolve(app.options.source) });
    var includes = app.views.includes;
    var keys = Object.keys(includes);
    var datas = keys.map(function(key) {
      var d = includes[key].data;
      if (!d.hasOwnProperty('templates-transform')) return null;
      return {
        file: {
          name: path.basename(key),
          path: key,
          ext: d.ext,
          relative: path.normalize(path.relative(process.cwd(), key)).replace(/\\/gi, '/')
        },
        metadata: d['templates-transform']
      };
    }).filter(function(item) {
      return item !== null;
    });
    app.data({ templates: datas });
    return app.src(app.options.template, { cwd: process.cwd() })
      .pipe(app.renderFile('*'))
      .pipe(app.conflicts(app.cwd))
      .pipe(app.dest(app.cwd));
  });

  app.task('ask-template', { silent: true }, function(callback) {
    if (app.options.template) return callback();
    app.question('templates-transform-template', 'Which transformation template do you want to use?');
    forceAnswers(app, 'templates-transform-template', function(err, answers) {
      if (err) return callback(err);
      app.options.template = answers['templates-transform-template'];
      callback();
    });
  });

  app.task('ask-source', { silent: true }, function(callback) {
    if (app.options.source) return callback();
    app.question('templates-transform-source', 'Which folder do you want to transform?');
    forceAnswers(app, 'templates-transform-source', function(err, answers) {
      if (err) return callback(err);
      app.options.source = answers['templates-transform-source'];
      callback();
    });
  });
};

function forceAnswers(app, questionName, callback) {
  app.ask(questionName, { save: false }, function(err, answers) {
    if (err) return callback(err);
    if (!answers.hasOwnProperty(questionName)) return forceAnswers(app, questionName, callback);
    return callback(null, answers);
  });
}
