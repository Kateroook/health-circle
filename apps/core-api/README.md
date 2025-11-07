<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
</p>

## Description

## Project setup

## 1. Common

1.1 Please use NodeJS version >= 18.14.2

1.2 Please setup your IDE to use internal eslint module

1.3 Please setup your IDE to use internal prettier module

1.4 Please install NestJS CLI globally

```bash
$ npm i -g @nestjs/cli
```

1.5 Please install dependencies

```bash
$ npm install
```

1.6 Please create .env file from .env.example in ./core-api folder

## Compile and run the project

```bash
# development
$ npm run start

# watch mode
$ npm run start:dev

# production mode
$ npm run start:prod
```

Format code
To ensure consistent code style across the project, please use Prettier via the following command:

```bash
$ npm run format
```

## 2. TypeORM instructions:

3.1 Please create a new entity in directory

3.2 Please add a new entity to import array

3.3 Please generate a new migration for this entity

```bash
$ npm run typeorm:migration:generate ./src/common/migrations/{name}
# example
$ npm run typeorm:migration:generate ./src/common/migrations/create-users
```

3.4 Please add a new migration to import array

3.5 Additional useful commands

```bash
# create a new empty migration
$ npm run typeorm:migration:create ./src/common/migrations/{name}

# run all pending migrations to check
$ npm run typeorm:migration:up
```
