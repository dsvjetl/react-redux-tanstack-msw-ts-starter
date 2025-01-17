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
          '/components/{{pascalCase name}}/{{pascalCase name}}.tsx',
        templateFile: 'plop-templates/Component.tsx.hbs',
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
        path: currentPath + '/components/{{pascalCase name}}/index.ts',
        templateFile: 'plop-templates/index.ts.hbs',
      },
      {
        type: 'add',
        path:
          currentPath +
          '/components/{{pascalCase name}}/{{pascalCase name}}.test.tsx',
        templateFile: 'plop-templates/Component.test.tsx.hbs',
      },
    ],
  });
};
