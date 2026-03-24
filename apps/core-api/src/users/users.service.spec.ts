/* eslint-disable @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-argument */
import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { UserProfileDto } from 'src/common/dto/user-profile.dto';
import { UserActivityTypes } from 'src/common/enums/user-activity-types';
import { UserStatus } from 'src/common/enums/user-status';
import { QueueService } from 'src/common/queue/queue.service';
import { ConfirmationsService } from 'src/confirmations/confirmations.service';
import { ContactEntity } from 'src/contacts/entities/contact.entity';
import { ExternalFilesEntity } from 'src/external-files/entities/external-files.entity';
import { ExternalFilesService } from 'src/external-files/external-files.service';
import { GroupEntity } from 'src/groups/entities/group.entity';
import { GroupBlockListEntity } from 'src/groups/entities/group-block-list.entity';
import { GroupMemberEntity } from 'src/groups/entities/group-member.entity';
import { FirestoreSyncService } from 'src/notifications/firestore-sync.service';
import { STATUS_UPDATE_SIDE_EFFECTS_QUEUE } from 'src/notifications/status-update.queue.constants';
import { UserActivitiesService } from 'src/user-activities/user-activities.service';
import { UserEntity } from 'src/users/entities/user.entity';
import { UserNotificationSettingsEntity } from 'src/users/entities/user-notification-settings.entity';
import { UserPasswordEntity } from 'src/users/entities/user-password.entity';
import { EntityManager, In, Repository, UpdateResult } from 'typeorm';

import { SessionActivityService } from './session-activity.service';
import { UsersService } from './users.service';

jest.mock('firebase-admin', () => {
  const firestore = () => ({
    collection: jest.fn().mockReturnThis(),
    doc: jest.fn().mockReturnThis(),
    batch: jest.fn(() => ({
      set: jest.fn(),
      commit: jest.fn().mockResolvedValue(true),
    })),
  });
  firestore.FieldValue = {
    serverTimestamp: jest.fn(),
  };

  return { firestore };
});

