import { Logger as NestLogger } from '@nestjs/common';
import { EntitySubscriberInterface, EventSubscriber, InsertEvent, UpdateEvent } from 'typeorm';

import { DataLogEntity } from '../../logging/entities/data-logs.entity';
import { DataLogChangesEntity } from '../../logging/entities/data-logs-changes.entity';
import { getErrorStack } from '../helpers/get-error-stack.util';

// Define interfaces for entities with logging fields
interface LoggableEntity {
  id?: string | number;
  code?: string;
  updatedAt?: Date;
  deletedAt?: Date | null;
  [key: string]: unknown;
}

interface RelationItem {
  id?: string | number;
  code?: string;
}

// TODO: add to config if necessary
const loggingEntities = ['UserEntity'];
const excludedFields = ['createdAt', 'updatedAt', 'id', 'lastLoginDate'];
enum LogTypes {
  update = 'UPDATE',
  insert = 'INSERT',
  softRemove = 'SOFT REMOVE',
}

@EventSubscriber()
export class LoggerSubscriber implements EntitySubscriberInterface {
  private static readonly logger = new NestLogger(LoggerSubscriber.name);

  private static safeToString(value: unknown): string {
    if (typeof value === 'string') return value;
    if (typeof value === 'number') return String(value);
    if (typeof value === 'bigint') return value.toString();
    if (typeof value === 'boolean') return value ? 'true' : 'false';
    if (value === null) return 'null';
    if (value === undefined) return 'undefined';
    try {
      return JSON.stringify(value);
    } catch {
      return String(Object.prototype.toString.call(value));
    }
  }

  private static logAuditError(
    methodName: string,
    error: unknown,
    event?: { metadata?: { name?: string }; entity?: { id?: unknown } },
  ) {
    const entityName = event?.metadata?.name;
    const entityId = event?.entity?.id;
    const suffix = entityName ? ` entity=${entityName}` : '';
    const idPart = entityId !== undefined && entityId !== null ? ` id=${LoggerSubscriber.safeToString(entityId)}` : '';
    LoggerSubscriber.logger.warn(
      `${LoggerSubscriber.name} ${methodName}() audit-log failed${suffix}${idPart}: ${getErrorStack(error)}`,
    );
  }

  private static fillLogObject(
    event: UpdateEvent<LoggableEntity> | InsertEvent<LoggableEntity>,
    fields: string[],
    logType: LogTypes,
  ): Omit<DataLogEntity, 'id'> {
    const entity = event.entity as LoggableEntity;
    const databaseEntity = 'databaseEntity' in event ? (event.databaseEntity as LoggableEntity | undefined) : undefined;

    const changes = fields
      .map((item) => {
        let oldValue: string | number | null = null;
        if (databaseEntity) {
          const field = databaseEntity[item] as RelationItem | string | number | null | undefined;
          if (field && typeof field === 'object') {
            if ('id' in field && field.id !== undefined) {
              oldValue = field.id;
            } else if ('code' in field && field.code !== undefined) {
              oldValue = field.code;
            } else {
              oldValue = JSON.stringify(field);
            }
          } else {
            oldValue = field as string | number | null;
          }
        }

        const entityField = entity[item] as RelationItem | string | number | null | undefined;
        let newValue: string | number | null = null;
        if (entityField && typeof entityField === 'object') {
          if ('id' in entityField && entityField.id !== undefined) {
            newValue = entityField.id;
          } else if ('code' in entityField && entityField.code !== undefined) {
            newValue = entityField.code;
          } else {
            newValue = JSON.stringify(entityField);
          }
        } else {
          newValue = entityField as string | number | null;
        }

        const valueType = newValue?.constructor?.name || typeof newValue;

        const formattedOld =
          oldValue !== null && oldValue !== undefined
            ? typeof oldValue === 'object'
              ? JSON.stringify(oldValue)
              : String(oldValue)
            : null;
        const formattedNew =
          newValue !== null && newValue !== undefined
            ? typeof newValue === 'object'
              ? JSON.stringify(newValue)
              : String(newValue)
            : null;

        if (formattedOld !== formattedNew) {
          return {
            propertyName: item,
            oldValue: formattedOld,
            newValue: formattedNew,
            valueType,
          };
        }
        return undefined;
      })
      .filter((change): change is NonNullable<typeof change> => change !== undefined) as unknown as DataLogChangesEntity[];

    // Handle recordId/recordUuid - store based on ID type
    const entityId = entity?.id;
    let recordId: number | undefined;
    let recordUuid: string | undefined;

    if (typeof entityId === 'number') {
      recordId = entityId;
    } else if (typeof entityId === 'string') {
      recordUuid = entityId;
    }

    const logObj = {
      entityName: event.metadata.name,
      tableName: event.metadata.tableName,
      recordId,
      recordUuid,
      recordCode: entity?.code ?? '',
      logType,
      date: entity?.updatedAt || new Date(),
      changes,
    } as Omit<DataLogEntity, 'id'>;
    return logObj;
  }

