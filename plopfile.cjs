const promptDirectory = require('inquirer-directory');

module.exports = function (plop) {
  const currentPath = process.env.INIT_CWD;

  plop.setPrompt('directory', promptDirectory);

  plop.setGenerator('Create React component', {
    description: 'Generate a new React component',
    prompts: [
      {
        type: 'input',
        name: 'name',
        message: 'Component name (PascalCase):',
      },
    ],
    actions: [
      {
        type: 'add',
        path:
          currentPath +
          '/components/{{pascalCase name}}/{{pascalCase name}}.jsx',
        templateFile: 'plop-templates/Component.jsx.hbs',
      },
      {
        type: 'add',
        path:
          currentPath +
          '/components/{{pascalCase name}}/{{pascalCase name}}.module.scss',
        templateFile: 'plop-templates/Component.module.scss.hbs',
      },
      {
        type: 'add',
        path: currentPath + '/components/{{pascalCase name}}/index.js',
        templateFile: 'plop-templates/index.js.hbs',
      },
      {
        type: 'add',
        path:
          currentPath +
          '/components/{{pascalCase name}}/{{pascalCase name}}.test.jsx',
        templateFile: 'plop-templates/Component.test.js.hbs',
      },
    ],
  });
};