describe('UsersService', () => {
  let service: UsersService;

  let repository: jest.Mocked<Repository<UserEntity>>;
  let groupRepository: jest.Mocked<Repository<GroupEntity>>;
  let blockListRepository: jest.Mocked<Repository<GroupBlockListEntity>>;
  let memberRepository: jest.Mocked<Repository<GroupMemberEntity>>;
  let contactRepository: jest.Mocked<Repository<ContactEntity>>;
  let userActivitiesService: jest.Mocked<UserActivitiesService>;
  let externalFilesService: jest.Mocked<ExternalFilesService>;
  let queueService: jest.Mocked<QueueService>;
  let firestoreSyncService: jest.Mocked<FirestoreSyncService>;

  const mockUser = {
    id: 'user1',
    firstName: 'John',
    lastName: 'Doe',
    fcmToken: 'token-abc',
    status: UserStatus.UNKNOWN,
    groups: [
      {
        members: [
          { id: 'user1', fcmToken: 'token-abc' },
          { id: 'user2', fcmToken: 'token-xyz' },
        ],
      },
    ],
  } as unknown as UserEntity;

  const mockUserProfile: UserProfileDto = {
    id: 'user1',
    email: 'test@example.com',
    firstName: 'John',
    lastName: 'Doe',
    fullName: 'John Doe',
    phone: null,
    middleName: undefined,
  };

  //
  // MOCK FACTORIES
  //
  const createRepoMock = () => {
    const qb = {
      select: jest.fn().mockReturnThis(),
      innerJoin: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      getExists: jest.fn(),
      getOne: jest.fn(),
      getRawOne: jest.fn(),
      getMany: jest.fn().mockResolvedValue([]),
    };
    return {
      findOne: jest.fn(),
      findOneBy: jest.fn(),
      find: jest.fn(),
      update: jest.fn(),
      save: jest.fn(),
      remove: jest.fn(),
      delete: jest.fn(),
      existsBy: jest.fn(),
      create: jest.fn(),

      manager: {
        transaction: jest.fn().mockImplementation((fn) => {
          const trx = {
            findOne: jest.fn(),
            save: jest.fn(),
            remove: jest.fn(),
            queryRunner: {},
            getRepository: jest.fn().mockImplementation((entity) => {
              if (entity === UserEntity) return repository;
              if (entity === GroupMemberEntity) return memberRepository;
              return createRepoMock();
            }),
          } as unknown as EntityManager;
          return fn(trx);
        }),
        getRepository: jest.fn().mockImplementation((entity) => {
          if (entity === UserEntity) return repository;
          if (entity === GroupMemberEntity) return memberRepository;
          return createRepoMock();
        }),
      },
      createQueryBuilder: jest.fn(() => qb),
    } as unknown as jest.Mocked<Repository<any>>;
  };

  const mockConfirmationsService = () => ({
    setupPasswordCode: jest.fn(),
  });

  const mockUserActivitiesService = () => ({
    logActivity: jest.fn(),
  });

  const mockExternalFilesService = () => ({
    replaceFile: jest.fn(),
    getStreamableFile: jest.fn(),
    delete: jest.fn(),
  });

  const mockQueueService = () => ({
    send: jest.fn().mockResolvedValue(undefined),
  });

  //
  // BEFORE EACH
  //
  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: getRepositoryToken(UserEntity), useValue: createRepoMock() },
        { provide: getRepositoryToken(UserPasswordEntity), useValue: createRepoMock() },
        { provide: ConfirmationsService, useValue: mockConfirmationsService() },
        { provide: UserActivitiesService, useValue: mockUserActivitiesService() },
        { provide: ExternalFilesService, useValue: mockExternalFilesService() },
        { provide: FirestoreSyncService, useValue: { sendSyncSignal: jest.fn() } },
        { provide: getRepositoryToken(GroupEntity), useValue: createRepoMock() },
        { provide: getRepositoryToken(GroupBlockListEntity), useValue: createRepoMock() },
        { provide: getRepositoryToken(GroupMemberEntity), useValue: createRepoMock() },
        { provide: getRepositoryToken(ContactEntity), useValue: createRepoMock() },
        { provide: getRepositoryToken(UserNotificationSettingsEntity), useValue: createRepoMock() },
        { provide: QueueService, useValue: mockQueueService() },
        { provide: SessionActivityService, useValue: { trackActivity: jest.fn() } },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    repository = module.get(getRepositoryToken(UserEntity));
    groupRepository = module.get(getRepositoryToken(GroupEntity));
    blockListRepository = module.get(getRepositoryToken(GroupBlockListEntity));
    memberRepository = module.get(getRepositoryToken(GroupMemberEntity));
    contactRepository = module.get(getRepositoryToken(ContactEntity));
    userActivitiesService = module.get(UserActivitiesService);
    externalFilesService = module.get(ExternalFilesService);
    queueService = module.get(QueueService);
    firestoreSyncService = module.get(FirestoreSyncService);
  });

  //
  // TEST SUITE
  //

  describe('updateStatus', () => {
    it('updates status and enqueues side-effects', async () => {
      repository.findOne.mockResolvedValue(mockUser);
      repository.save.mockResolvedValue(mockUser);

      await service.updateStatus('user1', UserStatus.SAFE, { memberUserIds: ['user2'] });

      expect(repository.save).toHaveBeenCalled();
      expect(queueService.send).toHaveBeenCalledWith(STATUS_UPDATE_SIDE_EFFECTS_QUEUE, {
        senderUserId: mockUser.id,
        status: UserStatus.SAFE,
        memberUserIds: ['user2'],
      });
    });

    it('returns undefined if user not found', async () => {
      repository.findOne.mockResolvedValue(null);

      const res = await service.updateStatus('x', UserStatus.SAFE);
      expect(res).toBeUndefined();
      expect(queueService.send).not.toHaveBeenCalled();
    });
  });

  describe('saveFcmToken', () => {
    it('updates token', async () => {
      repository.update.mockResolvedValue({ affected: 1 } as UpdateResult);

      const res = await service.saveFcmToken('u1', 't-123');

      expect(repository.update).toHaveBeenCalledWith({ id: 'u1' }, { fcmToken: 't-123' });

      expect(res).toEqual({ message: 'Token updated' });
    });
  });

  describe('upsertFile', () => {
    it('replaces file', async () => {
      // Manual mock for the specific transaction in this test
      const trx = {
        findOne: jest.fn().mockResolvedValue({ id: 'user1', file: null }),
        save: jest.fn().mockResolvedValue({ id: 'user1', file: { id: 'file123' } }),
        queryRunner: {},
      } as unknown as EntityManager;

      // Override the default mock implementation for this test
      (repository.manager.transaction as jest.Mock).mockImplementation((fn) => fn(trx));

      externalFilesService.replaceFile.mockResolvedValue({ id: 'file123' } as ExternalFilesEntity);

      await service.upsertFile(
        'user1',
        {
          originalname: 'a.png',
          buffer: Buffer.from('123'),
          mimetype: 'image/png',
        } as Express.Multer.File,
        'user1',
      );

      expect(externalFilesService.replaceFile).toHaveBeenCalled();

      // Ensure we check that save was called with the user object
      expect(trx.save).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'user1',
          file: { id: 'file123' },
        }),
      );
    });

    it('throws if user not found inside transaction', async () => {
      const trx = {
        findOne: jest.fn().mockResolvedValue(null),
        save: jest.fn(),
        queryRunner: {},
      } as unknown as EntityManager;

      (repository.manager.transaction as jest.Mock).mockImplementation((fn) => fn(trx));

      await expect(service.upsertFile('x', {} as Express.Multer.File, 'x')).rejects.toThrow(NotFoundException);
    });
  });

  describe('getFile', () => {
    it('returns stream if same user', async () => {
      repository.findOne.mockResolvedValue({ file: { id: 'f1' } } as UserEntity);
      externalFilesService.getStreamableFile.mockReturnValue('STREAM' as any);

      const res = await service.getFile('u1', 'u1');
      expect(res).toBe('STREAM');
    });

    it('returns stream if users share a group', async () => {
      repository.findOne.mockResolvedValue({ file: { id: 'f1' } } as UserEntity);
      externalFilesService.getStreamableFile.mockReturnValue('STREAM' as any);

      const qb = memberRepository.createQueryBuilder();
      (qb.getExists as jest.Mock).mockResolvedValue(true);

      const res = await service.getFile('target-user', 'requester-user');
      expect(res).toBe('STREAM');
      expect(qb.getExists).toHaveBeenCalled();
    });

    it('throws if no user', async () => {
      repository.findOne.mockResolvedValue(null);
      await expect(service.getFile('x', 'x')).rejects.toThrow(NotFoundException);
    });

    it('throws if not same user and no shared group', async () => {
      repository.findOne.mockResolvedValue({ file: { id: 'f1' } } as UserEntity);
      const qb = memberRepository.createQueryBuilder();
      (qb.getExists as jest.Mock).mockResolvedValue(false);

      await expect(service.getFile('u1', 'u2')).rejects.toThrow(NotFoundException);
    });
  });

  describe('removeFile', () => {
    it('removes file', async () => {
      // Mock EntityManager for removeFile
      const manager = {
        findOne: jest.fn().mockResolvedValue({ id: 'u1', file: { id: 'f1' } }),
        save: jest.fn().mockResolvedValue({ id: 'u1', file: undefined }),
        queryRunner: {},
      } as unknown as EntityManager;

      await service.removeFile('u1', 'u1', manager);

      expect(externalFilesService.delete).toHaveBeenCalledWith('f1', manager.queryRunner);

      // In service: await entityManager.save(UserEntity, user);
      // We check that save was called.
      expect(manager.save).toHaveBeenCalled();
    });

    it('throws if user missing', async () => {
      const manager = {
        findOne: jest.fn().mockResolvedValue(null),
        queryRunner: {},
      } as unknown as EntityManager;

      await expect(service.removeFile('x', 'x', manager)).rejects.toThrow(NotFoundException);
    });
  });

  describe('getOne', () => {
    it('returns user', async () => {
      repository.findOneBy.mockResolvedValue(mockUser);

      const res = await service.getOne('user1', mockUserProfile);
      expect(res).toEqual(mockUser);
      expect(repository.findOneBy).toHaveBeenCalledWith({ id: 'user1' });
    });

    it('throws if not found', async () => {
      repository.findOneBy.mockResolvedValue(null);

      await expect(service.getOne('x', { id: 'x' } as any)).rejects.toThrow(NotFoundException);
    });
  });

  describe('save', () => {
    it('creates new user', async () => {
      repository.save.mockResolvedValue({ id: 'u1', email: 'a@a.com' } as UserEntity);

      await service.save(
        { email: 'a@a.com' } as any,
        {} as any,
        true, // isNew = true
        { id: 'u1' } as any,
      );

      expect(userActivitiesService.logActivity).toHaveBeenCalledWith(UserActivityTypes.createUser, {}, { userId: 'u1' });
    });

    it('creates new user with location info', async () => {
      repository.save.mockResolvedValue({
        id: 'u1',
        email: 'a@a.com',
        latitude: 50.4501,
        longitude: 30.5234,
        region: 'Kyiv',
        district: 'Shevchenkivskyi',
      } as UserEntity);

      const res = await service.save(
        {
          email: 'a@a.com',
          latitude: 50.4501,
          longitude: 30.5234,
          region: 'Kyiv',
          district: 'Shevchenkivskyi',
        } as any,
        {} as any,
        true,
        { id: 'u1' } as any,
      );

      expect(res.latitude).toBe(50.4501);
      expect(res.district).toBe('Shevchenkivskyi');
      expect(repository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          latitude: 50.4501,
          district: 'Shevchenkivskyi',
        }),
      );
    });

    it('modifies existing user with location info', async () => {
      repository.existsBy.mockResolvedValue(true);
      repository.save.mockResolvedValue({
        id: 'u1',
        latitude: 49.8397,
        longitude: 24.0297,
      } as UserEntity);

      await service.save({ id: 'u1', latitude: 49.8397, longitude: 24.0297 } as any, {} as any, false, { id: 'u1' } as any);

      expect(repository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          latitude: 49.8397,
          longitude: 24.0297,
        }),
      );
    });

    it('modifies existing user', async () => {
      repository.existsBy.mockResolvedValue(true);
      repository.save.mockResolvedValue({ id: 'u1' } as UserEntity);

      await service.save(
        { id: 'u1', email: 'x' } as any,
        {} as any,
        false, // isNew = false
        { id: 'u1' } as any,
      );

      expect(userActivitiesService.logActivity).toHaveBeenCalledWith(UserActivityTypes.modifyUser, {}, { userId: 'u1' });
    });

    it('throws if modifying missing', async () => {
      // isNew = false
      repository.existsBy.mockResolvedValue(false);

      await expect(service.save({ id: 'wrong' } as any, {} as any, false, { id: 'wrong' } as any)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('getTokensForUsers', () => {
    it('returns tokens for users with enabled notifications', async () => {
      const users = [
        { id: 'u1', fcmToken: 't1', notificationSettings: { enabled: true, prefs: { k: true } } },
        { id: 'u2', fcmToken: 't2', notificationSettings: { enabled: true, prefs: { k: false } } },
        { id: 'u3', fcmToken: 't3', notificationSettings: { enabled: false } },
        { id: 'u4', fcmToken: null },
        { id: 'u5', fcmToken: 't5', notificationSettings: null },
      ] as any[];

      repository.find.mockResolvedValue(users);

      const tokens = await service.getTokensForUsers(['u1', 'u2', 'u3', 'u4', 'u5'], 'k');

      // u1: has token, enabled, pref k is true -> YES
      // u2: has token, enabled, pref k is false -> NO
      // u3: has token, disabled -> NO
      // u4: no token -> NO
      // u5: has token, no settings record (defaults to true) -> YES
      expect(tokens).toEqual(['t1', 't5']);
    });

    it('returns all tokens if no settingKey provided and enabled', async () => {
      const users = [
        { id: 'u1', fcmToken: 't1', notificationSettings: { enabled: true } },
        { id: 'u2', fcmToken: 't2', notificationSettings: null },
      ] as any[];

      repository.find.mockResolvedValue(users);

      const tokens = await service.getTokensForUsers(['u1', 'u2']);

      expect(tokens).toEqual(['t1', 't2']);
    });
  });

  describe('resetPassword', () => {
    it('sends a password reset code when user exists', async () => {
      repository.findOne.mockResolvedValue({ id: 'user1', email: 'test@example.com' } as UserEntity);

      const res = await service.resetPassword('user1', {} as any);

      expect(res).toEqual({ success: true, message: 'Код для скидання паролю надіслано на пошту' });
    });

    it('throws if user not found', async () => {
      repository.findOne.mockResolvedValue(null);

      await expect(service.resetPassword('x', {} as any)).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('removes a member user from groups, contacts, and syncs impacted users', async () => {
      memberRepository.find
        .mockResolvedValueOnce([{ groupId: 'g1', userId: 'u1' } as GroupMemberEntity])
        .mockResolvedValueOnce([
          { groupId: 'g1', userId: 'u1' } as GroupMemberEntity,
          { groupId: 'g1', userId: 'u2' } as GroupMemberEntity,
          { groupId: 'g1', userId: 'u3' } as GroupMemberEntity,
        ]);
      groupRepository.find.mockResolvedValueOnce([]);
      groupRepository.find.mockResolvedValueOnce([]);
      memberRepository.delete.mockResolvedValue({ affected: 1 } as any);
      contactRepository.delete.mockResolvedValue({ affected: 2 } as any);
      repository.delete.mockResolvedValue({ affected: 1 } as any);

      const res = await service.remove('u1', { id: 'u1' } as any, {} as any);

      expect(memberRepository.delete).toHaveBeenCalledWith({ userId: 'u1' });
      expect(contactRepository.delete).toHaveBeenCalledWith([{ ownerId: 'u1' }, { targetId: 'u1' }]);
      expect(groupRepository.delete).not.toHaveBeenCalled();
      expect(repository.delete).toHaveBeenCalledWith('u1');
      expect(firestoreSyncService.sendSyncSignal).toHaveBeenCalledWith(['u2', 'u3']);
      expect(userActivitiesService.logActivity).toHaveBeenCalled();
      expect(res).toEqual({ success: true });
    });

    it('removes owned groups before deleting the owner and syncs affected members', async () => {
      memberRepository.find
        .mockResolvedValueOnce([{ groupId: 'g-owner', userId: 'owner-1' } as GroupMemberEntity])
        .mockResolvedValueOnce([
          { groupId: 'g-owner', userId: 'owner-1' } as GroupMemberEntity,
          { groupId: 'g-owner', userId: 'member-1' } as GroupMemberEntity,
        ]);
      groupRepository.find
        .mockResolvedValueOnce([{ id: 'g-owner', ownerId: 'owner-1' } as GroupEntity])
        .mockResolvedValueOnce([{ id: 'g-owner', ownerId: 'owner-1' } as GroupEntity]);
      blockListRepository.delete.mockResolvedValue({ affected: 1 } as any);
      memberRepository.delete.mockResolvedValue({ affected: 1 } as any);
      groupRepository.delete.mockResolvedValue({ affected: 1 } as any);
      contactRepository.delete.mockResolvedValue({ affected: 0 } as any);
      repository.delete.mockResolvedValue({ affected: 1 } as any);

      await service.remove('owner-1', { id: 'owner-1' } as any, {} as any);

      expect(blockListRepository.delete).toHaveBeenCalledWith({ groupId: In(['g-owner']) });
      expect(memberRepository.delete).toHaveBeenCalledWith({ groupId: In(['g-owner']) });
      expect(groupRepository.delete).toHaveBeenCalledWith({ id: In(['g-owner']) });
      expect(memberRepository.delete).toHaveBeenCalledWith({ userId: 'owner-1' });
      expect(firestoreSyncService.sendSyncSignal).toHaveBeenCalledWith(['member-1']);
    });

    it('throws if not found', async () => {
      memberRepository.find.mockResolvedValueOnce([]);
      groupRepository.find.mockResolvedValueOnce([]);
      groupRepository.find.mockResolvedValueOnce([]);
      memberRepository.delete.mockResolvedValue({ affected: 0 } as any);
      contactRepository.delete.mockResolvedValue({ affected: 0 } as any);
      repository.delete.mockResolvedValue({ affected: 0 } as any);

      await expect(service.remove('x', { id: 'x' } as any, {} as any)).rejects.toThrow(NotFoundException);
    });
  });
});