  private static handleManyToManyRelations(event: UpdateEvent<LoggableEntity> | InsertEvent<LoggableEntity>): LoggableEntity {
    const manyToManyRelations = event.metadata.relations
      .filter((relation) => relation.isManyToMany)
      .map((relation) => relation.propertyName)
      .filter((propertyName) => !excludedFields.includes(propertyName));

    const entity = event.entity as LoggableEntity;

    if (entity) {
      for (const relationName of manyToManyRelations) {
        const relationListName = `${relationName}List`;
        const isRelationListExists = !!event.metadata.propertiesMap[relationListName];
        const relationValue = entity[relationName] as RelationItem[] | undefined;
        if (relationValue && Array.isArray(relationValue) && isRelationListExists) {
          const mappedValues = relationValue
            .map((item: RelationItem) => item?.id ?? item?.code ?? null)
            .filter((val): val is string | number => val !== null);
          entity[relationListName] = mappedValues.sort().join(',');
        }
      }
    }

    return entity;
  }

  async afterUpdate(event: UpdateEvent<LoggableEntity>) {
    try {
      if (loggingEntities.includes(event.metadata.name)) {
        if (!event.entity) return;
        const updatedFields = event.updatedColumns.map((item) => item.propertyName);
        event.updatedRelations.forEach((item) => {
          updatedFields.push(item.propertyName);
        });
        const filteredFields = updatedFields
          .filter((item) => !excludedFields.includes(item))
          .filter((item, index, array) => array.indexOf(item) === index);
        const logType = filteredFields.includes('deletedAt') ? LogTypes.softRemove : LogTypes.update;
        const logObj = LoggerSubscriber.fillLogObject(event, filteredFields, logType);
        const repository = event.manager.getRepository(DataLogEntity);
        await repository.save(logObj);
      }
    } catch (e) {
      LoggerSubscriber.logAuditError(
        this.afterUpdate.name,
        e,
        event as unknown as { metadata?: { name?: string }; entity?: { id?: unknown } },
      );
    }
  }

  async afterInsert(event: InsertEvent<LoggableEntity>) {
    try {
      if (loggingEntities.includes(event.metadata.name)) {
        const entity = event.entity;
        if (!entity) return;
        const createdFields = Object.keys(entity)
          .filter((item) => !excludedFields.includes(item) && entity[item] !== null && entity[item] !== undefined)
          .filter((item, index, array) => array.indexOf(item) === index);

        const logObj = LoggerSubscriber.fillLogObject(event, createdFields, LogTypes.insert);
        const repository = event.manager.getRepository(DataLogEntity);
        await repository.save(logObj);
      }
    } catch (e) {
      LoggerSubscriber.logAuditError(
        this.afterInsert.name,
        e,
        event as unknown as { metadata?: { name?: string }; entity?: { id?: unknown } },
      );
    }
  }

  beforeUpdate(event: UpdateEvent<LoggableEntity>) {
    try {
      if (loggingEntities.includes(event.metadata.name)) {
        event.entity = LoggerSubscriber.handleManyToManyRelations(event);
      }
    } catch (e) {
      LoggerSubscriber.logAuditError(
        this.beforeUpdate.name,
        e,
        event as unknown as { metadata?: { name?: string }; entity?: { id?: unknown } },
      );
    }
  }

  beforeInsert(event: InsertEvent<LoggableEntity>) {
    try {
      if (loggingEntities.includes(event.metadata.name)) {
        event.entity = LoggerSubscriber.handleManyToManyRelations(event);
      }
    } catch (e) {
      LoggerSubscriber.logAuditError(
        this.beforeInsert.name,
        e,
        event as unknown as { metadata?: { name?: string }; entity?: { id?: unknown } },
      );
    }
  }
}
